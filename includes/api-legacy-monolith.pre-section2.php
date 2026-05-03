<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Register Custom Search Endpoint
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// REST API — Cookie/Nonce auth সঠিকভাবে কাজ করার জন্য
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ShelfSage REST routes-এ missing CORS headers যোগ করে।
 * IMPORTANT: global rest_send_cors_headers remove করা হয় না — Elementor ভেঙে যায়।
 * শুধু shelfsage/v1 namespace-এ extra headers inject করা হয়।
 */
add_filter( 'rest_post_dispatch', 'trsss_add_shelfsage_cors_headers', 10, 3 );
function trsss_add_shelfsage_cors_headers( $result, $server, $request ) {
    $route = $request->get_route();
    // শুধু ShelfSage routes-এ প্রযোজ্য
    if ( strpos( $route, '/shelfsage/v1' ) !== 0 ) {
        return $result;
    }
    $origin_raw = isset( $_SERVER['HTTP_ORIGIN'] ) ? wp_unslash( $_SERVER['HTTP_ORIGIN'] ) : '';
    $origin     = $origin_raw ? esc_url_raw( trim( $origin_raw ) ) : '';
    if ( ! $origin ) {
        return $result;
    }
    $home = home_url( '/' );
    $p_o  = wp_parse_url( $origin );
    $p_h  = wp_parse_url( $home );
    if ( ! is_array( $p_o ) || ! is_array( $p_h ) || empty( $p_o['host'] ) || empty( $p_h['host'] ) ) {
        return $result;
    }
    if ( strtolower( $p_o['host'] ) !== strtolower( $p_h['host'] ) ) {
        return $result;
    }
    $result->header( 'Access-Control-Allow-Origin', $origin );
    $result->header( 'Access-Control-Allow-Credentials', 'true' );
    $result->header( 'Access-Control-Allow-Headers', 'Authorization, X-WP-Nonce, Content-Type, Accept, X-Requested-With' );
    return $result;
}

/**
 * Anonymous public-route rate limit (per IP per minute).
 *
 * @param string $bucket Stable suffix e.g. 'search'.
 * @return true|WP_Error
 */
function trsss_public_rest_rate_limit_check( $bucket ) {
    $bucket = sanitize_key( $bucket );
    $ip     = isset( $_SERVER['REMOTE_ADDR'] ) ? sanitize_text_field( wp_unslash( $_SERVER['REMOTE_ADDR'] ) ) : '';
    if ( $ip === '' ) {
        $ip = '0';
    }
    $window = (int) floor( time() / 60 );
    $key    = 'trsss_public_rl_v1_' . md5( $ip . '|' . $bucket ) . '_' . $window;
    $count  = (int) get_transient( $key );
    $limit  = (int) apply_filters( 'trsss_public_rest_rate_limit_per_minute', 120, $bucket );
    if ( $count >= $limit ) {
        return new WP_Error(
            'trsss_rate_limited',
            __( 'Too many requests. Please wait a moment and try again.', 'shelfsage' ),
            array( 'status' => 429 )
        );
    }
    set_transient( $key, $count + 1, 70 );
    return true;
}

/**
 * Stable JSON for search transient keys (avoids serialize() key collisions).
 *
 * @param array $params Raw request params.
 * @return string
 */
function trsss_search_cache_param_payload( array $params ) {
    $keys = array(
        'term', 'type', 'author', 'publisher', 'genre', 'collection',
        'limit', 'include', 'category', 'sort_by', 'sort_order',
    );
    $slice = array();
    foreach ( $keys as $k ) {
        if ( isset( $params[ $k ] ) && $params[ $k ] !== '' && $params[ $k ] !== null ) {
            $slice[ $k ] = $params[ $k ];
        }
    }
    ksort( $slice );
    return wp_json_encode( $slice );
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
        $req = new WP_REST_Request( 'GET' );
        $response = trsss_get_products_rest( $req );
        $data = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
        wp_send_json_success( $data );
    } elseif ( strpos( $endpoint, '/taxonomies/' ) !== false ) {
        preg_match( '#/taxonomies/([a-zA-Z0-9_-]+)#', $endpoint, $m );
        $taxonomy = isset( $m[1] ) ? sanitize_key( $m[1] ) : '';
        $req = new WP_REST_Request( 'GET' );
        $req->set_param( 'taxonomy', $taxonomy );
        $response = trsss_get_taxonomy_terms_rest( $req );
        $data = is_a( $response, 'WP_REST_Response' ) ? $response->get_data() : $response;
        wp_send_json_success( $data );
    } else {
        wp_send_json_success( array() );
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHORTCODE CPT
// ─────────────────────────────────────────────────────────────────────────────
add_action( 'init', 'trsss_register_shortcode_cpt' );
function trsss_register_shortcode_cpt() {
    register_post_type( 'rmss_shortcode', array(
        'labels'              => array( 'name' => 'ShelfSage Shortcodes', 'singular_name' => 'Shortcode' ),
        'public'              => false,
        'show_ui'             => false,
        'show_in_rest'        => false,
        'supports'            => array( 'title', 'custom-fields' ),
        'capability_type'     => 'post',
        'map_meta_cap'        => true,
    ) );
}

function trsss_format_shortcode_post( $post ) {
    $settings_json = get_post_meta( $post->ID, '_rmss_settings', true );
    $settings = $settings_json ? json_decode( $settings_json, true ) : array();

    $css = '';
    if ( function_exists( 'trsss_generate_design_css' ) ) {
        $css = trsss_generate_design_css( $settings, '.rmss-design-' . $post->ID . ' ' );
    }

    return array(
        'id'         => $post->ID,
        'title'      => $post->post_title,
        'shortcode'  => get_post_meta( $post->ID, '_rmss_shortcode_string', true ),
        'settings'   => $settings,
        'css'        => $css,
        'date'       => get_the_date( 'M j, Y', $post ),  // e.g. "Feb 21, 2026"
        'created_at' => $post->post_date,
        'updated_at' => $post->post_modified,
    );
}

/**
 * GET /shelfsage/v1/shortcodes
 * List all saved shortcodes.
 */
function trsss_list_shortcodes() {
    try {
        $posts = get_posts( array(
            'post_type'      => 'rmss_shortcode',
            'post_status'    => 'publish',
            'posts_per_page' => 100,
            'orderby'        => 'modified',
            'order'          => 'DESC',
        ) );

        if ( empty( $posts ) ) {
            return rest_ensure_response( array() );
        }

        $result = array();
        foreach ( $posts as $post ) {
            try {
                $result[] = trsss_format_shortcode_post( $post );
            } catch ( Throwable $e ) {
                if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
                    error_log( "[ShelfSage] Error formatting post #{$post->ID}: " . $e->getMessage() );
                }
                // Skip broken posts
            }
        }
        
        return rest_ensure_response( $result );

    } catch ( Throwable $e ) {
        if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
            error_log( '[ShelfSage] Fatal Error in trsss_list_shortcodes: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine() );
        }
        return new WP_Error(
            'list_failed',
            'Failed to list shortcodes: ' . $e->getMessage(),
            array( 'status' => 500 )
        );
    }
}

/**
 * POST /shelfsage/v1/shortcodes

 * Create a new saved shortcode.
 */
