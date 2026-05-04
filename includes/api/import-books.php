<?php
/**
 * Bulk book import for ShelfSage Vault and WooCommerce products.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Sanitize an import row.
 *
 * @param array $row Raw row.
 * @return array
 */
function trsss_sanitize_import_book_row( array $row ) {
	$url_fields = array( 'link', 'look_inside_url', 'cover_url' );
	$clean      = array();

	foreach ( $row as $key => $value ) {
		$key = sanitize_key( $key );
		if ( in_array( $key, $url_fields, true ) ) {
			$clean[ $key ] = esc_url_raw( (string) $value );
			continue;
		}
		if ( in_array( $key, array( 'description', 'short_description' ), true ) ) {
			$clean[ $key ] = wp_kses_post( (string) $value );
			continue;
		}
		$clean[ $key ] = sanitize_text_field( (string) $value );
	}

	return $clean;
}

function trsss_import_clean_price( $value ) {
	$value = preg_replace( '/[^\d.,-]/', '', (string) $value );
	$value = str_replace( ',', '', $value );
	return is_numeric( $value ) ? wc_format_decimal( $value ) : '';
}

function trsss_import_clean_stock_status( $value ) {
	$value = strtolower( sanitize_key( (string) $value ) );
	$map   = array(
		'in_stock'     => 'instock',
		'in-stock'     => 'instock',
		'available'    => 'instock',
		'yes'          => 'instock',
		'out_of_stock' => 'outofstock',
		'out-stock'    => 'outofstock',
		'out'          => 'outofstock',
		'no'           => 'outofstock',
		'backorder'    => 'onbackorder',
		'backorders'   => 'onbackorder',
		'low'          => 'onbackorder',
	);
	$value = $map[ $value ] ?? $value;
	return in_array( $value, array( 'instock', 'outofstock', 'onbackorder' ), true ) ? $value : 'instock';
}

/**
 * Find an existing Vault asset by ISBN or exact title.
 *
 * @param string $title Book title.
 * @param string $isbn  ISBN.
 * @return int Existing post ID or 0.
 */
function trsss_find_existing_imported_book( $title, $isbn ) {
	if ( $isbn ) {
		$existing = get_posts(
			array(
				'post_type'      => 'ss_vault_assets',
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => 1,
				'meta_query'     => array(
					array(
						'key'   => '_ss_vault_isbn',
						'value' => $isbn,
					),
				),
			)
		);
		if ( ! empty( $existing ) ) {
			return (int) $existing[0];
		}
	}

	if ( $title ) {
		$existing = get_page_by_title( $title, OBJECT, 'ss_vault_assets' );
		if ( $existing ) {
			return (int) $existing->ID;
		}
	}

	return 0;
}

function trsss_find_existing_imported_product( $title, $isbn, $sku ) {
	if ( $sku && function_exists( 'wc_get_product_id_by_sku' ) ) {
		$product_id = wc_get_product_id_by_sku( $sku );
		if ( $product_id ) {
			return (int) $product_id;
		}
	}

	if ( $isbn ) {
		$existing = get_posts(
			array(
				'post_type'      => 'product',
				'post_status'    => 'any',
				'fields'         => 'ids',
				'posts_per_page' => 1,
				'meta_query'     => array(
					array(
						'key'   => '_rmss_isbn',
						'value' => $isbn,
					),
				),
			)
		);
		if ( ! empty( $existing ) ) {
			return (int) $existing[0];
		}
	}

	if ( $title ) {
		$existing = get_page_by_title( $title, OBJECT, 'product' );
		if ( $existing ) {
			return (int) $existing->ID;
		}
	}

	return 0;
}

/**
 * Optionally sideload a cover image and set it as featured image.
 *
 * @param int    $post_id   Post ID.
 * @param string $cover_url Image URL.
 * @return void
 */
function trsss_maybe_import_book_cover( $post_id, $cover_url ) {
	if ( ! $post_id || empty( $cover_url ) || ! preg_match( '#^https?://#i', $cover_url ) ) {
		return;
	}

	if ( ! function_exists( 'media_sideload_image' ) ) {
		require_once ABSPATH . 'wp-admin/includes/media.php';
		require_once ABSPATH . 'wp-admin/includes/file.php';
		require_once ABSPATH . 'wp-admin/includes/image.php';
	}

	$attachment_id = media_sideload_image( $cover_url, $post_id, null, 'id' );
	if ( ! is_wp_error( $attachment_id ) ) {
		set_post_thumbnail( $post_id, (int) $attachment_id );
	}
}

