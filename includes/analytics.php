<?php
/**
 * ShelfSage analytics tracking and dashboard data.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TRSSS_ANALYTICS_VIEW_META = '_trsss_view_count';
const TRSSS_ANALYTICS_SEARCH_OPTION = 'trsss_search_trends';
const TRSSS_ANALYTICS_VIEW_COOKIE_PREFIX = 'trsss_viewed_';

/**
 * Detect common search-engine and tooling bots so they do not pollute
 * the most-viewed analytics with crawler hits.
 *
 * @return bool True when the current request looks like a bot.
 */
function trsss_analytics_request_is_bot() {
	$ua = isset( $_SERVER['HTTP_USER_AGENT'] )
		? strtolower( wp_unslash( $_SERVER['HTTP_USER_AGENT'] ) )
		: '';

	if ( '' === $ua ) {
		return true;
	}

	$bots = apply_filters(
		'trsss_analytics_bot_user_agents',
		array(
			'bot',
			'crawl',
			'spider',
			'slurp',
			'duckduck',
			'baidu',
			'yandex',
			'facebookexternalhit',
			'embedly',
			'pingdom',
			'lighthouse',
			'gtmetrix',
			'curl',
			'wget',
			'headlesschrome',
			'applebot',
		)
	);

	foreach ( (array) $bots as $needle ) {
		if ( '' !== $needle && false !== strpos( $ua, $needle ) ) {
			return true;
		}
	}

	return false;
}

/**
 * Track product views on the frontend.
 *
 * Skips admin/AJAX/REST/CLI/feed contexts, search-engine bots, and any
 * visitor that already counted within the cookie TTL window so that
 * `update_post_meta()` is not hammered on every page load.
 *
 * @return void
 */
function trsss_analytics_track_product_view() {
	if ( is_admin() || wp_doing_ajax() || wp_doing_cron() || is_feed() ) {
		return;
	}

	if ( defined( 'REST_REQUEST' ) && REST_REQUEST ) {
		return;
	}

	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}

	$product_id = get_queried_object_id();
	if ( ! $product_id || 'product' !== get_post_type( $product_id ) ) {
		return;
	}

	if ( trsss_analytics_request_is_bot() ) {
		return;
	}

	// Per-visitor dedupe window so refreshes / repeat visits do not
	// spam DB writes. Default 24h; filterable.
	$cookie_ttl = (int) apply_filters( 'trsss_analytics_view_cookie_ttl', DAY_IN_SECONDS, $product_id );
	$cookie_key = TRSSS_ANALYTICS_VIEW_COOKIE_PREFIX . $product_id;

	if ( isset( $_COOKIE[ $cookie_key ] ) ) {
		return;
	}

	$count = (int) get_post_meta( $product_id, TRSSS_ANALYTICS_VIEW_META, true );
	update_post_meta( $product_id, TRSSS_ANALYTICS_VIEW_META, $count + 1 );
	update_post_meta( $product_id, '_trsss_last_viewed_at', current_time( 'mysql' ) );

	if ( ! headers_sent() ) {
		setcookie(
			$cookie_key,
			'1',
			time() + $cookie_ttl,
			defined( 'COOKIEPATH' ) ? COOKIEPATH : '/',
			defined( 'COOKIE_DOMAIN' ) ? COOKIE_DOMAIN : '',
			is_ssl(),
			true
		);
	}
}
add_action( 'template_redirect', 'trsss_analytics_track_product_view', 20 );

/**
 * Track ShelfSage search terms.
 *
 * @param array $params REST request params.
 * @return void
 */
function trsss_analytics_track_search( array $params ) {
	if ( ! empty( $params['preview'] ) ) {
		return;
	}

	$term = '';
	if ( isset( $params['term'] ) ) {
		$term = sanitize_text_field( $params['term'] );
	} elseif ( isset( $params['search'] ) ) {
		$term = sanitize_text_field( $params['search'] );
	}

	$term = trim( wp_strip_all_tags( $term ) );
	if ( '' === $term || strlen( $term ) < 2 ) {
		return;
	}

	$key    = function_exists( 'mb_strtolower' ) ? mb_strtolower( $term ) : strtolower( $term );
	$trends = get_option( TRSSS_ANALYTICS_SEARCH_OPTION, array() );
	if ( ! is_array( $trends ) ) {
		$trends = array();
	}

	if ( ! isset( $trends[ $key ] ) || ! is_array( $trends[ $key ] ) ) {
		$trends[ $key ] = array(
			'term'  => $term,
			'count' => 0,
			'last'  => '',
		);
	}

	$trends[ $key ]['term']  = $term;
	$trends[ $key ]['count'] = (int) $trends[ $key ]['count'] + 1;
	$trends[ $key ]['last']  = current_time( 'mysql' );

	uasort(
		$trends,
		function ( $a, $b ) {
			return (int) ( $b['count'] ?? 0 ) <=> (int) ( $a['count'] ?? 0 );
		}
	);

	$trends = array_slice( $trends, 0, 100, true );
	update_option( TRSSS_ANALYTICS_SEARCH_OPTION, $trends, false );
}

/**
 * Get top viewed WooCommerce products.
 *
 * @param int $limit Number of rows.
 * @return array
 */
function trsss_analytics_get_most_viewed( $limit = 5 ) {
	if ( ! trsss_is_woocommerce_available() ) {
		return array();
	}

	$posts = get_posts(
		array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => max( 1, absint( $limit ) ),
			'meta_key'       => TRSSS_ANALYTICS_VIEW_META,
			'orderby'        => 'meta_value_num',
			'order'          => 'DESC',
			'fields'         => 'ids',
		)
	);

	$items = array();
	foreach ( $posts as $post_id ) {
		$views = (int) get_post_meta( $post_id, TRSSS_ANALYTICS_VIEW_META, true );
		if ( $views < 1 ) {
			continue;
		}

		$items[] = array(
			'id'     => (int) $post_id,
			'title'  => get_the_title( $post_id ),
			'views'  => $views,
			'editUrl' => get_edit_post_link( $post_id, 'raw' ),
			'url'    => get_permalink( $post_id ),
		);
	}

	return $items;
}

/**
 * Get top search trends.
 *
 * @param int $limit Number of rows.
 * @return array
 */
function trsss_analytics_get_search_trends( $limit = 8 ) {
	$trends = get_option( TRSSS_ANALYTICS_SEARCH_OPTION, array() );
	if ( ! is_array( $trends ) ) {
		return array();
	}

	uasort(
		$trends,
		function ( $a, $b ) {
			return (int) ( $b['count'] ?? 0 ) <=> (int) ( $a['count'] ?? 0 );
		}
	);

	$items = array();
	foreach ( array_slice( $trends, 0, max( 1, absint( $limit ) ), true ) as $row ) {
		$items[] = array(
			'term'  => isset( $row['term'] ) ? sanitize_text_field( $row['term'] ) : '',
			'count' => isset( $row['count'] ) ? (int) $row['count'] : 0,
			'last'  => isset( $row['last'] ) ? sanitize_text_field( $row['last'] ) : '',
		);
	}

	return $items;
}

/**
 * Add analytics data to the React admin payload.
 *
 * @param array $settings Localized admin settings.
 * @return array
 */
function trsss_analytics_add_admin_payload( $settings ) {
	$settings['analytics'] = array(
		'mostViewed'   => trsss_analytics_get_most_viewed( 5 ),
		'searchTrends' => trsss_analytics_get_search_trends( 8 ),
	);

	return $settings;
}
add_filter( 'trsss_admin_global_settings', 'trsss_analytics_add_admin_payload' );