<?php
/**
 * ShelfSage Vault Single Asset Template
 * Loads layout from General Options > Vault Single Layout.
 *
 * @package ShelfSage
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

$vault_id = get_the_ID();
$settings = trsss_get_shelfsage_settings_array();
$labels = isset($settings['labels']) ? $settings['labels'] : array();

function trsss_vault_get_label($key, $default, $labels) {
    return !empty($labels[$key]) ? $labels[$key] : $default;
}
if (!function_exists('rmss_get_label')) {
    function rmss_get_label($key, $default, $labels) {
        return trsss_vault_get_label($key, $default, $labels);
    }
}

// Vault meta
$author = get_post_meta($vault_id, '_ss_vault_author', true);
$subtitle = get_post_meta($vault_id, '_ss_vault_subtitle', true);
$price = get_post_meta($vault_id, '_ss_vault_price', true);
$old_price = get_post_meta($vault_id, '_ss_vault_old_price', true);
$category = get_post_meta($vault_id, '_ss_vault_category', true);
$link = get_post_meta($vault_id, '_ss_vault_link', true);
$button_text = get_post_meta($vault_id, '_ss_vault_button_text', true) ?: trsss_vault_get_label('view_details', __('View Details', 'shelfsage'), $labels);
$look_inside_url = get_post_meta($vault_id, '_ss_vault_look_inside_url', true);
$ribbon = get_post_meta($vault_id, '_ss_vault_ribbon', true);
$rating = get_post_meta($vault_id, '_ss_vault_rating', true);

$cover_url = get_the_post_thumbnail_url($vault_id, 'woocommerce_single');
if (!$cover_url) {
    $cover_url = defined('TRSSS_URL') ? TRSSS_URL . 'assets/default-book.png' : '';
}

$layout = isset($settings['vault_single_layout']) && !empty($settings['vault_single_layout'])
    ? sanitize_key($settings['vault_single_layout'])
    : 'style-1';
$valid_layouts = array('style-1', 'style-2', 'style-3', 'style-4', 'style-5', 'classic');
if (!in_array($layout, $valid_layouts, true)) {
    $layout = 'style-1';
}
$layout_file = TRSSS_PATH . 'templates/vault-layouts/vault-' . $layout . '.php';
if (!file_exists($layout_file)) {
    $layout_file = TRSSS_PATH . 'templates/vault-layouts/vault-style-1.php';
}

if (defined('TRSSS_URL')) {
    echo '<link rel="stylesheet" id="rmss-app-css-forced" href="' . esc_url( TRSSS_URL . 'assets/index.css?ver=' . time() ) . '" media="all" />';
}
include $layout_file;
if ($look_inside_url && defined('TRSSS_PATH') && file_exists(TRSSS_PATH . 'includes/look-inside-modal.php')) {
    $product_id = $vault_id;
    $authors = $author ? array((object) array('name' => $author)) : array();
    include TRSSS_PATH . 'includes/look-inside-modal.php';
}
get_footer();