function trsss_create_shortcode( WP_REST_Request $request ) {
    $params    = $request->get_json_params();
    $title     = sanitize_text_field( $params['title'] ?? 'Untitled Shortcode' );
    $shortcode = sanitize_text_field( $params['shortcode'] ?? '' );
    $settings  = $params['settings'] ?? array();

    $post_id = wp_insert_post( array(
        'post_type'   => 'rmss_shortcode',
        'post_status' => 'publish',
        'post_title'  => $title,
    ) );

    if ( is_wp_error( $post_id ) ) {
        return new WP_Error( 'create_failed', $post_id->get_error_message(), array( 'status' => 500 ) );
    }

    update_post_meta( $post_id, '_rmss_shortcode_string', $shortcode );
    update_post_meta( $post_id, '_rmss_settings', wp_json_encode( $settings ) );

    return rest_ensure_response( trsss_format_shortcode_post( get_post( $post_id ) ) );
}

/**
 * GET /shelfsage/v1/shortcodes/{id}
 * Get a single saved shortcode by ID.
 */
function trsss_get_shortcode( WP_REST_Request $request ) {
    $post = get_post( (int) $request['id'] );

    if ( ! $post || $post->post_type !== 'rmss_shortcode' || $post->post_status === 'trash' ) {
        return new WP_Error( 'not_found', 'Shortcode not found.', array( 'status' => 404 ) );
    }

    return rest_ensure_response( trsss_format_shortcode_post( $post ) );
}

/**
 * POST /shelfsage/v1/shortcodes/{id}   (used as update/PUT)
 * Update a saved shortcode by ID.
 */
function trsss_update_shortcode( WP_REST_Request $request ) {
    $post = get_post( (int) $request['id'] );

    if ( ! $post || $post->post_type !== 'rmss_shortcode' ) {
        return new WP_Error( 'not_found', 'Shortcode not found.', array( 'status' => 404 ) );
    }

    $params    = $request->get_json_params();
    $title     = sanitize_text_field( $params['title'] ?? $post->post_title );
    $shortcode = sanitize_text_field( $params['shortcode'] ?? '' );
    $settings  = $params['settings'] ?? array();

    wp_update_post( array(
        'ID'         => $post->ID,
        'post_title' => $title,
    ) );

    update_post_meta( $post->ID, '_rmss_shortcode_string', $shortcode );
    update_post_meta( $post->ID, '_rmss_settings', wp_json_encode( $settings ) );
    clean_post_cache( $post->ID );
    do_action( 'trsss_shortcode_design_saved', $post->ID );

    return rest_ensure_response( trsss_format_shortcode_post( get_post( $post->ID ) ) );
}

/**
 * DELETE /shelfsage/v1/shortcodes/{id}
 * Permanently delete a saved shortcode.
 */
function trsss_delete_shortcode( WP_REST_Request $request ) {
    $post = get_post( (int) $request['id'] );

    if ( ! $post || $post->post_type !== 'rmss_shortcode' ) {
        return new WP_Error( 'not_found', 'Shortcode not found.', array( 'status' => 404 ) );
    }

    wp_delete_post( $post->ID, true ); // force delete (no trash)

    return rest_ensure_response( array( 'success' => true, 'deleted_id' => $post->ID ) );
}


/**
 * Clear all ShelfSage API transients (Google Books, Amazon).
 */
function trsss_clear_api_cache() {
    global $wpdb;

    // Delete all transients with our plugin prefix using prepared statements.
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options}
             WHERE option_name LIKE %s
                OR option_name LIKE %s
                OR option_name LIKE %s
                OR option_name LIKE %s",
            $wpdb->esc_like( '_transient_trsss_' ) . '%',
            $wpdb->esc_like( '_transient_timeout_trsss_' ) . '%',
            $wpdb->esc_like( '_transient_rmss_' ) . '%',
            $wpdb->esc_like( '_transient_timeout_rmss_' ) . '%'
        )
    );

    return rest_ensure_response( array( 'success' => true, 'message' => 'API cache cleared.' ) );
}


/**
 * Amazon PA-API v5 Proxy with AWS Signature v4
 * Body: { query: string, search_type: 'asin'|'keywords' }
 */
function trsss_amazon_search( WP_REST_Request $request ) {
    $saved    = get_option( 'shelfsage_settings', array() );
    $key      = isset( $saved['amazon_access_key'] ) ? trsss_decrypt_setting_secret( $saved['amazon_access_key'] ) : '';
    $secret   = isset( $saved['amazon_secret_key'] ) ? trsss_decrypt_setting_secret( $saved['amazon_secret_key'] ) : '';
    $tag      = $saved['amazon_associate_tag'] ?? '';
    $host     = $saved['amazon_marketplace']   ?? 'www.amazon.com';

    if ( ! $key || ! $secret || ! $tag ) {
        return new WP_Error( 'amazon_not_configured',
            'Amazon PA-API credentials are not configured in Settings → Affiliates.',
            array( 'status' => 400 ) );
    }

    $params      = $request->get_json_params();
    $query       = sanitize_text_field( $params['query'] ?? '' );
    $search_type = sanitize_text_field( $params['search_type'] ?? 'keywords' );

    if ( empty( $query ) ) {
        return new WP_Error( 'missing_query', 'Search query is required.', array( 'status' => 422 ) );
    }

    // ── Build PA-API v5 payload ──────────────────────────────────────────────
    $region   = trsss_amazon_region_from_host( $host );
    $service  = 'ProductAdvertisingAPI';
    $endpoint = "https://{$host}/paapi5/searchitems";
    $target   = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';
    $payload  = array(
        'PartnerTag'  => $tag,
        'PartnerType' => 'Associates',
        'Marketplace' => $host,
        'Resources'   => array(
            'Images.Primary.Large',
            'ItemInfo.Title',
            'ItemInfo.ByLineInfo',
            'ItemInfo.ContentInfo',
            'ItemInfo.ExternalIds',
            'ItemInfo.Features',
            'Offers.Listings.Price',
        ),
    );

    if ( $search_type === 'asin' ) {
        $endpoint = "https://{$host}/paapi5/getitems";
        $target   = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems';
        $payload['ItemIds']    = array_map( 'trim', explode( ',', $query ) );
        $payload['IdType']     = 'ASIN';
    } else {
        $payload['Keywords']    = $query;
        $payload['SearchIndex'] = 'Books';
        $payload['ItemCount']   = 10;
    }

    $body = wp_json_encode( $payload );

    // ── AWS Signature v4 ──────────────────────────────────────────────────────
    $datetime  = gmdate( 'Ymd\THis\Z' );
    $date      = substr( $datetime, 0, 8 );
    $path      = ( $search_type === 'asin' ) ? '/paapi5/getitems' : '/paapi5/searchitems';

    $headers_to_sign = array(
        'content-encoding' => 'amz-1.0',
        'content-type'     => 'application/json; charset=utf-8',
        'host'             => $host,
        'x-amz-date'       => $datetime,
        'x-amz-target'     => $target,
    );
    ksort( $headers_to_sign );

    $canonical_headers  = '';
    $signed_headers_arr = array();
    foreach ( $headers_to_sign as $k => $v ) {
        $canonical_headers   .= $k . ':' . $v . "\n";
        $signed_headers_arr[] = $k;
    }
    $signed_headers = implode( ';', $signed_headers_arr );

    $payload_hash = hash( 'sha256', $body );
    $canonical_request = implode( "\n", array(
        'POST',
        $path,
        '',                        // query string
        $canonical_headers,
        $signed_headers,
        $payload_hash,
    ) );

    $credential_scope = "{$date}/{$region}/{$service}/aws4_request";
    $string_to_sign   = implode( "\n", array(
        'AWS4-HMAC-SHA256',
        $datetime,
        $credential_scope,
        hash( 'sha256', $canonical_request ),
    ) );

    $signing_key  = trsss_aws_sig4_signing_key( $secret, $date, $region, $service );
    $signature    = hash_hmac( 'sha256', $string_to_sign, $signing_key );
    $auth_header  = "AWS4-HMAC-SHA256 "
                  . "Credential={$key}/{$credential_scope}, "
                  . "SignedHeaders={$signed_headers}, "
                  . "Signature={$signature}";

    // ── Send request ──────────────────────────────────────────────────────────
    $response = wp_remote_post( $endpoint, array(
        'timeout' => 15,
        'headers' => array(
            'content-encoding' => 'amz-1.0',
            'content-type'     => 'application/json; charset=utf-8',
            'host'             => $host,
            'x-amz-date'       => $datetime,
            'x-amz-target'     => $target,
            'Authorization'    => $auth_header,
        ),
        'body' => $body,
    ) );

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'amazon_api_error', $response->get_error_message(), array( 'status' => 502 ) );
    }

    $code = wp_remote_retrieve_response_code( $response );
    $raw  = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( $code !== 200 ) {
        $msg = $raw['Errors'][0]['Message'] ?? 'Amazon API error.';
        return new WP_Error( 'amazon_api_error', $msg, array( 'status' => $code ) );
    }

    $force_refresh = ! empty( $params['force_refresh'] );

    // ── Normalise response ────────────────────────────────────────────────────
    $items_raw = ( $search_type === 'asin' )
        ? ( $raw['ItemsResult']['Items'] ?? array() )
        : ( $raw['SearchResult']['Items'] ?? array() );

    $results = array();
    foreach ( $items_raw as $item ) {
        $results[] = trsss_fetch_book_metadata_with_fallback( $item, $tag, $host, $force_refresh );
    }

    return rest_ensure_response( $results );
}

