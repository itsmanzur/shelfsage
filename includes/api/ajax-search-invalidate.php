<?php
/**
 * Admin product search AJAX + filters cache invalidation (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function trsss_ajax_search_products() {
    check_ajax_referer( 'trsss_ajax_list_shortcodes', 'nonce' );

    if ( ! current_user_can( 'edit_posts' ) ) {
        wp_send_json_error( array( 'message' => 'Permission denied.' ), 403 );
        wp_die();
    }

    if ( ! trsss_is_woocommerce_available() ) {
        wp_send_json_error( array( 'message' => trsss_woocommerce_required_error()->get_error_message() ), 400 );
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
                'price'     => wp_kses_post( $product->get_price_html() ),
                'permalink' => get_permalink( $product_id ),
                'genre'     => wc_get_product_category_list( $product_id ), // Add genre/category for preview
                'summary'   => wp_trim_words( $product->get_short_description(), 10 ), // Add summary
                'badge'     => get_post_meta( $product_id, '_rmss_product_badge', true ), // Add Badge
                'rating'    => wp_kses_post( wc_get_rating_html( $product->get_average_rating() ) ), // Add rating
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
	if ( function_exists( 'trsss_delete_filters_tax_transients' ) ) {
		trsss_delete_filters_tax_transients();
	} else {
		delete_transient( 'trsss_filters_data' );
	}
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
