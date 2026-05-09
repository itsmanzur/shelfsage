<?php
/**
 * ShelfSage uninstall handler.
 *
 * Triggered by WordPress when an admin clicks "Delete" on the plugin row in
 * Plugins → Installed Plugins. Plugin code is NOT loaded at this point —
 * everything must be self-contained.
 *
 * Cleans up every persistent artefact created by ShelfSage:
 *
 *   wp_options
 *     - shelfsage_settings              main plugin settings
 *     - shelfsage_active_taxonomies     onboarding choice
 *     - shelfsage_google_api_key        legacy standalone option
 *     - rmss_demo_content_imported      onboarding flag
 *     - trsss_search_trends             analytics search aggregator
 *     - trsss_db_schema_version         migration version
 *     - trsss_postmeta_isbn_idx         migration result
 *     - trsss_api_cred_migrated_v2      credential-store migration flag
 *     - trsss_do_activation_redirect    welcome-screen redirect flag
 *
 *   wp_postmeta
 *     - _rmss_*                         all book-detail product meta
 *     - _trsss_view_count               analytics view counter
 *     - _trsss_last_viewed_at           analytics last-view timestamp
 *     - _trsss_series_order             series reading order
 *     - _trsss_ebook_dl_*               e-book download counters / timestamps
 *     - _ss_vault_*                     Vault asset meta (also removed when
 *                                       the parent Vault posts are deleted)
 *
 *   wp_usermeta
 *     - _trsss_reading_list             "My Library" per-user reading list
 *
 *   wp_commentmeta
 *     - _trsss_verified_purchase        verified-purchase badge marker
 *
 *   Custom post types
 *     - ss_vault_assets                 Vault entries (with attached meta)
 *     - rmss_shortcode                  Saved Architect shortcodes
 *
 *   Custom taxonomies
 *     - rmss_author / rmss_publisher / rmss_translator / rmss_series /
 *       rmss_genre — terms removed (term-meta cascades automatically)
 *
 *   Transients
 *     - trsss_book_api_*                Google Books / Amazon API cache
 *
 *   Indexes
 *     - idx_shelfsage_isbn on wp_postmeta
 *
 * Operators that want to keep customer data after uninstall (e.g. before a
 * staged re-install, or for a regulated migration) can short-circuit the
 * whole routine by dropping a single MU plugin file with:
 *
 *     <?php
 *     add_filter( 'trsss_skip_uninstall_cleanup', '__return_true' );
 *
 * Multisite installs run the cleanup once per site.
 *
 * @package ShelfSage
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

if ( apply_filters( 'trsss_skip_uninstall_cleanup', false ) ) {
	return;
}

/**
 * Run the full cleanup against the currently-active site.
 *
 * @return void
 */
