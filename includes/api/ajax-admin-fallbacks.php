<?php
/**
 * ShelfSage admin-ajax REST fallbacks (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Amazon search AJAX fallback (avoids REST 403 cookie auth issues)
add_action( 'wp_ajax_rmss_amazon_search', 'trsss_ajax_amazon_search' );
function trsss_ajax_amazon_search() {
	check_ajax_referer( 'rmss_amazon_search', 'nonce' );
	if ( ! current_user_can( 'manage_options' ) ) {
		wp_send_json_error( array( 'message' => 'Permission denied.' ) );
	}
	$query       = isset( $_POST['query'] ) ? sanitize_text_field( wp_unslash( $_POST['query'] ) ) : '';
	$search_type = isset( $_POST['search_type'] ) ? sanitize_text_field( wp_unslash( $_POST['search_type'] ) ) : 'keywords';
	if ( empty( $query ) ) {
		wp_send_json_error( array( 'message' => 'Search query is required.' ) );
	}
	$request = new WP_REST_Request( 'POST' );
	$request->set_header( 'Content-Type', 'application/json' );
	$request->set_body( wp_json_encode( array( 'query' => $query, 'search_type' => $search_type ) ) );
	$response = trsss_amazon_search( $request );
	if ( is_wp_error( $response ) ) {
		wp_send_json_error( array( 'message' => $response->get_error_message() ) );
	}
	$data = $response->get_data();
	wp_send_json_success( $data );
}

// ─────────────────────────────────────────────────────────────────────────────
// AJAX FALLBACKS — লাইভ সার্ভারে REST API blocked হলে admin-ajax.php ব্যবহার করে
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AJAX fallback: Save Settings (লাইভে REST API blocked থাকলে এটি কাজ করবে)
 */
add_action( 'wp_ajax_trsss_ajax_save_settings', 'trsss_ajax_save_settings_handler' );
function trsss_ajax_save_settings_handler() {
    check_ajax_referer( 'trsss_ajax_save_settings', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
    }
    $raw = isset( $_POST['settings'] ) ? wp_unslash( $_POST['settings'] ) : '{}';
    $params = json_decode( $raw, true );
    if ( ! is_array( $params ) ) {
        wp_send_json_error( array( 'message' => 'Invalid settings data.' ), 400 );
    }
    // Reuse settings class update logic
    $settings_obj = new TRSSS_Settings();
    $request = new WP_REST_Request( 'POST' );
    $request->set_header( 'Content-Type', 'application/json; charset=' . get_option( 'blog_charset' ) );
    $request->set_body( wp_json_encode( $params ) );
    $response = $settings_obj->update_settings( $request );
    if ( is_wp_error( $response ) ) {
        wp_send_json_error( array( 'message' => $response->get_error_message() ) );
    }
    $data = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
    wp_send_json_success( $data );
}

/**
 * AJAX fallback: Get Settings
 */
add_action( 'wp_ajax_trsss_ajax_get_settings', 'trsss_ajax_get_settings_handler' );
function trsss_ajax_get_settings_handler() {
    check_ajax_referer( 'trsss_ajax_save_settings', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
    }
    $settings_obj = new TRSSS_Settings();
    $data = $settings_obj->get_settings();
    wp_send_json_success( $data );
}

/**
 * AJAX fallback: List Shortcodes
 */
add_action( 'wp_ajax_trsss_ajax_list_shortcodes', 'trsss_ajax_list_shortcodes_handler' );
function trsss_ajax_list_shortcodes_handler() {
    check_ajax_referer( 'trsss_ajax_list_shortcodes', 'nonce' );
    if ( ! current_user_can( 'edit_posts' ) ) {
        wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
    }
    $response = trsss_list_shortcodes();
    if ( is_wp_error( $response ) ) {
        wp_send_json_error( array( 'message' => $response->get_error_message() ) );
    }
    $data = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
    wp_send_json_success( $data );
}

/**
 * AJAX fallback: Save / Update Shortcode
 */
add_action( 'wp_ajax_trsss_ajax_save_shortcode_v2', 'trsss_ajax_save_shortcode_v2_handler' );
function trsss_ajax_save_shortcode_v2_handler() {
    check_ajax_referer( 'trsss_ajax_save_shortcode_v2', 'nonce' );
    if ( ! current_user_can( 'manage_options' ) ) {
        wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
    }
    $raw      = isset( $_POST['data'] ) ? wp_unslash( $_POST['data'] ) : '{}';
    $params   = json_decode( $raw, true );
    $post_id  = isset( $_POST['id'] ) ? absint( $_POST['id'] ) : 0;
    $action   = isset( $_POST['crud_action'] ) ? sanitize_text_field( wp_unslash( $_POST['crud_action'] ) ) : 'create';

    if ( ! is_array( $params ) ) {
        wp_send_json_error( array( 'message' => 'Invalid data.' ), 400 );
    }

    $request = new WP_REST_Request( 'POST' );
    $request->set_body( wp_json_encode( $params ) );

    if ( $action === 'delete' && $post_id ) {
        $request->set_param( 'id', $post_id );
        $response = trsss_delete_shortcode( $request );
    } elseif ( $action === 'update' && $post_id ) {
        $request->set_param( 'id', $post_id );
        $response = trsss_update_shortcode( $request );
    } else {
        $response = trsss_create_shortcode( $request );
    }

    if ( is_wp_error( $response ) ) {
        wp_send_json_error( array( 'message' => $response->get_error_message() ) );
    }
    $data = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
    wp_send_json_success( $data );
}

