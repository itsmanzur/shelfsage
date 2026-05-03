<?php
/**
 * ShelfSage Vault Backend
 * Registers the Custom Post Type and Meta Fields for Vault Assets.
 * Ships with ShelfSage (single plugin package).
 */

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

/**
 * 1. Register Vault Assets CPT
 */
function trsss_vault_register_cpt() {
    $labels = array(
        'name'          => _x( 'Vault Assets', 'Post Type General Name', 'shelfsage' ),
        'singular_name' => _x( 'Vault Asset', 'Post Type Singular Name', 'shelfsage' ),
        'menu_name'     => __( 'Vault Assets', 'shelfsage' ),
        'all_items'     => __( 'All Assets', 'shelfsage' ),
        'add_new_item'  => __( 'Add New Asset', 'shelfsage' ),
        'edit_item'     => __( 'Edit Asset', 'shelfsage' ),
        'featured_image'=> __( 'Cover Image', 'shelfsage' ),
    );

    $args = array(
        'labels'        => $labels,
        'public'        => true,
        'show_ui'       => true,
        'show_in_menu'  => false,
        'capability_type' => 'post',
        'has_archive'   => true,
        'hierarchical'  => false,
        'menu_icon'     => 'dashicons-vault',
        'supports'      => array( 'title', 'editor', 'thumbnail', 'custom-fields' ),
        'show_in_rest'  => true,
        'rest_base'     => 'ss_vault_assets',
        'rewrite'       => array( 'slug' => 'ss_vault_assets', 'with_front' => true ),
    );

    register_post_type( 'ss_vault_assets', $args );
}
add_action( 'init', 'trsss_vault_register_cpt' );

/**
 * 2. Register Post Meta for REST API
 */
function trsss_vault_register_post_meta() {
    $meta_fields = array(
        'subtitle'       => 'string',
        'author'         => 'string',
        'publisher'      => 'string',
        'category'       => 'string',
        'ribbon'         => 'string',
        'edition'        => 'string',
        'pub_date'       => 'string',
        'isbn'           => 'string',
        'pages'          => 'number',
        'old_price'      => 'string',
        'price'          => 'string',
        'link'           => 'string',
        'rating'         => 'number',
        'button_text'    => 'string',
        'stock_quantity' => 'number',
        'stock_status'   => 'string',
        'stock'          => 'string',
        'wc_id'          => 'integer',
        'look_inside_url'=> 'string',
    );

    foreach ( $meta_fields as $field => $type ) {
        register_post_meta( 'ss_vault_assets', '_ss_vault_' . $field, array(
            'show_in_rest'  => true,
            'single'        => true,
            'type'          => $type,
            'auth_callback' => function () {
                return current_user_can( 'edit_posts' );
            },
        ) );
    }
}
add_action( 'init', 'trsss_vault_register_post_meta' );

/**
 * 3. Register Vault REST Routes
 */
function trsss_vault_register_rest_routes() {
    register_rest_route( 'shelfsage/v1', '/sync-to-vault', array(
        'methods'             => 'POST',
        'callback'            => 'trsss_vault_handle_sync_to_vault',
        'permission_callback' => function () {
            return current_user_can( 'manage_options' );
        },
    ) );
}
add_action( 'rest_api_init', 'trsss_vault_register_rest_routes' );

/**
 * Handle Sync to Vault Request
 */
function trsss_vault_handle_sync_to_vault( WP_REST_Request $request ) {
    if ( ! class_exists( 'WooCommerce' ) ) {
        return new WP_Error( 'wc_missing', 'WooCommerce is not active.', array( 'status' => 400 ) );
    }

    $params     = $request->get_json_params();
    $product_id = isset( $params['product_id'] ) ? intval( $params['product_id'] ) : 0;

    if ( ! $product_id ) {
        return new WP_Error( 'missing_id', 'Product ID is required.', array( 'status' => 422 ) );
    }

    $product = wc_get_product( $product_id );
    if ( ! $product ) {
        return new WP_Error( 'invalid_product', 'Product not found.', array( 'status' => 404 ) );
    }

    // Prevent duplicates
    $existing = get_posts( array(
        'post_type'      => 'ss_vault_assets',
        'meta_key'       => '_ss_vault_wc_id',
        'meta_value'     => $product_id,
        'fields'         => 'ids',
        'posts_per_page' => 1,
    ) );

    if ( ! empty( $existing ) ) {
        return rest_ensure_response( array(
            'success'  => true,
            'message'  => 'Product is already in the Vault.',
            'asset_id' => $existing[0],
        ) );
    }

    $asset_id = wp_insert_post( array(
        'post_type'    => 'ss_vault_assets',
        'post_title'   => $product->get_name(),
        'post_status'  => 'publish',
        'post_content' => $product->get_description(),
    ) );

    if ( is_wp_error( $asset_id ) ) {
        return new WP_Error( 'creation_failed', 'Could not create vault asset.', array( 'status' => 500 ) );
    }

    update_post_meta( $asset_id, '_ss_vault_wc_id', $product_id );
    update_post_meta( $asset_id, '_ss_vault_price', wp_kses_post( $product->get_price_html() ) );
    update_post_meta( $asset_id, '_ss_vault_author', get_post_meta( $product_id, '_rmss_author', true ) );
    update_post_meta( $asset_id, '_ss_vault_isbn', get_post_meta( $product_id, '_rmss_isbn', true ) );
    update_post_meta( $asset_id, '_ss_vault_stock_quantity', $product->get_stock_quantity() );
    update_post_meta( $asset_id, '_ss_vault_stock_status', $product->get_stock_status() );
    update_post_meta( $asset_id, '_ss_vault_look_inside_url', get_post_meta( $product_id, '_rmss_look_inside_url', true ) );

    $image_id = $product->get_image_id();
    if ( $image_id ) {
        set_post_thumbnail( $asset_id, $image_id );
    }

    return rest_ensure_response( array(
        'success'  => true,
        'message'  => 'Product successfully synced to Vault!',
        'asset_id' => $asset_id,
    ) );
}