/**
 * Build AWS Signature v4 signing key
 */
function trsss_aws_sig4_signing_key( string $secret, string $date, string $region, string $service ): string {
    $k_date    = hash_hmac( 'sha256', $date,            'AWS4' . $secret, true );
    $k_region  = hash_hmac( 'sha256', $region,          $k_date,          true );
    $k_service = hash_hmac( 'sha256', $service,         $k_region,        true );
    return       hash_hmac( 'sha256', 'aws4_request',   $k_service,       true );
}

/**
 * Map Amazon host to AWS region
 */
function trsss_amazon_region_from_host( string $host ): string {
    $map = array(
        'www.amazon.co.jp'  => 'us-east-1', // Japan PA-API is still us-east-1
        'www.amazon.co.uk'  => 'eu-west-1',
        'www.amazon.de'     => 'eu-west-1',
        'www.amazon.fr'     => 'eu-west-1',
        'www.amazon.it'     => 'eu-west-1',
        'www.amazon.es'     => 'eu-west-1',
        'www.amazon.com.au' => 'us-west-2',
        'www.amazon.in'     => 'us-east-1',
        'www.amazon.com.br' => 'us-east-1',
        'www.amazon.ca'     => 'us-east-1',
        'www.amazon.com.mx' => 'us-east-1',
    );
    return $map[ $host ] ?? 'us-east-1';
}

/**
 * Merge Amazon + Google Books data for a single PA-API item.
 *
 * - Checks a 24-hour merged transient first (trsss_merged_{asin}).
 * - If smart_fallback_enabled is ON and Amazon is missing image/description,
 *   hits Google Books by ISBN and fills the gaps.
 * - Marks enriched items with enriched_by = 'google_books'.
 *
 * @param array  $item Amazon PA-API item array.
 * @param string $tag  Associate tag (for affiliate URLs).
 * @param string $host Amazon marketplace host.
 * @return array Normalised book data.
 */
function trsss_fetch_book_metadata_with_fallback( array $item, string $tag, string $host, bool $force_refresh = false ): array {
    $asin        = $item['ASIN'] ?? '';
    $cache_key   = 'trsss_merged_' . md5( $asin . $tag );

    if ( $force_refresh ) {
        delete_transient( $cache_key );
    }

    // ── 1. Return cached merged result if available ───────────────────────────
    $cached = get_transient( $cache_key );
    if ( false !== $cached ) {
        return $cached;
    }

    // ── 2. Extract Amazon fields ─────────────────────────────────────────────
    $title      = $item['ItemInfo']['Title']['DisplayValue'] ?? '';
    $authors    = implode( ', ', array_column(
        array_filter(
            $item['ItemInfo']['ByLineInfo']['Contributors'] ?? array(),
            fn( $c ) => ( $c['RoleType'] ?? '' ) === 'author'
        ),
        'Name'
    ) );
    $image      = $item['Images']['Primary']['Large']['URL'] ?? '';
    $price_raw  = $item['Offers']['Listings'][0]['Price']['Amount'] ?? null;
    $currency   = $item['Offers']['Listings'][0]['Price']['Currency'] ?? 'USD';
    $price      = $price_raw !== null ? number_format( (float) $price_raw, 2 ) . ' ' . $currency : '';
    $affiliate_url = "https://{$host}/dp/{$asin}?tag={$tag}";
    $description = implode( ' ', $item['ItemInfo']['Features']['DisplayValues'] ?? array() );

    // Pull ISBN-13 from PA-API ExternalIds (if available)
    $isbns       = $item['ItemInfo']['ExternalIds']['ISBNs']['DisplayValues'] ?? array();
    $isbn        = '';
    foreach ( $isbns as $candidate ) {
        if ( strlen( $candidate ) === 13 ) {
            $isbn = $candidate;
            break;
        }
    }
    // Fall back to ISBN-10 if no ISBN-13 found
    if ( empty( $isbn ) && ! empty( $isbns ) ) {
        $isbn = $isbns[0];
    }

    $enriched_by = '';

    // ── 3. Smart Fallback ─────────────────────────────────────────────────────
    $saved_settings      = get_option( 'shelfsage_settings', array() );
    $fallback_enabled    = ! empty( $saved_settings['smart_fallback_enabled'] );
    $needs_image         = empty( $image );
    $needs_description   = empty( $description );

    if ( $fallback_enabled && ( $needs_image || $needs_description ) && ( ! empty( $isbn ) || ! empty( $title ) ) ) {
        // Use ISBN for lookup if available, otherwise fall back to title
        $gb = ! empty( $isbn )
            ? trsss_fetch_google_books_by_isbn( $isbn )
            : trsss_fetch_google_books_by_title( $title );

        if ( $gb['found'] ) {
            if ( $needs_image && ! empty( $gb['image'] ) ) {
                $image       = $gb['image'];
                $enriched_by = 'google_books';
            }
            if ( $needs_description && ! empty( $gb['description'] ) ) {
                $description = $gb['description'];
                $enriched_by = 'google_books';
            }
        }
    }

    $result = array(
        'asin'        => $asin,
        'title'       => $title,
        'author'      => $authors,
        'image'       => $image,
        'price'       => $price,
        'affiliate_url' => $affiliate_url,
        'summary'     => $description,
        'source'      => 'amazon',
        'enriched_by' => $enriched_by,
    );

    // ── 4. Cache the merged result for 24 hours ───────────────────────────────
    set_transient( $cache_key, $result, 24 * HOUR_IN_SECONDS );

    return $result;
}

