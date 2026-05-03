<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Secure Google Books API handler for ShelfSage.
 * Fetches book metadata server-side via wp_remote_get.
 */
class TRSSS_Google_Books_API {

	public function __construct() {
		add_action( 'rest_api_init', array( $this, 'register_route' ) );
	}

	/**
	 * Register REST API route: POST /shelfsage/v1/fetch-books
	 */
	public function register_route() {
		register_rest_route( 'shelfsage/v1', '/fetch-books', array(
			'methods'             => 'POST',
			'callback'            => array( $this, 'handle_fetch' ),
			'permission_callback' => array( $this, 'permission_check' ),
			'args'                => array(
				'query'       => array(
					'required'          => true,
					'type'              => 'string',
					'sanitize_callback' => 'sanitize_text_field',
				),
				'max_results' => array(
					'type'              => 'integer',
					'default'            => 1,
					'sanitize_callback' => function ( $v ) {
						return min( 20, max( 1, absint( $v ) ) );
					},
				),
			),
		) );
	}

	/**
	 * Verify nonce and manage_options capability. Only admins can trigger this API.
	 */
	public function permission_check( $request ) {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Handle the fetch request. Uses wp_remote_get server-side.
	 */
	public function handle_fetch( $request ) {
		$params = $request->get_json_params() ?: array();
		$query  = isset( $params['query'] ) ? sanitize_text_field( $params['query'] ) : '';
		$max   = isset( $params['max_results'] ) ? min( 20, max( 1, absint( $params['max_results'] ) ) ) : 1;

		if ( empty( $query ) ) {
			return new WP_Error( 'missing_query', __( 'Please provide a Title or ISBN.', 'shelfsage' ), array( 'status' => 400 ) );
		}

		$api_key = $this->get_api_key();
		if ( empty( $api_key ) ) {
			return new WP_Error( 'missing_api_key', __( 'Google Books API Key is required. Add it in Settings → Connect & Data.', 'shelfsage' ), array( 'status' => 403 ) );
		}

		$url = 'https://www.googleapis.com/books/v1/volumes?q=' . rawurlencode( $query ) . '&maxResults=' . $max . '&key=' . rawurlencode( $api_key );

		$response = wp_remote_get( $url, array(
			'timeout' => 15,
			'headers' => array( 'Accept' => 'application/json' ),
		) );

		if ( is_wp_error( $response ) ) {
			return new WP_Error( 'api_error', __( 'Failed to connect to Google Books API.', 'shelfsage' ), array( 'status' => 500 ) );
		}

		$code = wp_remote_retrieve_response_code( $response );
		if ( $code === 401 || $code === 403 ) {
			return new WP_Error( 'unauthorized', __( 'Google Books API returned an unauthorized error. Check your API key and quota.', 'shelfsage' ), array( 'status' => 403 ) );
		}

		$body = wp_remote_retrieve_body( $response );
		$data = json_decode( $body, true );

		if ( empty( $data ) || ! isset( $data['items'] ) ) {
			return new WP_Error( 'no_results', __( 'No books found for this query.', 'shelfsage' ), array( 'status' => 404 ) );
		}

		// Sanitize outgoing metadata
		foreach ( $data['items'] as &$item ) {
			if ( isset( $item['volumeInfo'] ) ) {
				$vi = &$item['volumeInfo'];
				if ( isset( $vi['title'] ) ) $vi['title'] = sanitize_text_field( $vi['title'] );
				if ( isset( $vi['authors'] ) && is_array( $vi['authors'] ) ) {
					$vi['authors'] = array_map( 'sanitize_text_field', $vi['authors'] );
				}
				if ( isset( $vi['description'] ) ) $vi['description'] = wp_kses_post( $vi['description'] );
			}
		}

		return rest_ensure_response( array( 'success' => true, 'data' => $data ) );
	}

	/**
	 * Get API key from shelfsage_settings (stored via Global Settings).
	 */
	private function get_api_key() {
		$settings = trsss_get_shelfsage_settings_array();
		return isset( $settings['google_books_api_key'] ) ? trim( (string) $settings['google_books_api_key'] ) : '';
	}
}
