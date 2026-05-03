<?php
/**
 * Create product from ISBN + stock update (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

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