/**
 * Fetch Google Books volume info by ISBN.
 * Caches result in a 12-hour transient (trsss_gb_{isbn}).
 *
 * @param string $isbn ISBN-10 or ISBN-13.
 * @return array { description, image, pages, found }
 */
function trsss_fetch_google_books_by_isbn( string $isbn ): array {
    $cache_key = 'trsss_gb_' . md5( $isbn );
    $cached    = get_transient( $cache_key );
    if ( false !== $cached ) {
        return $cached;
    }

    $saved    = get_option( 'shelfsage_settings', array() );
    $api_key  = $saved['google_books_api_key'] ?? '';
    $url      = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' . urlencode( $isbn ) . '&maxResults=1';
    if ( $api_key ) {
        $url .= '&key=' . urlencode( $api_key );
    }

    $response = wp_remote_get( $url, array( 'timeout' => 8 ) );
    $empty    = array( 'description' => '', 'image' => '', 'pages' => 0, 'found' => false );

    if ( is_wp_error( $response ) ) {
        return $empty;
    }

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    $info = $data['items'][0]['volumeInfo'] ?? null;

    if ( ! $info ) {
        set_transient( $cache_key, $empty, 12 * HOUR_IN_SECONDS );
        return $empty;
    }

    // Prefer the largest available thumbnail
    $image_links = $info['imageLinks'] ?? array();
    $image = $image_links['extraLarge']
          ?? $image_links['large']
          ?? $image_links['medium']
          ?? $image_links['thumbnail']
          ?? '';
    // Force HTTPS
    $image = $image ? preg_replace( '/^http:\/\//i', 'https://', $image ) : '';

    $result = array(
        'description' => $info['description'] ?? '',
        'image'       => $image,
        'pages'       => (int) ( $info['pageCount'] ?? 0 ),
        'found'       => true,
    );

    set_transient( $cache_key, $result, 12 * HOUR_IN_SECONDS );
    return $result;
}

/**
 * Fetch Google Books volume info by title (less precise — used when no ISBN available).
 * Thin wrapper around the ISBN function's shape, without caching by title (results vary).
 *
 * @param string $title Book title.
 * @return array { description, image, pages, found }
 */
function trsss_fetch_google_books_by_title( string $title ): array {
    if ( empty( $title ) ) {
        return array( 'description' => '', 'image' => '', 'pages' => 0, 'found' => false );
    }

    $saved   = get_option( 'shelfsage_settings', array() );
    $api_key = $saved['google_books_api_key'] ?? '';
    $url     = 'https://www.googleapis.com/books/v1/volumes?q=' . urlencode( $title ) . '&maxResults=1';
    if ( $api_key ) {
        $url .= '&key=' . urlencode( $api_key );
    }

    $response = wp_remote_get( $url, array( 'timeout' => 8 ) );
    $empty    = array( 'description' => '', 'image' => '', 'pages' => 0, 'found' => false );

    if ( is_wp_error( $response ) ) return $empty;

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    $info = $data['items'][0]['volumeInfo'] ?? null;
    if ( ! $info ) return $empty;

    $image_links = $info['imageLinks'] ?? array();
    $image = $image_links['extraLarge'] ?? $image_links['large'] ?? $image_links['medium'] ?? $image_links['thumbnail'] ?? '';
    $image = $image ? preg_replace( '/^http:\/\//i', 'https://', $image ) : '';

    return array(
        'description' => $info['description'] ?? '',
        'image'       => $image,
        'pages'       => (int) ( $info['pageCount'] ?? 0 ),
        'found'       => true,
    );
}

/**
 * Backward-compat wrapper (still used if called directly from old code).
 *
 * @deprecated Use trsss_fetch_google_books_by_title() instead.
 */
function trsss_google_books_description( string $title ): string {
    return trsss_fetch_google_books_by_title( $title )['description'];
}



/**
 * Handle Onboarding Settings Save
 */
function trsss_save_onboarding_settings( $request ) {
    $params = $request->get_json_params();
    
    // 1. Save Taxonomies
    if ( isset( $params['taxonomies'] ) && is_array( $params['taxonomies'] ) ) {
        $allowed = array( 'rmss_genre', 'rmss_author', 'rmss_publisher', 'rmss_series', 'rmss_collection', 'product_cat' );
        $taxonomies = array_values( array_intersect( $params['taxonomies'], $allowed ) );
        update_option( 'shelfsage_active_taxonomies', $taxonomies );
    }
    
    // 2. Save Branding & Labels
    $settings = get_option( 'shelfsage_settings', array() );
    
    if ( isset( $params['branding']['color'] ) ) {
        $settings['primary_color'] = sanitize_hex_color( $params['branding']['color'] );
    }
    
    if ( isset( $params['branding']['darkMode'] ) ) {
        $settings['enable_dark_mode'] = $params['branding']['darkMode'] ? 'yes' : 'no'; // Assuming yes/no string or boolean
    }
    
    if ( isset( $params['labels'] ) ) {
        $settings['labels'] = array_map( 'sanitize_text_field', $params['labels'] );
    }
    
    update_option( 'shelfsage_settings', $settings );
    
    return rest_ensure_response( array( 'success' => true ) );
}

/**
 * Handle Demo Content Import
 */
function trsss_import_demo_content( $request ) {
    // Check if WooCommerce is active
    if ( ! class_exists( 'WC_Product' ) ) {
        return new WP_Error( 'no_woocommerce', 'WooCommerce is not active', array( 'status' => 400 ) );
    }

    // Check if import has already run to prevent duplicates
    if ( get_option( 'rmss_demo_content_imported' ) ) {
        // Return success but with a specific message
        return rest_ensure_response( array( 'success' => true, 'message' => 'Demo content already imported' ) );
    }

    $json_file = TRSSS_PATH . 'data/sample-books.json';
    if ( ! file_exists( $json_file ) ) {
        return new WP_Error( 'no_file', 'Sample data file not found.', array( 'status' => 404 ) );
    }

    $json_data = file_get_contents( $json_file );
    $books = json_decode( $json_data, true );

    if ( ! $books || ! is_array( $books ) ) {
        return new WP_Error( 'invalid_json', 'Invalid sample data format', array( 'status' => 500 ) );
    }

    $imported_count = 0;

    foreach ( $books as $book_data ) {
        // Check if product exists by ISBN (simple duplicate check)
        $existing_posts = get_posts( array(
            'post_type'  => 'product',
            'meta_key'   => '_rmss_isbn',
            'meta_value' => $book_data['isbn'],
            'fields'     => 'ids',
        ) );

        if ( ! empty( $existing_posts ) ) {
            continue; // Skip if ISBN exists
        }

        // Create Product
        $product = new WC_Product_Simple();
        $product->set_name( $book_data['title'] );
        $product->set_regular_price( $book_data['price'] );
        $product->set_short_description( $book_data['summary'] );
        $product->set_status( 'publish' );
        $product->set_catalog_visibility( 'visible' );
        
        $product_id = $product->save();

        if ( $product_id ) {
            // Add Meta
            update_post_meta( $product_id, '_rmss_isbn', $book_data['isbn'] );
            update_post_meta( $product_id, '_rmss_pages', $book_data['pages'] );

            // Assign Author
            if ( ! empty( $book_data['author'] ) ) {
                $term = term_exists( $book_data['author'], 'rmss_author' );
                if ( ! $term ) {
                    $term = wp_insert_term( $book_data['author'], 'rmss_author' );
                }
                if ( ! is_wp_error( $term ) ) {
                    $term_id = is_array($term) ? $term['term_id'] : $term;
                    wp_set_object_terms( $product_id, (int) $term_id, 'rmss_author' );
                }
            }

            // Assign Publisher
            if ( ! empty( $book_data['publisher'] ) ) {
                $term = term_exists( $book_data['publisher'], 'rmss_publisher' );
                if ( ! $term ) {
                    $term = wp_insert_term( $book_data['publisher'], 'rmss_publisher' );
                }
                if ( ! is_wp_error( $term ) ) {
                    $term_id = is_array($term) ? $term['term_id'] : $term;
                    wp_set_object_terms( $product_id, (int) $term_id, 'rmss_publisher' );
                }
            }
            
            $imported_count++;
        }
    }

    if ( $imported_count > 0 ) {
        update_option( 'rmss_demo_content_imported', true );
    }

    return rest_ensure_response( array( 
        'success' => true, 
        'message' => sprintf( '%d books imported successfully', $imported_count ),
        'count' => $imported_count
    ) );
}

