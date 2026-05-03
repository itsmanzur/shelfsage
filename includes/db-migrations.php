<?php
/**
 * One-time database tweaks (ISBN-weighted post_meta queries).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'TRSSS_DB_SCHEMA_VERSION', 2 );

/**
 * Applies pending upgrades when ShelfSage version constants advance.
 *
 * Filters:
 * - trsss_skip_postmeta_isbn_index — return TRUE to bypass ALTER TABLE (managed hosting).
 */
function trsss_shelfsage_maybe_run_database_migrations(): void {
	if ( ! function_exists( 'get_option' ) ) {
		return;
	}

	$applied = (int) get_option( 'trsss_db_schema_version', 0 );

	if ( $applied >= TRSSS_DB_SCHEMA_VERSION ) {
		return;
	}

	if ( TRSSS_DB_SCHEMA_VERSION >= 2 && $applied < 2 && ! apply_filters( 'trsss_skip_postmeta_isbn_index', false ) ) {
		trsss_shelfsage_install_postmeta_isbn_index();
	}

	update_option( 'trsss_db_schema_version', TRSSS_DB_SCHEMA_VERSION, false );
}

/**
 * Builds idx_shelfsage_isbn (meta_key(20), meta_value(40)).
 */
function trsss_shelfsage_install_postmeta_isbn_index(): void {
	global $wpdb;

	$index_slug = 'idx_shelfsage_isbn';
	$table_safe = preg_replace( '/[^A-Za-z0-9_]/', '', $wpdb->postmeta );
	$index_safe = preg_replace( '/[^A-Za-z0-9_]/', '', $index_slug );

	$row = $wpdb->get_row(
		$wpdb->prepare(
			"SHOW INDEX FROM `{$wpdb->postmeta}` WHERE Key_name = %s LIMIT 1",
			$index_slug
		),
		ARRAY_A
	);

	if ( is_array( $row ) ) {
		return;
	}

	$ddl = sprintf(
		'ALTER TABLE `%s` ADD INDEX `%s` (meta_key(20), meta_value(40))',
		$table_safe,
		$index_safe
	);

	$result = $wpdb->query( $ddl ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- one-time DDL.

	if ( false === $result ) {
		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log(
				sprintf(
					'[ShelfSage] idx_shelfsage_isbn install failed (%s)',
					method_exists( $wpdb, 'last_error' ) ? $wpdb->last_error : 'unknown_error'
				)
			);
		}

		update_option(
			'trsss_postmeta_isbn_idx',
			array(
				'ok'       => false,
				'messages' => method_exists( $wpdb, 'last_error' ) ? $wpdb->last_error : '',
			),
			false
		);

		return;
	}

	update_option(
		'trsss_postmeta_isbn_idx',
		array(
			'ok'   => true,
			'name' => $index_slug,
			'ts'   => time(),
		),
		false
	);
}

add_action( 'plugins_loaded', 'trsss_shelfsage_maybe_run_database_migrations', 30 );
