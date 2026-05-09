<?php
/**
 * Reading list / wishlist REST handlers.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TRSSS_READING_LIST_META_KEY = '_trsss_reading_list';

function trsss_reading_list_allowed_statuses() {
	return array( 'wishlist', 'reading', 'finished' );
}

function trsss_normalize_reading_list( $raw ) {
	$list = is_array( $raw ) ? $raw : array();
	$out  = array();

	foreach ( $list as $product_id => $entry ) {
		$product_id = absint( $product_id );
		if ( ! $product_id ) {
			continue;
		}
		$status = is_array( $entry ) && ! empty( $entry['status'] ) ? sanitize_key( $entry['status'] ) : 'wishlist';
		if ( ! in_array( $status, trsss_reading_list_allowed_statuses(), true ) ) {
			$status = 'wishlist';
		}
		$out[ $product_id ] = array(
			'product_id' => $product_id,
			'status'     => $status,
			'added_at'   => is_array( $entry ) && ! empty( $entry['added_at'] ) ? absint( $entry['added_at'] ) : time(),
			'updated_at' => is_array( $entry ) && ! empty( $entry['updated_at'] ) ? absint( $entry['updated_at'] ) : time(),
		);
	}

	uasort(
		$out,
		function ( $a, $b ) {
			return (int) $b['updated_at'] <=> (int) $a['updated_at'];
		}
	);

	return $out;
}

function trsss_get_user_reading_list( $user_id = 0 ) {
	$user_id = $user_id ? absint( $user_id ) : get_current_user_id();
	if ( ! $user_id ) {
		return array();
	}
	return trsss_normalize_reading_list( get_user_meta( $user_id, TRSSS_READING_LIST_META_KEY, true ) );
}

function trsss_save_user_reading_list( array $list, $user_id = 0 ) {
	$user_id = $user_id ? absint( $user_id ) : get_current_user_id();
	if ( ! $user_id ) {
		return false;
	}
	update_user_meta( $user_id, TRSSS_READING_LIST_META_KEY, trsss_normalize_reading_list( $list ) );
	return true;
}

function trsss_format_reading_list_product( $product_id, $entry ) {
	$product = trsss_is_woocommerce_available() ? wc_get_product( $product_id ) : null;
	if ( ! $product ) {
		return null;
	}

	$author_terms = get_the_terms( $product_id, 'rmss_author' );
	$author_names = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'name' ) : array();
	$thumb_url    = get_the_post_thumbnail_url( $product_id, 'woocommerce_thumbnail' ) ?: '';
	$image_url    = get_the_post_thumbnail_url( $product_id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $product_id, 'large' ) ?: $thumb_url;

	return array(
		'id'              => $product_id,
		'product_id'      => $product_id,
		'status'          => $entry['status'],
		'added_at'        => $entry['added_at'],
		'updated_at'      => $entry['updated_at'],
		'title'           => $product->get_title(),
		'thumbnail'       => $thumb_url,
		'image'           => $image_url,
		'authors'         => implode( ', ', $author_names ),
		'price'           => wp_kses_post( $product->get_price_html() ),
		'permalink'       => get_permalink( $product_id ),
		'summary'         => wp_trim_words( $product->get_short_description(), 18 ),
		'rating'          => (float) $product->get_average_rating(),
		'rating_html'     => wp_kses_post( wc_get_rating_html( $product->get_average_rating(), $product->get_review_count() ) ),
		'review_count'    => (int) $product->get_review_count(),
		'look_inside_url' => get_post_meta( $product_id, '_rmss_look_inside_url', true ) ?: '',
	);
}

function trsss_reading_list_response( array $list ) {
	$ids = array_values( array_filter( array_map( 'absint', array_keys( $list ) ) ) );

	if ( ! empty( $ids ) ) {
		// Hydrate posts + their assigned terms + post meta in one query per
		// table instead of N queries per row inside the loop below.
		_prime_post_caches( $ids, true, true );

		// Featured images live in a separate posts row (the attachment) plus
		// `_wp_attachment_metadata`. Prime those too so the per-row
		// `get_the_post_thumbnail_url()` calls hit the object cache only.
		$thumb_ids = array();
		foreach ( $ids as $product_id ) {
			$thumb_id = (int) get_post_thumbnail_id( $product_id );
			if ( $thumb_id ) {
				$thumb_ids[] = $thumb_id;
			}
		}
		if ( ! empty( $thumb_ids ) ) {
			_prime_post_caches( array_unique( $thumb_ids ), false, true );
		}
	}

	$items = array();
	foreach ( $list as $product_id => $entry ) {
		$item = trsss_format_reading_list_product( (int) $product_id, $entry );
		if ( $item ) {
			$items[] = $item;
		}
	}

	return rest_ensure_response(
		array(
			'success' => true,
			'items'   => $items,
			'ids'     => $ids,
		)
	);
}

function trsss_get_reading_list_rest() {
	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'not_logged_in', __( 'Please log in to view your reading list.', 'shelfsage' ), array( 'status' => 401 ) );
	}
	return trsss_reading_list_response( trsss_get_user_reading_list() );
}

function trsss_update_reading_list_rest( WP_REST_Request $request ) {
	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'not_logged_in', __( 'Please log in to save your reading list.', 'shelfsage' ), array( 'status' => 401 ) );
	}

	$params     = $request->get_json_params();
	$product_id = isset( $params['product_id'] ) ? absint( $params['product_id'] ) : 0;
	$status     = isset( $params['status'] ) ? sanitize_key( $params['status'] ) : 'wishlist';

	if ( ! $product_id || 'product' !== get_post_type( $product_id ) ) {
		return new WP_Error( 'invalid_product', __( 'A valid product is required.', 'shelfsage' ), array( 'status' => 422 ) );
	}
	if ( ! in_array( $status, trsss_reading_list_allowed_statuses(), true ) ) {
		$status = 'wishlist';
	}

	$list = trsss_get_user_reading_list();
	$now  = time();
	$list[ $product_id ] = array(
		'product_id' => $product_id,
		'status'     => $status,
		'added_at'   => isset( $list[ $product_id ]['added_at'] ) ? (int) $list[ $product_id ]['added_at'] : $now,
		'updated_at' => $now,
	);
	trsss_save_user_reading_list( $list );

	return trsss_reading_list_response( $list );
}

function trsss_delete_reading_list_item_rest( WP_REST_Request $request ) {
	if ( ! is_user_logged_in() ) {
		return new WP_Error( 'not_logged_in', __( 'Please log in to update your reading list.', 'shelfsage' ), array( 'status' => 401 ) );
	}

	$product_id = absint( $request['product_id'] );
	$list       = trsss_get_user_reading_list();
	if ( isset( $list[ $product_id ] ) ) {
		unset( $list[ $product_id ] );
		trsss_save_user_reading_list( $list );
	}

	return trsss_reading_list_response( $list );
}