/**
 * Get Saved Shortcodes
 */
function trsss_get_saved_shortcodes() {
    $shortcodes = get_posts( array(
        'post_type'      => 'rmss_shortcode',
        'posts_per_page' => -1,
        'post_status'    => 'publish',
    ) );

    $data = array();
    foreach ( $shortcodes as $post ) {
        $settings = get_post_meta( $post->ID, '_rmss_settings', true );
        $data[] = array(
            'id'       => $post->ID,
            'title'    => $post->post_title,
            'date'     => get_the_date( 'Y-m-d', $post->ID ),
            'type'     => isset( $settings['layout'] ) ? $settings['layout'] : 'grid',
            'settings' => $settings,
        );
    }

    return rest_ensure_response( $data );
}

/**
 * Save Shortcode
 */
function trsss_save_shortcode( $request ) {
    $params = $request->get_json_params();
    $title = isset( $params['title'] ) ? sanitize_text_field( $params['title'] ) : 'Saved Shortcode';
    $settings = isset( $params['settings'] ) ? $params['settings'] : array();

    $post_id = wp_insert_post( array(
        'post_title'  => $title,
        'post_type'   => 'rmss_shortcode',
        'post_status' => 'publish',
    ) );

    if ( $post_id ) {
        update_post_meta( $post_id, '_rmss_settings', $settings );
        clean_post_cache( $post_id );
        do_action( 'trsss_shortcode_design_saved', $post_id );
    }

    return rest_ensure_response( array( 'success' => true, 'id' => $post_id ) );
}
/**
 * Handle Search & Filter Request
 */
