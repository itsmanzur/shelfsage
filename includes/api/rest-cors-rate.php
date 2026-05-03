<?php
/**
 * ShelfSage REST: CORS tweaks, anonymous rate limiting, deterministic search cache payload.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * ShelfSage REST routes-এ missing CORS headers যোগ করে।
 * IMPORTANT: global rest_send_cors_headers remove করা হয় না — Elementor ভেঙে যায়।
 * শুধু shelfsage/v1 namespace-এ extra headers inject করা হয়।
 */
add_filter( 'rest_post_dispatch', 'trsss_add_shelfsage_cors_headers', 10, 3 );
function trsss_add_shelfsage_cors_headers( $result, $server, $request ) {
	$route = $request->get_route();
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
	if ( '' === $ip ) {
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
		'term',
		'type',
		'author',
		'publisher',
		'genre',
		'collection',
		'limit',
		'include',
		'category',
		'sort_by',
		'sort_order',
	);
	$slice = array();

	foreach ( $keys as $k ) {
		if ( isset( $params[ $k ] ) && $params[ $k ] !== '' && null !== $params[ $k ] ) {
			$slice[ $k ] = $params[ $k ];
		}
	}

	ksort( $slice );

	return wp_json_encode( $slice );
}