/**
 * 4. Vault Meta Box
 */
function trsss_vault_add_meta_boxes() {
    add_meta_box(
        'ss_vault_details',
        __( 'Vault Asset Details', 'shelfsage' ),
        'trsss_vault_render_meta_box',
        'ss_vault_assets',
        'normal',
        'high'
    );
}
add_action( 'add_meta_boxes', 'trsss_vault_add_meta_boxes' );

function trsss_vault_render_meta_box( $post ) {
    wp_nonce_field( 'ss_vault_save_meta', 'ss_vault_meta_nonce' );

    $fields = array(
        'subtitle'       => 'Subtitle',
        'author'         => 'Author',
        'publisher'      => 'Publisher',
        'category'       => 'Category',
        'ribbon'         => 'Ribbon / Badge',
        'edition'        => 'Edition',
        'pub_date'       => 'Publish Date (YYYY-MM-DD)',
        'isbn'           => 'ISBN',
        'pages'          => 'Page Count',
        'old_price'      => 'Old Price (crossed-out)',
        'price'          => 'Sale Price',
        'link'           => 'Buy URL',
        'rating'         => 'Rating (1-5)',
        'button_text'    => 'Button Text',
        'stock_quantity' => 'Stock Quantity',
        'stock_status'   => 'Stock Status (instock, outofstock, onbackorder)',
        'stock'          => 'Stock',
        'look_inside_url'=> 'Look Inside URL (PDF or image link)',
    );

    echo '<table class="form-table">';
    foreach ( $fields as $key => $label ) {
        $value = get_post_meta( $post->ID, '_ss_vault_' . $key, true );
        echo '<tr>';
        echo '<th scope="row"><label for="' . esc_attr( $key ) . '">' . esc_html( $label ) . '</label></th>';
        echo '<td><input type="text" id="' . esc_attr( $key ) . '" name="_ss_vault_' . esc_attr( $key ) . '" value="' . esc_attr( $value ) . '" class="regular-text"></td>';
        echo '</tr>';
    }
    echo '</table>';
}

/**
 * 5. Save Vault Meta Box Data
 */
function trsss_vault_save_meta_box( $post_id ) {
    if ( ! isset( $_POST['ss_vault_meta_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['ss_vault_meta_nonce'] ) ), 'ss_vault_save_meta' ) ) {
        return;
    }
    if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
        return;
    }
    if ( ! current_user_can( 'edit_post', $post_id ) ) {
        return;
    }

    $url_fields = array( 'link', 'look_inside_url' );
    $fields = array( 'subtitle', 'author', 'publisher', 'category', 'ribbon', 'edition', 'pub_date', 'isbn', 'pages', 'old_price', 'price', 'link', 'rating', 'button_text', 'stock_quantity', 'stock_status', 'stock', 'look_inside_url' );

    foreach ( $fields as $field ) {
        if ( isset( $_POST[ '_ss_vault_' . $field ] ) ) {
            $raw   = wp_unslash( $_POST[ '_ss_vault_' . $field ] );
            $value = in_array( $field, $url_fields, true ) ? esc_url_raw( $raw ) : sanitize_text_field( $raw );
            update_post_meta( $post_id, '_ss_vault_' . $field, $value );
        }
    }
}
add_action( 'save_post_ss_vault_assets', 'trsss_vault_save_meta_box' );

/**
 * 6. Vault Single Page Template
 */
function trsss_vault_template_include( $template ) {
    if ( is_singular( 'ss_vault_assets' ) ) {
        $vault_template = TRSSS_PATH . 'templates/single-ss_vault_assets.php';
        if ( file_exists( $vault_template ) ) {
            return $vault_template;
        }
    }
    return $template;
}
add_filter( 'template_include', 'trsss_vault_template_include', 9998 );

/**
 * Enqueue scripts on vault single page
 */
function trsss_vault_enqueue_on_single( $should_enqueue ) {
    if ( is_singular( 'ss_vault_assets' ) ) {
        return true;
    }
    return $should_enqueue;
}
add_filter( 'trsss_should_enqueue_scripts', 'trsss_vault_enqueue_on_single' );