function trsss_handle_search( $request ) {
    $rl = trsss_public_rest_rate_limit_check( 'search' );
    if ( is_wp_error( $rl ) ) {
        return $rl;
    }

    $params = $request->get_params();
    $skip_cache = ! empty( $params['no_cache'] );

    // Caching Key (v8 — deterministic wp_json_encode); skip cache when no_cache=1 (e.g. admin preview)
    if ( ! $skip_cache ) {
        $cache_key = 'trsss_search_v8_' . md5( trsss_search_cache_param_payload( $params ) );
        $cached = get_transient( $cache_key );
        if ( $cached !== false ) {
            return $cached;
        }
    }

    $term = isset( $params['term'] ) ? sanitize_text_field( $params['term'] ) : '';
    $type = isset( $params['type'] ) ? sanitize_text_field( $params['type'] ) : 'latest'; // latest, featured, onsale, bestsellers
    $authors = isset( $params['author'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['author'] ) ) ) : array();
    $publishers = isset( $params['publisher'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['publisher'] ) ) ) : array();
    $genres = isset( $params['genre'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['genre'] ) ) ) : array();
    $collections = isset( $params['collection'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['collection'] ) ) ) : array();
    $raw_limit = isset( $params['limit'] ) ? intval( $params['limit'] ) : 12;
    $limit = ( $raw_limit === -1 ) ? 100 : max( 1, $raw_limit ); // -1 means "show all" (capped at 100)

    $include = isset( $params['include'] ) ? array_filter( array_map( 'absint', explode( ',', $params['include'] ) ) ) : array();
    $category = isset( $params['category'] ) ? sanitize_text_field( $params['category'] ) : '';

    // Sort params
    $sort_by    = isset( $params['sort_by'] ) ? sanitize_text_field( $params['sort_by'] ) : 'date';
    $sort_order = isset( $params['sort_order'] ) ? strtoupper( sanitize_text_field( $params['sort_order'] ) ) : 'DESC';
    $sort_order = ( 'ASC' === $sort_order ) ? 'ASC' : 'DESC';
    $valid_sort_by = array( 'date', 'title', 'modified', 'price', 'rating', 'rand' );
    if ( ! in_array( $sort_by, $valid_sort_by, true ) ) {
        $sort_by = 'date';
    }

    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => $limit,
        'post_status'    => 'publish',
        'order'          => 'DESC',
        'orderby'        => 'date',
    );

    // Query Types
    switch ( $type ) {
        case 'featured':
            $args['tax_query'][] = array(
                'taxonomy' => 'product_visibility',
                'field'    => 'name',
                'terms'    => 'featured',
            );
            break;
        case 'onsale':
            $args['post__in'] = wc_get_product_ids_on_sale();
            break;
        case 'bestsellers':
            $args['meta_key'] = 'total_sales';
            $args['orderby']  = 'meta_value_num';
            break;
        case 'latest':
        default:
            $args['orderby'] = 'date';
            break;
    }

    // Apply custom sort (skip for bestsellers — they're sorted by total_sales; skip for post__in/relevance)
    if ( 'bestsellers' !== $type ) {
        if ( 'price' === $sort_by ) {
            $args['meta_key'] = '_price';
            $args['orderby']  = 'meta_value_num';
            $args['order']    = $sort_order;
        } elseif ( 'rating' === $sort_by ) {
            $args['meta_key'] = '_wc_average_rating';
            $args['orderby']  = 'meta_value_num';
            $args['order']    = $sort_order;
        } elseif ( 'rand' === $sort_by ) {
            $args['orderby'] = 'rand';
        } elseif ( in_array( $sort_by, array( 'date', 'title', 'modified' ), true ) ) {
            $args['orderby'] = $sort_by;
            $args['order']   = $sort_order;
        }
    }

    // Specific Products overrides type
    if ( ! empty( $include ) ) {
        $args['post__in'] = $include;
        $args['orderby'] = 'post__in'; // Preserve order
    }

    // Text Search
    if ( ! empty( $term ) ) {
        $args['s'] = $term;
        $args['orderby'] = 'relevance'; // Search results irrelevant of type usually
    }

    // Taxonomy Filters
    $tax_query = isset( $args['tax_query'] ) ? $args['tax_query'] : array();
    
    if ( ! empty( $category ) ) {
        $tax_query[] = array(
            'taxonomy' => 'product_cat',
            'field'    => 'slug',
            'terms'    => $category,
        );
    }
    
    if ( ! empty( $authors ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_author',
            'field'    => 'slug',
            'terms'    => $authors,
        );
    }
    
    if ( ! empty( $publishers ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_publisher',
            'field'    => 'slug',
            'terms'    => $publishers,
        );
    }

    if ( ! empty( $genres ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_genre',
            'field'    => 'slug',
            'terms'    => $genres,
        );
    }

    if ( ! empty( $collections ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_collection',
            'field'    => 'slug',
            'terms'    => $collections,
        );
    }

    if ( ! empty( $tax_query ) ) {
        if ( count( $tax_query ) > 1 ) {
            $tax_query['relation'] = 'AND';
        }
        $args['tax_query'] = $tax_query;
    }

    $product_posts = get_posts( $args );
    $ids = array_map( 'intval', wp_list_pluck( $product_posts, 'ID' ) );

    // When search term looks like ISBN, also find by meta _rmss_isbn and merge
    if ( ! empty( $term ) && preg_match( '/^[\d\-]{9,17}$/', preg_replace( '/\s/', '', $term ) ) ) {
        $isbn_ids = get_posts( array(
            'post_type'      => 'product',
            'posts_per_page' => $limit,
            'post_status'    => 'publish',
            'fields'         => 'ids',
            'meta_query'     => array(
                array( 'key' => '_rmss_isbn', 'value' => sanitize_text_field( $term ), 'compare' => 'LIKE' ),
            ),
        ) );
        $ids = array_unique( array_merge( $ids, (array) $isbn_ids ) );
    }

    $results = array();
    foreach ( $ids as $id ) {
        $product = wc_get_product( $id );
        if ( ! $product ) continue;

        // Authors
        $author_terms = get_the_terms( $id, 'rmss_author' );
        $author_names = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'name' ) : array();

        // Check for newness (e.g. added in last 30 days)
        $is_new = ( time() - strtotime( $product->get_date_created() ) ) < ( 30 * DAY_IN_SECONDS );
        
        $regular_price = $product->get_regular_price();
        $sale_price    = $product->get_sale_price();
        $thumb_url = get_the_post_thumbnail_url( $id, 'woocommerce_thumbnail' ) ?: '';
        $image_url = get_the_post_thumbnail_url( $id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $id, 'large' ) ?: $thumb_url;
        $results[] = array(
            'id'             => $id,
            'title'          => $product->get_title(),
            'thumbnail'      => $thumb_url,
            'image'          => $image_url,
            'authors'        => implode( ', ', $author_names ),
            'price'          => $product->get_price_html(), // HTML version (for frontend rendering)
            'price_plain'    => $product->get_price() 
                ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) . number_format( (float) $product->get_price(), 2 )
                : __( 'Free', 'shelfsage' ), // Plain text version
            'regular_price'  => $regular_price !== '' ? (float) $regular_price : null,
            'sale_price'     => $sale_price !== '' ? (float) $sale_price : null,
            'permalink'      => get_permalink( $id ),
            'isbn'        => get_post_meta( $id, '_rmss_isbn', true ),
            'pages'       => get_post_meta( $id, '_rmss_pages', true ),
            'badge'       => get_post_meta( $id, '_rmss_product_badge', true ), // Add Badge
            'rating'      => (float) $product->get_average_rating(),
            'rating_html' => wc_get_rating_html( $product->get_average_rating(), $product->get_review_count() ),
            'review_count' => (int) $product->get_review_count(),
            'is_on_sale'  => $product->is_on_sale(),
            'is_new'      => $is_new,
            'category'    => wc_get_product_category_list( $id ),
            'summary'        => wp_trim_words( $product->get_short_description(), 15 ),
            'look_inside_url' => get_post_meta( $id, '_rmss_look_inside_url', true ) ?: '',
        );
    }

    // Cache for 1 hour (skip when no_cache=1 e.g. admin preview)
    if ( ! $skip_cache ) {
        $cache_key = 'trsss_search_v8_' . md5( trsss_search_cache_param_payload( $params ) );
        set_transient( $cache_key, $results, HOUR_IN_SECONDS );
    }

    return $results;
}

/**
 * Handle Filters Request (Authors, Publishers, Genres)
 */
function trsss_handle_filters( $request ) {
    $rl = trsss_public_rest_rate_limit_check( 'filters' );
    if ( is_wp_error( $rl ) ) {
        return $rl;
    }

    // Cache Key
    $cache_key = 'trsss_filters_data';
    $cached = get_transient( $cache_key );
    
    if ( $cached !== false ) {
        return $cached;
    }

    $data = array(
        'authors'     => array(),
        'publishers'  => array(),
        'genres'      => array(),
        'collections'  => array(),
    );

    // Get Authors
    $authors = get_terms( array( 'taxonomy' => 'rmss_author', 'hide_empty' => true ) );
    if ( ! is_wp_error( $authors ) ) {
        foreach ( $authors as $term ) {
            // Get Image ID
            $img_id = get_term_meta( $term->term_id, 'rmss_image_id', true );
            $img_url = $img_id ? wp_get_attachment_image_url( $img_id, 'thumbnail' ) : null;
            
            // Fallback to old meta key if needed, or just use what we have
            if ( ! $img_url ) {
                 $old_url = get_term_meta( $term->term_id, 'rmss_image', true );
                 if ( $old_url ) $img_url = $old_url;
            }

            $data['authors'][] = array(
                'id'    => $term->term_id,
                'name'  => $term->name,
                'slug'  => $term->slug,
                'count' => $term->count,
                'image' => $img_url,
            );
        }
    }

    // Get Publishers
    $publishers = get_terms( array( 'taxonomy' => 'rmss_publisher', 'hide_empty' => true ) );
    if ( ! is_wp_error( $publishers ) ) {
        foreach ( $publishers as $term ) {
             $img_id = get_term_meta( $term->term_id, 'rmss_image_id', true );
             $img_url = $img_id ? wp_get_attachment_image_url( $img_id, 'thumbnail' ) : null;

            $data['publishers'][] = array(
                'id'    => $term->term_id,
                'name'  => $term->name,
                'slug'  => $term->slug,
                'count' => $term->count,
                'image' => $img_url,
            );
        }
    }

    // Get Genres
    $genres = get_terms( array( 'taxonomy' => 'rmss_genre', 'hide_empty' => true ) );
    if ( ! is_wp_error( $genres ) ) {
        foreach ( $genres as $term ) {
            $data['genres'][] = array(
                'id'    => $term->term_id,
                'name'  => $term->name,
                'slug'  => $term->slug,
                'count' => $term->count,
            );
        }
    }

    // Get Collections (Bestsellers, New Arrivals, etc.)
    $collections = get_terms( array( 'taxonomy' => 'rmss_collection', 'hide_empty' => true ) );
    if ( ! is_wp_error( $collections ) ) {
        foreach ( $collections as $term ) {
            $data['collections'][] = array(
                'id'    => $term->term_id,
                'name'  => $term->name,
                'slug'  => $term->slug,
                'count' => $term->count,
            );
        }
    }

    set_transient( $cache_key, $data, 12 * HOUR_IN_SECONDS ); // Cache for 12 hours

    return $data;
}

