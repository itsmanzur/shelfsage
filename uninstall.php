<?php
/**
 * Fired when the plugin is uninstalled.
 *
 * @package ShelfSage
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
    exit;
}

require_once __DIR__ . '/includes/functions-shelfsage-settings.php';

// Delete plugin options
delete_option( TRSSS_OPTION_SETTINGS );
delete_option( 'shelfsage_active_taxonomies' );
delete_option( 'rmss_demo_content_imported' );
delete_option( 'trsss_do_activation_redirect' );

// Clear all plugin transients
global $wpdb;

// Delete trsss_ and rmss_ transients using prepared statements.
$wpdb->query(
    $wpdb->prepare(
        "DELETE FROM {$wpdb->options}
         WHERE option_name LIKE %s
            OR option_name LIKE %s
            OR option_name LIKE %s
            OR option_name LIKE %s",
        $wpdb->esc_like( '_transient_trsss_' ) . '%',
        $wpdb->esc_like( '_transient_timeout_trsss_' ) . '%',
        $wpdb->esc_like( '_transient_rmss_' ) . '%',
        $wpdb->esc_like( '_transient_timeout_rmss_' ) . '%'
    )
);

// Note: We do NOT delete custom post types (books, shortcodes) or taxonomies
// to prevent accidental data loss. Users must delete content manually if desired.