function trsss_import_set_object_terms_from_text( $post_id, $taxonomy, $value ) {
	if ( ! $post_id || ! taxonomy_exists( $taxonomy ) || '' === trim( (string) $value ) ) {
		return;
	}

	$names    = preg_split( '/[,;|]+/', (string) $value );
	$term_ids = array();
	foreach ( $names as $name ) {
		$name = trim( $name );
		if ( '' === $name ) {
			continue;
		}
		$term = term_exists( $name, $taxonomy );
		if ( ! $term ) {
			$term = wp_insert_term( $name, $taxonomy );
		}
		if ( is_wp_error( $term ) ) {
			continue;
		}
		$term_ids[] = (int) ( is_array( $term ) ? $term['term_id'] : $term );
	}

	if ( ! empty( $term_ids ) ) {
		wp_set_object_terms( $post_id, $term_ids, $taxonomy, false );
	}
}

function trsss_import_book_to_vault( array $row ) {
	$title = trim( (string) ( $row['title'] ?? '' ) );
	$isbn  = trim( (string) ( $row['isbn'] ?? '' ) );

	if ( '' === $title ) {
		return new WP_Error( 'missing_title', __( 'title is required.', 'shelfsage' ) );
	}

	$existing_id = trsss_find_existing_imported_book( $title, $isbn );
	$post_data   = array(
		'post_type'    => 'ss_vault_assets',
		'post_title'   => $title,
		'post_content' => wp_kses_post( $row['description'] ?? '' ),
		'post_status'  => 'publish',
	);

	if ( $existing_id ) {
		$post_data['ID'] = $existing_id;
		$post_id         = wp_update_post( $post_data, true );
	} else {
		$post_id = wp_insert_post( $post_data, true );
	}

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	$meta_map = array(
		'subtitle'        => 'subtitle',
		'author'          => 'author',
		'publisher'       => 'publisher',
		'category'        => 'category',
		'genre'           => 'genre',
		'ribbon'          => 'ribbon',
		'edition'         => 'edition',
		'pub_date'        => 'pub_date',
		'isbn'            => 'isbn',
		'isbn13'          => 'isbn13',
		'pages'           => 'pages',
		'price'           => 'price',
		'sale_price'      => 'sale_price',
		'link'            => 'link',
		'rating'          => 'rating',
		'look_inside_url' => 'look_inside_url',
		'stock_quantity'  => 'stock_quantity',
	);

	foreach ( $meta_map as $row_key => $meta_key ) {
		if ( isset( $row[ $row_key ] ) && '' !== $row[ $row_key ] ) {
			update_post_meta( $post_id, '_ss_vault_' . $meta_key, $row[ $row_key ] );
		}
	}

	$stock_status = trsss_import_clean_stock_status( $row['stock_status'] ?? 'instock' );
	update_post_meta( $post_id, '_ss_vault_stock_status', $stock_status );
	update_post_meta( $post_id, '_ss_vault_stock', $stock_status );

	if ( ! empty( $row['cover_url'] ) && ! has_post_thumbnail( $post_id ) ) {
		trsss_maybe_import_book_cover( $post_id, $row['cover_url'] );
	}

	return array(
		'id'      => (int) $post_id,
		'updated' => (bool) $existing_id,
	);
}