/**
 * Related books by same author, genre, or publisher (for single product page).
 */
function trsss_handle_related_books( $request ) {
    $rl = trsss_public_rest_rate_limit_check( 'related' );
    if ( is_wp_error( $rl ) ) {
        return $rl;
    }

    $product_id = (int) $request['product_id'];
    $limit      = (int) $request['limit'];
    if ( $limit < 1 || $limit > 20 ) {
        $limit = 6;
    }

    $product = wc_get_product( $product_id );
    if ( ! $product ) {
        return rest_ensure_response( array() );
    }

    $author_terms   = get_the_terms( $product_id, 'rmss_author' );
    $genre_terms    = get_the_terms( $product_id, 'rmss_genre' );
    $publisher_terms = get_the_terms( $product_id, 'rmss_publisher' );

    $author_ids   = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'term_id' ) : array();
    $genre_ids    = $genre_terms && ! is_wp_error( $genre_terms ) ? wp_list_pluck( $genre_terms, 'term_id' ) : array();
    $publisher_ids = $publisher_terms && ! is_wp_error( $publisher_terms ) ? wp_list_pluck( $publisher_terms, 'term_id' ) : array();

    $collected = array();
    $tax_priority = array(
        array( 'rmss_author', $author_ids ),
        array( 'rmss_genre', $genre_ids ),
        array( 'rmss_publisher', $publisher_ids ),
    );

    foreach ( $tax_priority as $pair ) {
        list( $tax, $term_ids ) = $pair;
        if ( empty( $term_ids ) ) {
            continue;
        }
        $q = new WP_Query( array(
            'post_type'      => 'product',
            'posts_per_page' => $limit + 5,
            'post_status'    => 'publish',
            'post__not_in'   => array( $product_id ),
            'fields'         => 'ids',
            'tax_query'      => array(
                array( 'taxonomy' => $tax, 'field' => 'term_id', 'terms' => $term_ids ),
            ),
        ) );
        if ( $q->have_posts() ) {
            foreach ( $q->posts as $id ) {
                if ( ! in_array( $id, $collected, true ) ) {
                    $collected[] = $id;
                    if ( count( $collected ) >= $limit ) {
                        break 2;
                    }
                }
            }
        }
    }

    $collected = array_slice( $collected, 0, $limit );
    $results = array();
    foreach ( $collected as $id ) {
        $p = wc_get_product( $id );
        if ( ! $p ) {
            continue;
        }
        $author_terms_i = get_the_terms( $id, 'rmss_author' );
        $author_names = $author_terms_i && ! is_wp_error( $author_terms_i ) ? wp_list_pluck( $author_terms_i, 'name' ) : array();
        $is_new = ( time() - strtotime( $p->get_date_created() ) ) < ( 30 * DAY_IN_SECONDS );
        $reg = $p->get_regular_price();
        $sale = $p->get_sale_price();
        $thumb_url = get_the_post_thumbnail_url( $id, 'woocommerce_thumbnail' ) ?: '';
        $image_url = get_the_post_thumbnail_url( $id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $id, 'large' ) ?: $thumb_url;
        $results[] = array(
            'id'             => $id,
            'title'          => $p->get_title(),
            'thumbnail'      => $thumb_url,
            'image'          => $image_url,
            'authors'        => implode( ', ', $author_names ),
            'price'          => $p->get_price_html(),
            'price_plain'    => $p->get_price() ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) . number_format( (float) $p->get_price(), 2 ) : __( 'Free', 'shelfsage' ),
            'regular_price'  => $reg !== '' ? (float) $reg : null,
            'sale_price'     => $sale !== '' ? (float) $sale : null,
            'permalink'      => get_permalink( $id ),
            'isbn'         => get_post_meta( $id, '_rmss_isbn', true ),
            'pages'        => get_post_meta( $id, '_rmss_pages', true ),
            'badge'        => get_post_meta( $id, '_rmss_product_badge', true ),
            'rating'       => (float) $p->get_average_rating(),
            'rating_html'  => wc_get_rating_html( $p->get_average_rating(), $p->get_review_count() ),
            'review_count' => (int) $p->get_review_count(),
            'is_on_sale'   => $p->is_on_sale(),
            'is_new'       => $is_new,
            'category'     => wc_get_product_category_list( $id ),
            'summary'         => wp_trim_words( $p->get_short_description(), 15 ),
            'look_inside_url' => get_post_meta( $id, '_rmss_look_inside_url', true ) ?: '',
        );
    }

    return rest_ensure_response( $results );
}

/**
 * Get Products for Shortcode Architect (REST API)
 */
function trsss_get_products_rest( $request ) {
    $params = $request->get_params();
    $search = isset( $params['search'] ) ? sanitize_text_field( $params['search'] ) : '';
    
    // Query Args - Reuse logic from AJAX endpoint
    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => 50, // Increased limit for admin
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC'
    );

    // If search term provided
    if ( ! empty( $search ) ) {
        $args['s'] = $search;
        $args['orderby'] = 'relevance';
    }

    $query = new WP_Query( $args );
    $results = array();

    if ( $query->have_posts() ) {
        while ( $query->have_posts() ) {
            $query->the_post();
            $product_id = get_the_ID();
            $product = wc_get_product( $product_id );
            
            if ( ! $product ) continue;

            $author_terms = get_the_terms( $product_id, 'rmss_author' );
            $author_names = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'name' ) : array();

            $thumb_url = get_the_post_thumbnail_url( $product_id, 'woocommerce_thumbnail' ) ?: '';
            $image_url = get_the_post_thumbnail_url( $product_id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $product_id, 'large' ) ?: $thumb_url;
            $results[] = array(
                'id'             => $product_id,
                'title'          => $product->get_title(),
                'author'         => implode( ', ', $author_names ),
                'price'          => $product->get_price() ? '$' . number_format( (float) $product->get_price(), 2 ) : 'N/A',
                'thumbnail'      => $thumb_url,
                'image'          => $image_url,
                'isbn'           => get_post_meta( $product_id, '_rmss_isbn', true ),
                'stock_quantity' => $product->get_stock_quantity(),
                'stock_status'   => $product->get_stock_status(),
            );
        }
        wp_reset_postdata();
    }

    return rest_ensure_response( $results );
}

/**
 * Get Taxonomy Terms for Shortcode Architect (REST API)
 */
function trsss_get_taxonomy_terms_rest( $request ) {
    $taxonomy = $request['taxonomy'];
    
    // Validate taxonomy
    $allowed_taxonomies = array( 'rmss_genre', 'rmss_author', 'rmss_publisher', 'product_cat' );
    if ( ! in_array( $taxonomy, $allowed_taxonomies ) ) {
        return new WP_Error( 'invalid_taxonomy', 'Invalid taxonomy', array( 'status' => 400 ) );
    }

    $terms = get_terms( array( 
        'taxonomy'   => $taxonomy, 
        'hide_empty' => false // Show all terms for admin
    ) );

    if ( is_wp_error( $terms ) ) {
        return new WP_Error( 'taxonomy_error', $terms->get_error_message(), array( 'status' => 500 ) );
    }

    $results = array();
    foreach ( $terms as $term ) {
        $results[] = array(
            'id'    => $term->term_id,
            'name'  => $term->name,
            'slug'  => $term->slug,
            'count' => $term->count,
        );
    }

    return rest_ensure_response( $results );
}

