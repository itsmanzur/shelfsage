<?php
/**
 * Architect: proxy product/taxonomy lists to admin-ajax when REST is blocked (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * AJAX fallback: POST /shelfsage/v1/test-api-connection.
 */
add_action( 'wp_ajax_trsss_ajax_test_api_connection', 'trsss_ajax_test_api_connection_handler' );
function trsss_ajax_test_api_connection_handler() {
	check_ajax_referer( 'trsss_ajax_save_settings', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
	}
	$payload = isset( $_POST['payload'] ) ? json_decode( wp_unslash( $_POST['payload'] ), true ) : array();
	$req     = new WP_REST_Request( 'POST', '/shelfsage/v1/test-api-connection' );
	$req->set_body( wp_json_encode( is_array( $payload ) ? $payload : array() ) );
	$req->set_header( 'Content-Type', 'application/json' );

	$response = trsss_test_api_connection( $req );
	$data     = $response instanceof WP_REST_Response ? $response->get_data() : array( 'ok' => false, 'message' => 'Handler error' );

	wp_send_json_success( $data );
}

/**
 * AJAX fallback: GET /shelfsage/v1/search (Architect live preview when REST goes through AJAX mode).
 */
add_action( 'wp_ajax_trsss_ajax_rest_search_fallback', 'trsss_ajax_rest_search_fallback' );
function trsss_ajax_rest_search_fallback() {
	check_ajax_referer( 'trsss_ajax_list_shortcodes', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
	}
	$qs = isset( $_POST['query_string'] ) ? wp_unslash( $_POST['query_string'] ) : '';
	$params = array();
	if ( is_string( $qs ) && $qs !== '' ) {
		parse_str( $qs, $params );
	}
	$req = new WP_REST_Request( 'GET', '/shelfsage/v1/search' );
	foreach ( $params as $key => $val ) {
		if ( ! is_string( $key ) || ! preg_match( '/^[a-zA-Z0-9_]+$/', $key ) ) {
			continue;
		}
		$req->set_param( $key, $val );
	}

	$result = trsss_handle_search( $req );
	if ( is_wp_error( $result ) ) {
		$data   = $result->get_error_data();
		$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 400;
		wp_send_json_error( array( 'message' => $result->get_error_message() ), $status );
	}

	wp_send_json_success( $result );
}

/**
 * AJAX fallback: GET /shelfsage/v1/filters.
 */
add_action( 'wp_ajax_trsss_ajax_rest_filters_fallback', 'trsss_ajax_rest_filters_fallback' );
function trsss_ajax_rest_filters_fallback() {
	check_ajax_referer( 'trsss_ajax_list_shortcodes', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
	}
	$req    = new WP_REST_Request( 'GET', '/shelfsage/v1/filters' );
	$result = trsss_handle_filters( $req );
	if ( is_wp_error( $result ) ) {
		$data   = $result->get_error_data();
		$status = is_array( $data ) && isset( $data['status'] ) ? (int) $data['status'] : 400;
		wp_send_json_error( array( 'message' => $result->get_error_message() ), $status );
	}

	wp_send_json_success( $result );
}

/**
 * AJAX fallback: Products & Taxonomy Terms (Shortcode Architect uses this)
 */
add_action( 'wp_ajax_trsss_ajax_get_products_or_terms', 'trsss_ajax_get_products_or_terms_handler' );
function trsss_ajax_get_products_or_terms_handler() {
	check_ajax_referer( 'trsss_ajax_list_shortcodes', 'nonce' );
	if ( ! current_user_can( 'edit_posts' ) ) {
		wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
	}
	$endpoint = isset( $_POST['endpoint'] ) ? sanitize_text_field( wp_unslash( $_POST['endpoint'] ) ) : '';

	if ( strpos( $endpoint, '/products' ) !== false ) {
		$req      = new WP_REST_Request( 'GET' );
		$response = trsss_get_products_rest( $req );
		$data     = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
		wp_send_json_success( $data );
	} elseif ( strpos( $endpoint, '/taxonomies/' ) !== false ) {
		preg_match( '#/taxonomies/([a-zA-Z0-9_-]+)#', $endpoint, $m );
		$taxonomy = isset( $m[1] ) ? sanitize_key( $m[1] ) : '';
		$req      = new WP_REST_Request( 'GET' );
		$req->set_param( 'taxonomy', $taxonomy );
		$response = trsss_get_taxonomy_terms_rest( $req );
		$data     = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
		wp_send_json_success( $data );
	} else {
		wp_send_json_success( array() );
	}
}