function trsss_import_book_to_woocommerce( array $row ) {
	if ( ! trsss_is_woocommerce_available() || ! class_exists( 'WC_Product_Simple' ) ) {
		return trsss_woocommerce_required_error();
	}

	$title = trim( (string) ( $row['title'] ?? '' ) );
	$isbn  = trim( (string) ( ! empty( $row['isbn'] ) ? $row['isbn'] : ( $row['isbn13'] ?? '' ) ) );
	$sku   = trim( (string) ( ! empty( $row['sku'] ) ? $row['sku'] : $isbn ) );

	if ( '' === $title ) {
		return new WP_Error( 'missing_title', __( 'title is required.', 'shelfsage' ) );
	}

	$existing_id = trsss_find_existing_imported_product( $title, $isbn, $sku );
	$product     = $existing_id ? wc_get_product( $existing_id ) : new WC_Product_Simple();
	if ( ! $product ) {
		$product = new WC_Product_Simple();
	}

	$product->set_name( $title );
	$product->set_status( in_array( $row['status'] ?? '', array( 'draft', 'pending', 'private', 'publish' ), true ) ? $row['status'] : 'publish' );
	$product->set_catalog_visibility( 'visible' );
	$product->set_description( wp_kses_post( $row['description'] ?? '' ) );
	$product->set_short_description( wp_kses_post( ! empty( $row['short_description'] ) ? $row['short_description'] : ( $row['subtitle'] ?? '' ) ) );

	$regular_price = trsss_import_clean_price( $row['price'] ?? '' );
	$sale_price    = trsss_import_clean_price( $row['sale_price'] ?? '' );
	if ( '' !== $regular_price ) {
		$product->set_regular_price( $regular_price );
		$product->set_price( '' !== $sale_price ? $sale_price : $regular_price );
	}
	if ( '' !== $sale_price ) {
		$product->set_sale_price( $sale_price );
	}

	if ( $sku && ( ! $existing_id || $product->get_sku() !== $sku ) && ! wc_get_product_id_by_sku( $sku ) ) {
		$product->set_sku( $sku );
	}

	$stock_quantity = isset( $row['stock_quantity'] ) ? trim( (string) $row['stock_quantity'] ) : '';
	if ( '' !== $stock_quantity && is_numeric( $stock_quantity ) ) {
		$product->set_manage_stock( true );
		$product->set_stock_quantity( (int) $stock_quantity );
	}
	$product->set_stock_status( trsss_import_clean_stock_status( $row['stock_status'] ?? 'instock' ) );

	$product_id = $product->save();
	if ( ! $product_id ) {
		return new WP_Error( 'product_save_failed', __( 'WooCommerce product could not be saved.', 'shelfsage' ) );
	}

	$meta_map = array(
		'isbn'            => '_rmss_isbn',
		'isbn13'          => '_rmss_isbn13',
		'pages'           => '_rmss_pages',
		'edition'         => '_rmss_edition',
		'pub_date'        => '_rmss_pub_date',
		'ribbon'          => '_rmss_product_badge',
		'look_inside_url' => '_rmss_look_inside_url',
	);
	foreach ( $meta_map as $row_key => $meta_key ) {
		if ( isset( $row[ $row_key ] ) && '' !== $row[ $row_key ] ) {
			update_post_meta( $product_id, $meta_key, $row[ $row_key ] );
		}
	}

	trsss_import_set_object_terms_from_text( $product_id, 'product_cat', $row['category'] ?? '' );
	trsss_import_set_object_terms_from_text( $product_id, 'rmss_genre', ! empty( $row['genre'] ) ? $row['genre'] : ( $row['category'] ?? '' ) );
	trsss_import_set_object_terms_from_text( $product_id, 'rmss_author', $row['author'] ?? '' );
	trsss_import_set_object_terms_from_text( $product_id, 'rmss_publisher', $row['publisher'] ?? '' );

	if ( ! empty( $row['cover_url'] ) && ! has_post_thumbnail( $product_id ) ) {
		trsss_maybe_import_book_cover( $product_id, $row['cover_url'] );
	}

	return array(
		'id'      => (int) $product_id,
		'updated' => (bool) $existing_id,
	);
}

/**
 * REST callback: import mapped rows into Vault assets or WooCommerce products.
 *
 * @param WP_REST_Request $request Request.
 * @return WP_REST_Response|WP_Error
 */
function trsss_import_books_rest( WP_REST_Request $request ) {
	$params = $request->get_json_params();
	$rows   = isset( $params['rows'] ) && is_array( $params['rows'] ) ? $params['rows'] : array();
	$target = isset( $params['target'] ) ? sanitize_key( $params['target'] ) : 'vault';
	$target = in_array( $target, array( 'vault', 'woocommerce' ), true ) ? $target : 'vault';

	if ( empty( $rows ) ) {
		return new WP_Error( 'missing_rows', __( 'No import rows were provided.', 'shelfsage' ), array( 'status' => 422 ) );
	}
	if ( 'woocommerce' === $target && ! trsss_is_woocommerce_available() ) {
		return trsss_woocommerce_required_error();
	}

	$max_rows = (int) apply_filters( 'trsss_import_books_max_rows_per_request', 100 );
	$rows     = array_slice( $rows, 0, max( 1, $max_rows ) );

	$imported = 0;
	$updated  = 0;
	$skipped  = 0;
	$errors   = array();

	foreach ( $rows as $index => $raw_row ) {
		if ( ! is_array( $raw_row ) ) {
			$skipped++;
			continue;
		}

		$row   = trsss_sanitize_import_book_row( $raw_row );
		$title = trim( (string) ( $row['title'] ?? '' ) );
		$isbn  = trim( (string) ( $row['isbn'] ?? '' ) );

		if ( '' === $title ) {
			$skipped++;
			$errors[] = sprintf(
				/* translators: %d: row number. */
				__( 'Row %d skipped: title is required.', 'shelfsage' ),
				$index + 1
			);
			continue;
		}

		$result = ( 'woocommerce' === $target ) ? trsss_import_book_to_woocommerce( $row ) : trsss_import_book_to_vault( $row );

		if ( is_wp_error( $result ) ) {
			$skipped++;
			$errors[] = sprintf(
				/* translators: 1: row number, 2: error message. */
				__( 'Row %1$d failed: %2$s', 'shelfsage' ),
				$index + 1,
				$result->get_error_message()
			);
			continue;
		}

		if ( ! empty( $result['updated'] ) ) {
			$updated++;
		} else {
			$imported++;
		}
	}

	return rest_ensure_response(
		array(
			'success'  => true,
			'target'   => $target,
			'imported' => $imported + $updated,
			'created'  => $imported,
			'updated'  => $updated,
			'skipped'  => $skipped,
			'errors'   => array_slice( $errors, 0, 20 ),
		)
	);
}
