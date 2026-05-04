<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Additional Google Books endpoints, AJAX, and standalone option bridge.
 *
 * Works alongside {@see TRSSS_Google_Books_API}.
 */
class TRSSS_Google_Books_Enhanced {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_routes' ) );
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'wp_ajax_rmss_fetch_google_books', array( $this, 'ajax_fetch_books' ) );
	}

	/**
	 * Register formal settings
	 */
	public function register_settings() {
		register_setting(
			'shelfsage_options',
			'shelfsage_google_api_key',
			array(
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'show_in_rest'      => true,
				'default'           => '',
			)
		);

		add_settings_section(
			'shelfsage_google_section',
			__( 'Google Books API Settings', 'shelfsage' ),
			null,
			'shelfsage-settings'
		);

		add_settings_field(
			'shelfsage_google_api_key',
			__( 'Google Books API Key', 'shelfsage' ),
			array( $this, 'render_api_key_field' ),
			'shelfsage-settings',
			'shelfsage_google_section'
		);
	}

	public function render_api_key_field() {
		$key = get_option( 'shelfsage_google_api_key', '' );
		echo '<input type="password" name="shelfsage_google_api_key" value="' . esc_attr( $key ) . '" class="regular-text" placeholder="AIzaSy...">';
	}

	/**
	 * Register REST API routes
	 */
	public function register_routes() {
		register_rest_route(
			'shelfsage/v1',
			'/fetch-books',
			array(
				'methods'             => 'POST',
				'callback'            => array( $this, 'handle_fetch_request' ),
				'permission_callback' => array( $this, 'permissions_check' ),
			)
		);

		register_rest_route(
			'shelfsage/v1',
			'/settings/google-books',
			array(
				array(
					'methods'             => 'GET',
					'callback'            => array( $this, 'get_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
				array(
					'methods'             => 'POST',
					'callback'            => array( $this, 'update_settings' ),
					'permission_callback' => array( $this, 'permissions_check' ),
				),
			)
		);
	}

	public function get_settings() {
		return rest_ensure_response(
			array(
				'google_books_api_key' => get_option( 'shelfsage_google_api_key', '' ),
			)
		);
	}

	public function update_settings( $request ) {
		$params = $request->get_json_params();
		if ( isset( $params['google_books_api_key'] ) ) {
			update_option( 'shelfsage_google_api_key', sanitize_text_field( $params['google_books_api_key'] ) );
		}
		return rest_ensure_response( array( 'success' => true ) );
	}

	public function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle fetch request from frontend
	 */
	public function handle_fetch_request( $request ) {
		$params = $request->get_json_params();
		$query  = isset( $params['query'] ) ? sanitize_text_field( $params['query'] ) : '';

		if ( empty( $query ) ) {
			return new WP_Error( 'missing_query', 'Please provide a Title or ISBN.', array( 'status' => 400 ) );
		}

		$api_key = get_option( 'shelfsage_google_api_key', '' );
		if ( empty( $api_key ) ) {
			$main_settings = trsss_get_shelfsage_settings_array();
			$api_key       = trsss_get_decrypted_setting_secret( $main_settings, 'google_books_api_key' );
		}

		$max_results = isset( $params['max_results'] ) ? min( 20, max( 1, intval( $params['max_results'] ) ) ) : 1;

		$cache_key = 'trsss_gb_search_' . md5( $query . '|' . $max_results );
		$cached    = trsss_book_api_cache_get( $cache_key );
		if ( false !== $cached ) {
			return rest_ensure_response( array( 'success' => true, 'data' => $cached ) );
		}

		$url = 'https://www.googleapis.com/books/v1/volumes?q=' . urlencode( $query ) . '&maxResults=' . $max_results;
		if ( ! empty( $api_key ) ) {
			$url .= '&key=' . urlencode( $api_key );
		}

		$response = wp_remote_get(
			$url,
			array(
				'timeout'   => 15,
				'sslverify' => apply_filters( 'shelfsage_google_books_sslverify', true ),
				'headers'   => array( 'Accept' => 'application/json' ),
			)
		);

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'api_error', 'Failed to connect to Google Books API.', array( 'status' => 500 ) );
		}

		$code = wp_remote_retrieve_response_code( $response );
		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( $code >= 400 ) {
			$err_msg = isset( $data['error']['message'] ) ? $data['error']['message'] : 'Google Books API error (HTTP ' . $code . ').';
			if ( strpos( $err_msg, 'Quota exceeded' ) !== false ) {
				$err_msg = 'Daily Google Books quota exceeded. Results are now cached for 24h.';
			}
			return new WP_Error( 'api_error', $err_msg, array( 'status' => $code ) );
		}

		if ( empty( $data ) || ! isset( $data['items'] ) ) {
			$err_msg = isset( $data['error']['message'] ) ? $data['error']['message'] : 'No books found for this query.';
			return new WP_Error( 'no_results', $err_msg, array( 'status' => 404 ) );
		}

		foreach ( $data['items'] as &$item ) {
			if ( isset( $item['volumeInfo'] ) ) {
				$vi = &$item['volumeInfo'];
				if ( isset( $vi['title'] ) ) {
					$vi['title'] = sanitize_text_field( $vi['title'] );
				}
				if ( isset( $vi['authors'] ) && is_array( $vi['authors'] ) ) {
					$vi['authors'] = array_map( 'sanitize_text_field', $vi['authors'] );
				}
				if ( isset( $vi['description'] ) ) {
					$vi['description'] = wp_kses_post( $vi['description'] );
				}
			}
		}

		trsss_book_api_cache_set( $cache_key, $data, 24 * HOUR_IN_SECONDS );

		return rest_ensure_response( array( 'success' => true, 'data' => $data ) );
	}

	/**
	 * AJAX handler for Smart Book Ingester
	 */
	public function ajax_fetch_books() {
		check_ajax_referer( 'rmss_fetch_google_books', 'nonce' );
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => 'Permission denied.' ) );
		}
		$query       = isset( $_POST['query'] ) ? sanitize_text_field( wp_unslash( $_POST['query'] ) ) : '';
		$max_results = isset( $_POST['max_results'] ) ? min( 20, max( 1, absint( $_POST['max_results'] ) ) ) : 10;
		if ( empty( $query ) ) {
			wp_send_json_error( array( 'message' => 'Please provide a Title or ISBN.' ) );
		}
		$request  = new WP_REST_Request( 'POST' );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'query' => $query, 'max_results' => $max_results ) ) );
		$response = $this->handle_fetch_request( $request );
		if ( is_wp_error( $response ) ) {
			wp_send_json_error( array( 'message' => $response->get_error_message() ) );
		}
		$data = $response->get_data();
		wp_send_json_success( $data );
	}
}
