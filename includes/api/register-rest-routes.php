<?php
/**
 * REST route registration (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function trsss_register_search_route() {
    register_rest_route( 'shelfsage/v1', '/search', array(
        'methods'  => 'GET',
        'callback' => 'trsss_handle_search',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( 'shelfsage/v1', '/filters', array(
        'methods'  => 'GET',
        'callback' => 'trsss_handle_filters',
        'permission_callback' => '__return_true',
    ) );

    register_rest_route( 'shelfsage/v1', '/related', array(
        'methods'  => 'GET',
        'callback' => 'trsss_handle_related_books',
        'permission_callback' => '__return_true',
        'args'     => array(
            'product_id' => array( 'required' => true, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
            'limit'      => array( 'default' => 6, 'type' => 'integer', 'sanitize_callback' => 'absint' ),
        ),
    ) );

    register_rest_route( 'shelfsage/v1', '/pdf-proxy', array(
        'methods'             => 'GET',
        'callback'            => 'trsss_handle_pdf_proxy',
        'permission_callback' => '__return_true',
        'args'                => array(
            'file'  => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'esc_url_raw' ),
            'nonce' => array( 'required' => true, 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field' ),
        ),
    ) );

    // Onboarding Endpoints
    register_rest_route( 'shelfsage/v1', '/onboarding/settings', array(
        'methods'  => 'POST',
        'callback' => 'trsss_save_onboarding_settings',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );
    
    register_rest_route( 'shelfsage/v1', '/onboarding/demo-content', array(
        'methods'  => 'POST',
        'callback' => 'trsss_import_demo_content',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );

    // Products Endpoint for Shortcode Architect (admin use)
    register_rest_route( 'shelfsage/v1', '/products', array(
        'methods'  => 'GET',
        'callback' => 'trsss_get_products_rest',
        'permission_callback' => function() { return is_user_logged_in() && current_user_can( 'edit_posts' ); },
    ) );

    // Taxonomies Endpoint for Shortcode Architect (admin use)
    register_rest_route( 'shelfsage/v1', '/taxonomies/(?P<taxonomy>[a-zA-Z0-9_-]+)', array(
        'methods'  => 'GET',
        'callback' => 'trsss_get_taxonomy_terms_rest',
        'permission_callback' => function() { return is_user_logged_in() && current_user_can( 'edit_posts' ); },
    ) );

    // Auto-Create Product from Google Books ISBN
    register_rest_route( 'shelfsage/v1', '/create-product', array(
        'methods'  => 'POST',
        'callback' => 'trsss_create_product_from_isbn',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );

    // Amazon PA-API v5 Proxy
    register_rest_route( 'shelfsage/v1', '/amazon-search', array(
        'methods'  => 'POST',
        'callback' => 'trsss_amazon_search',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );

    // Test API Connection (Google Books / Amazon)
    register_rest_route( 'shelfsage/v1', '/test-api-connection', array(
        'methods'             => 'POST',
        'callback'            => 'trsss_test_api_connection',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );

    // Clear API transient cache
    register_rest_route( 'shelfsage/v1', '/clear-cache', array(
        'methods'  => 'POST',
        'callback' => 'trsss_clear_api_cache',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );
    // Shortcode CRUD
    register_rest_route( 'shelfsage/v1', '/shortcodes', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'trsss_list_shortcodes',
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ),
        array(
            'methods'             => 'POST',
            'callback'            => 'trsss_create_shortcode',
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ),
    ) );

    register_rest_route( 'shelfsage/v1', '/shortcodes/(?P<id>\d+)', array(
        array(
            'methods'             => 'GET',
            'callback'            => 'trsss_get_shortcode',
            'permission_callback' => function() { return current_user_can( 'edit_posts' ); },
        ),
        array(
            'methods'             => 'POST',       // PUT/PATCH aren't always reliable via wp-json
            'callback'            => 'trsss_update_shortcode',
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ),
        array(
            'methods'             => 'DELETE',
            'callback'            => 'trsss_delete_shortcode',
            'permission_callback' => function() { return current_user_can( 'manage_options' ); },
        ),
    ) );

    // Update Stock (Unified WC & Vault)
    register_rest_route( 'shelfsage/v1', '/update-stock', array(
        'methods'  => 'POST',
        'callback' => 'trsss_update_stock',
        'permission_callback' => function() { return current_user_can( 'manage_options' ); },
    ) );
}
add_action( 'rest_api_init', 'trsss_register_search_route' );
