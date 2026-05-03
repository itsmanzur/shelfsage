<?php
/**
 * Book-facing API caches (merged Amazon/Google, Google Books payloads).
 *
 * When WordPress runs with Redis/Memcached (wp_using_ext_object_cache), large blobs are NOT duplicated
 * into wp_options by default — Section 7 transient flood mitigation.
 *
 * Filter trsss_book_api_always_write_db_transients → true duplicates into DB even with ext object cache set.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Cache group slug for ShelfSage Book API payloads.
 *
 * @return string
 */
function trsss_book_api_cache_group() {
	return (string) apply_filters( 'trsss_book_api_cache_group', 'trsss_book_api' );
}

/**
 * Whether transient rows should ALSO be saved in wp_options (duplicates payloads).
 *
 * Defaults: duplicates only without external object cache.
 *
 * @return bool
 */
function trsss_book_api_should_dup_transients() {
	if ( wp_using_ext_object_cache() ) {
		return (bool) apply_filters( 'trsss_book_api_always_write_db_transients', false );
	}

	return true;
}

/**
 * @param string $cache_key Canonical transient key (`trsss_merged_*`, `trsss_gb_*`, …).
 *
 * @return mixed|false Stored structure or FALSE.
 */
function trsss_book_api_cache_get( string $cache_key ) {
	$group = trsss_book_api_cache_group();

	$cached = wp_cache_get( $cache_key, $group );
	if ( false !== $cached ) {
		return $cached;
	}

	$from_opts = get_transient( $cache_key );
	if ( false !== $from_opts ) {
		wp_cache_set(
			$cache_key,
			$from_opts,
			$group,
			apply_filters( 'trsss_book_api_cache_warm_ttl', 26 * HOUR_IN_SECONDS, $cache_key )
		);

		return $from_opts;
	}

	return false;
}

/**
 * @param string $cache_key   Key (same transient identifier used historically).
 * @param mixed  $payload     Stored JSON-decoded structure or primitive.
 * @param int    $expiration  Seconds TTL.
 */
function trsss_book_api_cache_set( string $cache_key, $payload, int $expiration ): void {
	$expiration = max( 120, $expiration );

	wp_cache_set( $cache_key, $payload, trsss_book_api_cache_group(), $expiration );

	if ( trsss_book_api_should_dup_transients() ) {
		set_transient( $cache_key, $payload, $expiration );
	}
}

/**
 * Invalidate both tiers.
 *
 * @param string $cache_key Cache key slug.
 */
function trsss_book_api_cache_delete( string $cache_key ): void {
	wp_cache_delete( $cache_key, trsss_book_api_cache_group() );

	delete_transient( $cache_key );
}