/**
 * Handle Search via AJAX
 */
function trsss_ajax_search_products() {
    check_ajax_referer( 'trsss_ajax_list_shortcodes', 'nonce' );

    if ( ! current_user_can( 'edit_posts' ) ) {
        wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
        wp_die();
    }

    $term = isset( $_GET['term'] ) ? sanitize_text_field( wp_unslash( $_GET['term'] ) ) : '';
    
    // Query Args
    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => 20,
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC'
    );

    // If search term provided
    if ( ! empty( $term ) ) {
        $args['s'] = $term;
        $args['orderby'] = 'relevance';
    }

    $query = new WP_Query( $args );
    $results = array();

    if ( $query->have_posts() ) {
        while ( $query->have_posts() ) {
            $query->the_post();
            $product_id = get_the_ID();
            $product = wc_get_product( $product_id );
            
            if ( ! $product ) continue;

            $author_terms = get_the_terms( $product_id, 'rmss_author' );
            $author_names = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'name' ) : array();

            // Get image URL safely
            $image_id = $product->get_image_id();
            $image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'woocommerce_thumbnail' ) : '';

            $results[] = array(
                'id'        => $product_id,
                'title'     => $product->get_title(), // Use product method for cleaner title
                'thumbnail' => $image_url,
                'authors'   => implode( ', ', $author_names ),
                'price'     => $product->get_price_html(),
                'permalink' => get_permalink( $product_id ),
                'genre'     => wc_get_product_category_list( $product_id ), // Add genre/category for preview
                'summary'   => wp_trim_words( $product->get_short_description(), 10 ), // Add summary
                'badge'     => get_post_meta( $product_id, '_rmss_product_badge', true ), // Add Badge
                'rating'    => wc_get_rating_html( $product->get_average_rating() ) // Add rating
            );
        }
        wp_reset_postdata();
    }

    // Always return success with data array, even if empty
    wp_send_json_success( array( 'data' => $results ) );
}
add_action( 'wp_ajax_rmss_search_products', 'trsss_ajax_search_products' );
// add_action( 'wp_ajax_nopriv_rmss_search_products', 'trsss_ajax_search_products' ); // Uncomment if needed for frontend

/**
 * Invalidate filters cache when products or taxonomy terms change (so filter dropdowns stay fresh).
 */
function trsss_invalidate_filters_cache_on_save( $id ) {
    delete_transient( 'trsss_filters_data' );
}
add_action( 'save_post_product', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'edited_rmss_author', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'edited_rmss_publisher', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'edited_rmss_genre', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'edited_rmss_collection', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'created_rmss_author', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'created_rmss_publisher', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'created_rmss_genre', 'trsss_invalidate_filters_cache_on_save' );
add_action( 'created_rmss_collection', 'trsss_invalidate_filters_cache_on_save' );

/**
 * Auto-Create WooCommerce Draft Product from Google Books ISBN metadata
 * Endpoint: POST /shelfsage/v1/create-product
 * Body: { title, author, image_url, isbn, summary }
 */
function trsss_create_product_from_isbn( WP_REST_Request $request ) {
    // WooCommerce check
    if ( ! class_exists( 'WC_Product' ) ) {
        return new WP_Error( 'no_woocommerce', 'WooCommerce is required.', array( 'status' => 400 ) );
    }

    $params  = $request->get_json_params();
    $title   = sanitize_text_field( $params['title'] ?? '' );
    $author  = sanitize_text_field( $params['author'] ?? '' );
    $isbn    = sanitize_text_field( $params['isbn'] ?? '' );
    $summary = sanitize_textarea_field( $params['summary'] ?? '' );
    $img_url = esc_url_raw( $params['image_url'] ?? '' );

    if ( empty( $title ) ) {
        return new WP_Error( 'missing_title', 'A book title is required.', array( 'status' => 422 ) );
    }

    // Prevent duplicate: check if a product with this ISBN already exists
    $existing = get_posts( array(
        'post_type'      => 'product',
        'meta_key'       => '_rmss_isbn',
        'meta_value'     => $isbn,
        'posts_per_page' => 1,
        'fields'         => 'ids',
    ) );

    if ( ! empty( $existing ) ) {
        $edit_url = get_edit_post_link( $existing[0], 'raw' );
        return rest_ensure_response( array(
            'success'    => true,
            'message'    => 'Product already exists for this ISBN.',
            'product_id' => $existing[0],
            'edit_url'   => $edit_url,
        ) );
    }

    // Create a new WooCommerce simple product (draft)
    $product = new WC_Product_Simple();
    $product->set_name( $title );
    $product->set_status( 'draft' );
    $product->set_description( $summary );
    $product->set_short_description( $author ? "By {$author}" : '' );
    $product->save();

    $product_id = $product->get_id();

    // Save ISBN as product meta (use _rmss_isbn for Book Details and schema)
    update_post_meta( $product_id, '_rmss_isbn', $isbn );
    if ( $author ) {
        update_post_meta( $product_id, '_rmss_author', $author );
    }

    // Side-load cover image from URL
    if ( $img_url ) {
        require_once ABSPATH . 'wp-admin/includes/media.php';
        require_once ABSPATH . 'wp-admin/includes/file.php';
        require_once ABSPATH . 'wp-admin/includes/image.php';

        $attachment_id = media_sideload_image( $img_url, $product_id, $title, 'id' );
        if ( ! is_wp_error( $attachment_id ) ) {
            set_post_thumbnail( $product_id, $attachment_id );
        }
    }

    $edit_url = get_edit_post_link( $product_id, 'raw' );

    return rest_ensure_response( array(
        'success'    => true,
        'product_id' => $product_id,
        'edit_url'   => $edit_url,
        'message'    => "Draft product \"{$title}\" created successfully.",
    ) );
}

/**
 * Handle Unified Stock Update (WC & Vault)
 * Body: { id, source: 'wc'|'vault', quantity, status }
 */
function trsss_update_stock( WP_REST_Request $request ) {
    $params   = $request->get_json_params();
    $id       = (int) ($params['id']       ?? 0);
    $source   = sanitize_text_field($params['source']   ?? 'wc');
    $quantity = (int) ($params['quantity'] ?? 0);
    $status   = sanitize_text_field($params['status']   ?? 'instock');

    if ( ! $id ) {
        return new WP_Error( 'missing_id', 'ID is required.', array( 'status' => 422 ) );
    }

    if ( $source === 'wc' ) {
        if ( ! class_exists( 'WooCommerce' ) ) {
            return new WP_Error( 'wc_missing', 'WooCommerce is not active.', array( 'status' => 400 ) );
        }
        $product = wc_get_product( $id );
        if ( ! $product ) {
            return new WP_Error( 'not_found', 'Product not found.', array( 'status' => 404 ) );
        }
        
        $product->set_stock_quantity( $quantity );
        $product->set_stock_status( $status );
        $product->save();
        
    } else {
        // Vault Asset
        update_post_meta( $id, '_ss_vault_stock_quantity', $quantity );
        update_post_meta( $id, '_ss_vault_stock_status', $status );
    }

    return rest_ensure_response( array(
        'success' => true,
        'message' => 'Stock updated successfully.'
    ) );
}

