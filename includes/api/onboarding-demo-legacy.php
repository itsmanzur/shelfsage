<?php
/**
 * Onboarding, demo import, legacy shortcode helpers (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
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
    $settings = trsss_get_shelfsage_settings_array();
    
    if ( isset( $params['branding']['color'] ) ) {
        $settings['primary_color'] = sanitize_hex_color( $params['branding']['color'] );
    }
    
    if ( isset( $params['branding']['darkMode'] ) ) {
        $settings['enable_dark_mode'] = $params['branding']['darkMode'] ? 'yes' : 'no'; // Assuming yes/no string or boolean
    }
    
    if ( isset( $params['labels'] ) ) {
        $settings['labels'] = array_map( 'sanitize_text_field', $params['labels'] );
    }
    
    update_option( TRSSS_OPTION_SETTINGS, $settings );
    
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
    $max_posts = max( 1, min( 500, (int) apply_filters( 'trsss_saved_shortcodes_max_posts', 200 ) ) );
    $shortcodes = get_posts(
        array(
            'post_type'      => 'rmss_shortcode',
            'posts_per_page' => $max_posts,
            'post_status'    => 'publish',
            'orderby'        => 'modified',
            'order'          => 'DESC',
        )
    );

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
