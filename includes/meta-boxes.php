<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Add Book Details Meta Box
 */
function trsss_add_meta_boxes() {
    add_meta_box(
        'rmss_book_details',
        __( 'Book Details', 'shelfsage' ),
        'trsss_render_book_details_meta_box',
        'product',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'trsss_add_meta_boxes' );

function trsss_enqueue_book_details_media( $hook ) {
    if ( $hook !== 'post.php' && $hook !== 'post-new.php' ) {
        return;
    }

    $screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
    if ( ! $screen || $screen->post_type !== 'product' ) {
        return;
    }

    wp_enqueue_media();
    wp_enqueue_script( 'rmss-book-details-media', TRSSS_URL . 'includes/admin-media.js', array( 'jquery' ), '1.0.0', true );
}
add_action( 'admin_enqueue_scripts', 'trsss_enqueue_book_details_media' );

function trsss_render_book_details_meta_box( $post ) {
    wp_nonce_field( 'rmss_save_book_details', 'rmss_book_details_nonce' );
    
    // ... (Keep existing fields: ISBN, etc.)
    $fields = array(
        'isbn'           => 'ISBN',
        'isbn13'         => 'ISBN 13',
        'asin'           => 'ASIN',
        'product_badge'  => 'Badge/Ribbon Text', // New Feature
        'doi'            => 'DOI',
        'edition'        => 'Edition',
        'pages'          => 'Pages',
        'dimension'      => 'Dimension',
        'weight'         => 'Weight',
        'file_size'      => 'File Size (e-book)',
        'language'       => 'Language',
        'binding'        => 'Binding',
        'age_group'      => 'Age Group',
        'reading_level'  => 'Reading Level',
        // ── Advanced SEO Schema fields ──────────────────────────────────
        'awards'         => 'Book Awards (comma-separated for schema)',
        'co_author'      => 'Co-Author(s) (comma-separated, e.g. Jane Doe, John Smith)',
        // ───────────────────────────────────────────────────────────────
        'reading_time'   => 'Book Reading Time',
        'accessibility'  => 'Accessibility Features',
        'availability'   => 'Book Availability',
        'pre_order'      => 'Pre Order Availability (Yes / No)',
        'release_date'   => 'Release Date (powers the pre-order countdown)',
        'ebook_url'      => 'E-book / Digital Download URL',
        'audio_url'      => 'Audiobook or Sample Audio URL',
        'look_inside_url' => 'Look Inside URL (PDF/Image Link)',
    );

    echo '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">';
    foreach ( $fields as $key => $label ) {
        $value = get_post_meta( $post->ID, '_rmss_' . $key, true );
        echo '<div>';
        echo '<label style="display:block; font-weight:bold; margin-bottom:5px;">' . esc_html( $label ) . '</label>';
        
        if ( $key === 'look_inside_url' ) {
            echo '<div style="display:flex; gap:5px;">';
            echo '<input type="text" name="rmss_' . esc_attr( $key ) . '" id="rmss_' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '" style="width:100%;" placeholder="https://..." />';
            echo '<button type="button" class="button rmss-upload-btn" data-target="rmss_' . esc_attr( $key ) . '">Upload</button>';
            echo '</div>';
        } elseif ( $key === 'release_date' ) {
            $date_value = preg_match( '/^\d{4}-\d{2}-\d{2}$/', (string) $value ) ? $value : '';
            echo '<input type="date" name="rmss_' . esc_attr( $key ) . '" id="rmss_' . esc_attr( $key ) . '" value="' . esc_attr( $date_value ) . '" style="width:100%;" />';
            echo '<small style="color:#64748b; display:block; margin-top:4px;">Set Pre Order Availability to <strong>Yes</strong> to activate the countdown.</small>';
        } elseif ( $key === 'pre_order' ) {
            $is_on = ! in_array( strtolower( trim( (string) $value ) ), array( '', '0', 'no', 'false', 'off' ), true );
            echo '<select name="rmss_' . esc_attr( $key ) . '" id="rmss_' . esc_attr( $key ) . '" style="width:100%;">';
            echo '<option value=""' . selected( $is_on, false, false ) . '>No</option>';
            echo '<option value="yes"' . selected( $is_on, true, false ) . '>Yes (active pre-order)</option>';
            echo '</select>';
        } else {
            echo '<input type="text" name="rmss_' . esc_attr( $key ) . '" id="rmss_' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '" style="width:100%;" placeholder="' . ( $key === 'product_badge' ? 'e.g. Best Seller, New' : '' ) . '" />';
        }
        
        echo '</div>';
    }
    echo '</div>';
}

function trsss_save_book_details( $post_id ) {
    if ( get_post_type( $post_id ) !== 'product' ) {
        return;
    }
    if ( ! isset( $_POST['rmss_book_details_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rmss_book_details_nonce'] ) ), 'rmss_save_book_details' ) ) {
        return;
    }

    $url_fields = array( 'ebook_url', 'audio_url', 'look_inside_url' );
    $fields = array(
        'isbn', 'isbn13', 'asin', 'product_badge', 'doi', 'edition', 'pages', 'dimension', 'weight',
        'file_size', 'language', 'binding', 'age_group', 'reading_level',
        'awards', 'co_author',
        'reading_time', 'accessibility', 'availability', 'pre_order', 'release_date',
        'ebook_url', 'audio_url', 'look_inside_url',
    );

    foreach ( $fields as $field ) {
        if ( isset( $_POST['rmss_' . $field] ) ) {
            $value = wp_unslash( $_POST['rmss_' . $field] );
            $sanitized = in_array( $field, $url_fields, true ) ? esc_url_raw( $value ) : sanitize_text_field( $value );
            update_post_meta( $post_id, '_rmss_' . $field, $sanitized );
        }
    }
}
add_action( 'save_post', 'trsss_save_book_details' );


/**
 * Add "ShelfSage Affiliates" Tab to Product Data
 */
// Affiliate Tab moved to Pro Version
// add_filter( 'woocommerce_product_data_tabs', 'rmss_add_affiliate_product_tab' );

/**
 * Render Affiliate Tab Content
 */
// Affiliate Render Logic moved to Pro Version
// add_action( 'woocommerce_product_data_panels', 'rmss_render_affiliate_product_tab' );

/**
 * Save Affiliate Data
 * WooCommerce saves custom fields in panels automatically if they follow the standard naming?
 * No, we usually hook to 'woocommerce_process_product_meta'.
 */
// Affiliate Save Logic moved to Pro Version
// add_action( 'woocommerce_process_product_meta', 'rmss_save_affiliate_data' );