function trsss_uninstall_cleanup_for_site() {
	global $wpdb;

	// 1. wp_options ---------------------------------------------------------

	$options = array(
		'shelfsage_settings',
		'shelfsage_active_taxonomies',
		'shelfsage_google_api_key',
		'rmss_demo_content_imported',
		'trsss_search_trends',
		'trsss_db_schema_version',
		'trsss_postmeta_isbn_idx',
		'trsss_api_cred_migrated_v2',
		'trsss_do_activation_redirect',
	);
	foreach ( $options as $option ) {
		delete_option( $option );
	}

	// 2. wp_postmeta --------------------------------------------------------

	// Exact-match keys (single value each).
	$postmeta_keys = array(
		'_trsss_view_count',
		'_trsss_last_viewed_at',
		'_trsss_series_order',
	);
	foreach ( $postmeta_keys as $meta_key ) {
		$wpdb->delete( $wpdb->postmeta, array( 'meta_key' => $meta_key ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
	}

	// Prefix-match keys (variable suffixes like product IDs).
	$postmeta_prefixes = array(
		'_rmss_',           // every book-detail field
		'_trsss_ebook_dl_', // download counters + last-download timestamps on orders
		'_ss_vault_',       // Vault asset meta (belt + braces; CPT delete handles most)
	);
	foreach ( $postmeta_prefixes as $prefix ) {
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->postmeta} WHERE meta_key LIKE %s", $wpdb->esc_like( $prefix ) . '%' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.NotPrepared
	}

	// 3. wp_usermeta --------------------------------------------------------

	$wpdb->delete( $wpdb->usermeta, array( 'meta_key' => '_trsss_reading_list' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	// 4. wp_commentmeta -----------------------------------------------------

	$wpdb->delete( $wpdb->commentmeta, array( 'meta_key' => '_trsss_verified_purchase' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	// 5. Custom post types --------------------------------------------------

	$cpt_slugs = array( 'ss_vault_assets', 'rmss_shortcode' );
	foreach ( $cpt_slugs as $cpt ) {
		$post_ids = $wpdb->get_col( $wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s", $cpt ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		foreach ( (array) $post_ids as $post_id ) {
			wp_delete_post( (int) $post_id, true );
		}
	}

	// 6. Custom taxonomy terms ---------------------------------------------

	$taxonomies = array( 'rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre' );
	foreach ( $taxonomies as $taxonomy ) {
		// Taxonomies aren't registered during uninstall — query terms directly
		// then delete via the taxonomy SQL.
		$term_ids = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT t.term_id FROM {$wpdb->terms} AS t
				 INNER JOIN {$wpdb->term_taxonomy} AS tt ON t.term_id = tt.term_id
				 WHERE tt.taxonomy = %s",
				$taxonomy
			)
		); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

		foreach ( (array) $term_ids as $term_id ) {
			$term_id = (int) $term_id;
			$wpdb->delete( $wpdb->term_relationships, array( 'term_taxonomy_id' => $term_id ) );  // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->delete( $wpdb->term_taxonomy, array( 'term_id' => $term_id, 'taxonomy' => $taxonomy ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->delete( $wpdb->terms, array( 'term_id' => $term_id ) );                         // phpcs:ignore WordPress.DB.DirectDatabaseQuery
			$wpdb->delete( $wpdb->termmeta, array( 'term_id' => $term_id ) );                      // phpcs:ignore WordPress.DB.DirectDatabaseQuery
		}
	}

	// 7. Transients ---------------------------------------------------------

	$transient_prefixes = array(
		'_transient_trsss_book_api_',
		'_transient_timeout_trsss_book_api_',
		'_transient_trsss_',
		'_transient_timeout_trsss_',
	);
	foreach ( $transient_prefixes as $prefix ) {
		$wpdb->query( $wpdb->prepare( "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $wpdb->esc_like( $prefix ) . '%' ) ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.NotPrepared
	}

	// 8. Drop custom index --------------------------------------------------

	// idx_shelfsage_isbn was added by includes/db-migrations.php to speed
	// up ISBN lookups. Removing it leaves the table in its original shape.
	$index_exists = $wpdb->get_var(
		$wpdb->prepare( "SHOW INDEX FROM {$wpdb->postmeta} WHERE Key_name = %s", 'idx_shelfsage_isbn' )
	); // phpcs:ignore WordPress.DB.DirectDatabaseQuery

	if ( $index_exists ) {
		$wpdb->query( "ALTER TABLE {$wpdb->postmeta} DROP INDEX `idx_shelfsage_isbn`" ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery,WordPress.DB.PreparedSQL.NotPrepared
	}

	// 9. Object cache -------------------------------------------------------

	if ( function_exists( 'wp_cache_flush_group' ) ) {
		// Drop the dedicated ShelfSage API cache group only — never the global cache.
		wp_cache_flush_group( 'trsss_book_api' );
	}
}

if ( is_multisite() ) {
	$blog_ids = get_sites( array( 'fields' => 'ids', 'number' => 0 ) );
	foreach ( (array) $blog_ids as $blog_id ) {
		switch_to_blog( (int) $blog_id );
		trsss_uninstall_cleanup_for_site();
		restore_current_blog();
	}
} else {
	trsss_uninstall_cleanup_for_site();
}
