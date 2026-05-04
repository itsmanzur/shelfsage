<?php
/**
 * Shared ShelfSage settings option helpers (constants + frontend merge accessor).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'TRSSS_OPTION_SETTINGS' ) ) {
	define( 'TRSSS_OPTION_SETTINGS', 'shelfsage_settings' );
}

/**
 * Defaults for ShelfSage global settings (kept DRY with TRSSS_Settings::get_option_defaults()).
 *
 * @return array
 */
function trsss_shelfsage_option_defaults() {
	return array(
		'enable_custom_template'   => true,
		'apply_to_all_products'    => true,
		'single_product_layout'    => 'style-1',
		'vault_single_layout'      => 'style-1',
		'default_book_image'       => '',
		'primary_color'            => '#2563eb',
		'accent_color'             => '#1d4ed8',
		'enable_look_inside'       => true,
		'pdf_reader_style'         => 'style-1',
		'look_inside_btn_position' => 'bottom-left',
		'enable_affiliate'         => true,
		'enable_schema'            => true,
		'enable_custom_button'     => false,
		'hide_add_to_cart'         => false,
		'amazon_access_key'        => '',
		'amazon_secret_key'        => '',
		'amazon_associate_tag'     => '',
		'amazon_marketplace'       => 'www.amazon.com',
		'enable_google_books'      => false,
		'google_books_api_key'     => '',
		'wc_sync_enabled'          => true,
		'smart_fallback_enabled'   => true,
		'affiliates'               => array(
			array(
				'label' => 'Buy on Amazon',
				'url'   => '',
			),
			array(
				'label' => 'Buy on Rokomari',
				'url'   => '',
			),
		),
		'labels'                   => array(
			'author'             => 'Author',
			'publisher'          => 'Publisher',
			'translator'         => 'Translator',
			'series'             => 'Series',
			'add_to_cart'        => 'Add to Cart',
			'custom_button'      => 'View Details',
			'view_cart'          => 'View Cart',
			'look_inside'        => 'Look Inside',
			'isbn'               => 'ISBN',
			'pages'              => 'Pages',
			'edition'            => 'Edition',
			'binding'            => 'Binding',
			'related_books'      => 'Related Books',
			'more_from_author'   => 'More from this Author',
			'also_available'     => 'Also available at:',
		),
	);
}

/**
 * Merged ShelfSage settings including encrypted credential blobs where stored.
 *
 * @return array
 */
function trsss_get_shelfsage_settings_array() {
	$defaults = trsss_shelfsage_option_defaults();
	$stored   = get_option( TRSSS_OPTION_SETTINGS, array() );

	if ( isset( $stored['affiliates'] ) && ! is_array( $stored['affiliates'] ) ) {
		$stored['affiliates'] = array();
	}
	if ( ! isset( $stored['labels'] ) || ! is_array( $stored['labels'] ) ) {
		$stored['labels'] = array();
	}

	$merged = wp_parse_args( $stored, $defaults );

	return (array) apply_filters( 'trsss_shelfsage_settings_array', $merged );
}

/**
 * Whether the optional WooCommerce integration can safely run.
 *
 * ShelfSage supports multiple data sources. WooCommerce is required only when
 * the selected workflow needs product, cart, price, or stock APIs.
 *
 * @return bool
 */
function trsss_is_woocommerce_available() {
	return class_exists( 'WooCommerce' ) && function_exists( 'wc_get_product' );
}

/**
 * Standard REST error for WooCommerce-only data source requests.
 *
 * @return WP_Error
 */
function trsss_woocommerce_required_error() {
	return new WP_Error(
		'woocommerce_required',
		__( 'WooCommerce is required for the WooCommerce data source. Please activate WooCommerce or choose another ShelfSage source.', 'shelfsage' ),
		array( 'status' => 400 )
	);
}

/**
 * Stable asset version based on file modification time.
 *
 * @param string $relative_path Plugin-relative asset path.
 * @return string
 */
function trsss_asset_version( $relative_path ) {
	$relative_path = ltrim( (string) $relative_path, '/\\' );
	$file          = defined( 'TRSSS_PATH' ) ? TRSSS_PATH . $relative_path : '';

	if ( $file && file_exists( $file ) ) {
		return (string) filemtime( $file );
	}

	return defined( 'TRSSS_VERSION' ) ? (string) TRSSS_VERSION : '1.5.0';
}

/**
 * Safely resolve a term archive URL for templates.
 *
 * @param WP_Term|int|null $term Term object or ID.
 * @return string
 */
function trsss_safe_term_link( $term ) {
	if ( empty( $term ) ) {
		return '#';
	}

	$link = get_term_link( $term );

	return is_wp_error( $link ) ? '#' : $link;
}
