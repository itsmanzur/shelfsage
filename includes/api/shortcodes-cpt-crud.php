<?php
/**
 * Shortcode CPT + REST CRUD (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
