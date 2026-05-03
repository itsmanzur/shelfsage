<?php
if (!defined('ABSPATH')) {
	exit;
}

function trsss_register_taxonomies()
{
	$active_taxonomies = get_option('shelfsage_active_taxonomies', array());

	// Default all true if option is empty (first run before wizard)
	if (empty($active_taxonomies)) {
		$active_taxonomies = array(
			'author' => true,
			'publisher' => true,
			'translator' => true,
			'series' => true,
			'genre' => true,
			'collection' => true
		);
	}

	$taxonomies = array(
		'rmss_author' => array(
			'single' => __('Book Author', 'shelfsage'),
			'plural' => __('Book Authors', 'shelfsage'),
			'slug' => 'book-author',
			'key' => 'author'
		),
		'rmss_publisher' => array(
			'single' => __('Book Publisher', 'shelfsage'),
			'plural' => __('Book Publishers', 'shelfsage'),
			'slug' => 'book-publisher',
			'key' => 'publisher'
		),
		'rmss_translator' => array(
			'single' => __('Book Translator', 'shelfsage'),
			'plural' => __('Book Translators', 'shelfsage'),
			'slug' => 'book-translator',
			'key' => 'translator'
		),
		'rmss_series' => array(
			'single' => __('Book Series', 'shelfsage'),
			'plural' => __('Book Series', 'shelfsage'),
			'slug' => 'book-series',
			'key' => 'series'
		),
		'rmss_genre' => array(
			'single' => __('Book Genre', 'shelfsage'),
			'plural' => __('Book Genres', 'shelfsage'),
			'slug' => 'book-genre',
			'key' => 'genre'
		),
		'rmss_collection' => array(
			'single' => __('Collection', 'shelfsage'),
			'plural' => __('Collections', 'shelfsage'),
			'slug' => 'book-collection',
			'key' => 'collection'
		),
	);

	foreach ($taxonomies as $key => $value) {
		// Check if enabled
		$option_key = isset($value['key']) ? $value['key'] : '';
		if ($option_key && isset($active_taxonomies[$option_key]) && !$active_taxonomies[$option_key]) {
			continue;
		}

		$labels = array(
			'name' => $value['plural'],
			'singular_name' => $value['single'],
			'search_items' => sprintf(__('Search %s', 'shelfsage'), $value['plural']),
			'all_items' => sprintf(__('All %s', 'shelfsage'), $value['plural']),
			'parent_item' => sprintf(__('Parent %s', 'shelfsage'), $value['single']),
			'parent_item_colon' => sprintf(__('Parent %s:', 'shelfsage'), $value['single']),
			'edit_item' => sprintf(__('Edit %s', 'shelfsage'), $value['single']),
			'update_item' => sprintf(__('Update %s', 'shelfsage'), $value['single']),
			'add_new_item' => sprintf(__('Add New %s', 'shelfsage'), $value['single']),
			'new_item_name' => sprintf(__('New %s Name', 'shelfsage'), $value['single']),
			'menu_name' => $value['plural'],
		);

		$args = array(
			'hierarchical' => true,
			'labels' => $labels,
			'show_ui' => true,
			'show_admin_column' => true,
			'query_var' => true,
			'rewrite' => array('slug' => $value['slug']),
			'show_in_rest' => true,
		);

		register_taxonomy($key, array('product'), $args);
	}
}
add_action('init', 'trsss_register_taxonomies');

/**
 * Generate a Unicode-safe slug from a term name.
 * WordPress's sanitize_title() strips non-ASCII chars; this preserves them.
 *
 * @param string $name The term name.
 * @return string A URL-safe slug preserving Unicode letters (Bengali, Arabic, etc.).
 */
function trsss_unicode_safe_slug($name)
{
	// Normalize: lowercase, trim whitespace.
	$slug = mb_strtolower(trim($name), 'UTF-8');
	// Replace common separators and whitespace with hyphens.
	$slug = preg_replace('/[\s\-_\.]+/u', '-', $slug);
	// Strip characters that are NOT Unicode letters, combining marks (Bengali/Arabic matras),
	// digits, or hyphens. \p{M} covers vowel signs and diacritics essential for Bengali/Arabic.
	$slug = preg_replace('/[^\p{L}\p{M}\p{N}\-]/u', '', $slug);
	// Collapse multiple hyphens.
	$slug = preg_replace('/-{2,}/', '-', $slug);
	// Trim leading/trailing hyphens.
	$slug = trim($slug, '-');
	return $slug;
}

/**
 * Hook into pre_term_slug to produce a Unicode-safe slug for ShelfSage taxonomies.
 * This runs before WordPress sanitizes the slug, preventing corruption.
 *
 * @param string $slug  The proposed slug (may already be sanitized/empty).
 * @param string $taxonomy The taxonomy being saved.
 * @param string $name  The raw term name from POST (available via $_POST).
 * @return string Unicode-safe slug.
 */
function trsss_pre_term_slug_unicode($slug, $taxonomy)
{
	$our_taxes = array('rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre', 'rmss_collection', 'product_tag', 'product_cat');
	if (!in_array($taxonomy, $our_taxes, true)) {
		return $slug;
	}
	// Get the raw name from POST before sanitization.
	$raw_name = isset($_POST['name']) ? wp_unslash($_POST['name']) : '';
	if ($raw_name === '') {
		return $slug;
	}
	$new_slug = trsss_unicode_safe_slug($raw_name);
	if ($new_slug !== '') {
		return $new_slug;
	}
	return $slug;
}
add_filter('pre_term_slug', 'trsss_pre_term_slug_unicode', 5, 2);

/**
 * Fix UTF-8 mojibake (e.g. Bengali showing as à¦¨à¦¾à¦®).
 * Double-encoding: UTF-8 bytes were stored as Latin-1, then saved as UTF-8 again.
 * We reverse that: decode to get the "wrong" code points (0x00–0xFF), treat those as bytes, then decode as UTF-8.
 *
 * @param string $string Text that may be mojibake.
 * @return string Fixed string if mojibake detected, otherwise original.
 */
function trsss_maybe_fix_utf8_mojibake($string)
{
	if (!is_string($string) || $string === '') {
		return $string;
	}
	// Only fix when it looks like double-encoded UTF-8 (e.g. Bengali mojibake à¦, à§). Avoid touching other text.
	if (strpos($string, 'à¦') === false && strpos($string, 'à§') === false) {
		return $string;
	}
	if (function_exists('iconv')) {
		$bytes = @iconv('UTF-8', 'ISO-8859-1//IGNORE', $string);
		if ($bytes !== false && $bytes !== '' && function_exists('mb_check_encoding') && mb_check_encoding($bytes, 'UTF-8') && $bytes !== $string) {
			return $bytes;
		}
	}
	return $string;
}

/** Taxonomies to fix at source (term name + slug) so author/publisher/breadcrumb/edit form display correctly. */
function trsss_taxonomies_for_mojibake_fix()
{
	return array('rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre', 'rmss_collection', 'product_cat', 'product_tag');
}

/** Apply mojibake fix to one term object — name only. Slug is left unchanged (fixing slug was corrupting list/edit). */
function trsss_fix_one_term_mojibake($t)
{
	if (!is_object($t)) {
		return;
	}
	if (isset($t->name) && is_string($t->name)) {
		$t->name = trsss_maybe_fix_utf8_mojibake($t->name);
	}
}

/** Fix term names/slugs when fetched via get_the_terms (author/publisher on product page, etc.). */
function trsss_fix_get_the_terms_at_source($terms, $post_id, $taxonomy)
{
	if (!is_array($terms) || !in_array($taxonomy, trsss_taxonomies_for_mojibake_fix(), true)) {
		return $terms;
	}
	foreach ($terms as $t) {
		trsss_fix_one_term_mojibake($t);
	}
	return $terms;
}
add_filter('get_the_terms', 'trsss_fix_get_the_terms_at_source', 10, 3);

/** Fix term names when fetched via get_terms — applies on frontend and admin. */
function trsss_fix_get_terms_at_source($terms, $taxonomies, $args)
{
	if (!is_array($terms)) {
		return $terms;
	}
	$tax_arr = is_array($taxonomies) ? $taxonomies : array($taxonomies);
	if (array_intersect($tax_arr, trsss_taxonomies_for_mojibake_fix()) === array()) {
		return $terms;
	}
	foreach ($terms as $t) {
		trsss_fix_one_term_mojibake($t);
	}
	return $terms;
}
add_filter('get_terms', 'trsss_fix_get_terms_at_source', 10, 3);

/** Fix single term when loaded via get_term() — applies on frontend and admin. */
function trsss_fix_get_term_at_source($term, $taxonomy)
{
	if (!is_object($term) || !in_array($taxonomy, trsss_taxonomies_for_mojibake_fix(), true)) {
		return $term;
	}
	trsss_fix_one_term_mojibake($term);
	return $term;
}
add_filter('get_term', 'trsss_fix_get_term_at_source', 10, 2);

/**
 * Check if a term slug looks corrupted (mojibake, URL garbage, or repetitive).
 */
function trsss_term_slug_looks_corrupted($slug)
{
	if (!is_string($slug) || $slug === '') {
		return false;
	}
	$slug_lower = strtolower($slug);
	// 1. Contains URL-encoded percent sequences (%e0%a6 etc. = Bengali UTF-8 encoded)
	if (strpos($slug, '%') !== false) {
		return true;
	}
	// 2. Contains Latin-1 supplement mojibake chars (U+00A0–U+00FF) typical of Bengali/Arabic double-encoding
	if (preg_match('/[\x{00A0}-\x{00FF}]/u', $slug)) {
		return true;
	}
	// 3. Same character repeated 4+ times in a row
	if (preg_match('/(.)\1{3,}/', $slug_lower)) {
		return true;
	}
	// 4. Long slug that looks like encoded garbage (only ASCII punctuation/hex)
	if (strlen($slug) > 35 && preg_match('/^[a-z0-9%\-]+$/', $slug_lower) && substr_count($slug, '-') > 6) {
		return true;
	}
	return false;
}

/**
 * Repair one term's slug from its name (if corrupted). Run once per term (tracked via term meta).
 */
function trsss_repair_term_slug_if_needed($term_id, $taxonomy)
{
	$taxonomies = trsss_taxonomies_for_mojibake_fix();
	if (!in_array($taxonomy, $taxonomies, true)) {
		return;
	}
	if (get_term_meta($term_id, '_rmss_slug_repaired', true) === '1') {
		return;
	}
	$term = get_term($term_id, $taxonomy);
	if (!$term || !is_object($term) || is_wp_error($term)) {
		return;
	}
	if (!trsss_term_slug_looks_corrupted($term->slug)) {
		update_term_meta($term_id, '_rmss_slug_repaired', '1');
		return;
	}
	$name = trsss_maybe_fix_utf8_mojibake($term->name);
	$new_slug = trsss_unicode_safe_slug($name);
	if ($new_slug === '') {
		// Fallback: use taxonomy + ID if name produces empty slug.
		$new_slug = $taxonomy . '-' . $term_id;
	}
	wp_update_term($term_id, $taxonomy, array('slug' => $new_slug));
	update_term_meta($term_id, '_rmss_slug_repaired', '1');
}

/**
 * When a term is saved, repair slug if it looks corrupted.
 */
function trsss_maybe_repair_term_slug_on_save($term_id)
{
	// Re-entrancy guard: wp_update_term() inside trsss_repair_term_slug_if_needed()
	// triggers edited_ again, causing an infinite loop. Bail if already running.
	static $running = array();
	if (isset($running[$term_id])) {
		return;
	}
	$running[$term_id] = true;

	$term = get_term($term_id);
	if ($term && is_object($term) && !is_wp_error($term)) {
		trsss_repair_term_slug_if_needed($term_id, $term->taxonomy);
	}

	unset($running[$term_id]);
}
// Re-enabled with re-entrancy guard: repair corrupted slugs when a term is saved/updated.
foreach (array('rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre', 'rmss_collection') as $_trsss_tax) {
	add_action("created_{$_trsss_tax}", 'trsss_maybe_repair_term_slug_on_save', 20, 1);
	add_action("edited_{$_trsss_tax}", 'trsss_maybe_repair_term_slug_on_save', 20, 1);
}
unset($_trsss_tax);

/**
 * Bulk-repair all corrupted slugs for ShelfSage taxonomies via admin action.
 * Usage: admin URL with action=trsss_repair_all_slugs and _wpnonce from wp_nonce_url( ..., 'trsss_repair_all_slugs' ).
 */
function trsss_bulk_repair_all_slugs()
{
	if (!current_user_can('manage_options')) {
		wp_die('Forbidden');
	}
	if (!isset($_GET['action']) || sanitize_key(wp_unslash($_GET['action'])) !== 'trsss_repair_all_slugs') {
		return;
	}
	if (!isset($_GET['_wpnonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_GET['_wpnonce'])), 'trsss_repair_all_slugs')) {
		wp_die(esc_html__('Invalid or missing security token for taxonomy slug repair.', 'shelfsage'), '', array('response' => 403));
	}
	// Covers ShelfSage custom taxonomies + WooCommerce built-in ones.
	$taxes = array('rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre', 'rmss_collection', 'product_tag', 'product_cat');
	$repaired = 0;
	$skipped = 0;
	foreach ($taxes as $taxonomy) {
		$terms = get_terms(array(
			'taxonomy' => $taxonomy,
			'hide_empty' => false,
			'number' => 0,
		));
		if (is_wp_error($terms) || !is_array($terms)) {
			continue;
		}
		foreach ($terms as $term) {
			if (!trsss_term_slug_looks_corrupted($term->slug)) {
				$skipped++;
				continue;
			}
			// Fix mojibake in name first.
			$name = trsss_maybe_fix_utf8_mojibake($term->name);
			$new_slug = trsss_unicode_safe_slug($name);
			if ($new_slug === '') {
				$new_slug = $taxonomy . '-' . $term->term_id;
			}
			// Make slug unique by appending term_id if needed.
			$existing = get_term_by('slug', $new_slug, $taxonomy);
			if ($existing && $existing->term_id !== $term->term_id) {
				$new_slug = $new_slug . '-' . $term->term_id;
			}
			// Clear the _rmss_slug_repaired flag so trsss_repair_term_slug_if_needed doesn't short-circuit.
			delete_term_meta($term->term_id, '_rmss_slug_repaired');
			wp_update_term($term->term_id, $taxonomy, array(
				'name' => $name,
				'slug' => $new_slug,
			));
			update_term_meta($term->term_id, '_rmss_slug_repaired', '1');
			$repaired++;
		}
	}
	wp_die(
		esc_html(sprintf('ShelfSage slug repair done. Repaired: %d, Already OK: %d.', $repaired, $skipped)),
		'ShelfSage Slug Repair',
		array('response' => 200, 'back_link' => true)
	);
}
add_action('admin_init', 'trsss_bulk_repair_all_slugs');

/* Slug repair on list load disabled — was causing infinite/slow load. Use Edit → Update per term to repair slug. */

/**
 * Single central fix: correct UTF-8 mojibake in the final HTML output (admin + frontend).
 * Replaces the need for per-element filters (terms, content, breadcrumb, etc.).
 *
 * @param string $buffer Full page HTML.
 * @return string Buffer with mojibake runs fixed.
 */
function trsss_output_buffer_fix_mojibake($buffer)
{
	if (!is_string($buffer) || $buffer === '') {
		return $buffer;
	}
	// Skip JSON / non-HTML
	$trimmed = trim($buffer);
	if ($trimmed !== '' && ($trimmed[0] === '{' || $trimmed[0] === '[')) {
		return $buffer;
	}
	// Skip if no likely mojibake (avoid unnecessary regex on clean pages)
	if (!preg_match('/à¦|à§|à[0-9²³]|À\s*À/', $buffer)) {
		return $buffer;
	}
	// Fix runs of Latin-1 supplement chars (mojibake); only replace when fix actually changes the string
	$fixed = preg_replace_callback(
		'/[\x{00A0}-\x{00FF}]+/u',
		function ($m) {
		$f = trsss_maybe_fix_utf8_mojibake($m[0]);
		return ($f !== $m[0]) ? $f : $m[0];
	},
		$buffer
	);
	return ($fixed !== null) ? $fixed : $buffer;
}

/**
 * Start output buffer early so we can fix mojibake in one place at the end.
 */
/* Output buffer disabled — was causing infinite/slow loading. Name/slug fixes still apply via get_term, get_terms, get_the_terms. */

/**
 * Add Image Field to Taxonomies (Author & Publisher)
 * Using WordPress Media Uploader
 */
function trsss_enqueue_media_uploader()
{

	if (!isset($GLOBALS['hook_suffix'])) {
		return;
	}

	$hook = $GLOBALS['hook_suffix'];
	if ($hook !== 'edit-tags.php' && $hook !== 'term.php') {
		return;
	}

	$screen = function_exists('get_current_screen') ? get_current_screen() : null;
	if (!$screen || empty($screen->taxonomy)) {
		return;
	}

	$allowed = array('rmss_author', 'rmss_publisher', 'rmss_series', 'rmss_genre');
	if (!in_array($screen->taxonomy, $allowed, true)) {
		return;
	}

	wp_enqueue_media();
	wp_enqueue_script('rmss-term-media', TRSSS_URL . 'includes/admin-term-media.js', array('jquery'), '1.0.0', true);
}
add_action('admin_enqueue_scripts', 'trsss_enqueue_media_uploader');

// 1. ADD FORM FIELDS (When creating a new term)
function trsss_add_term_image_field_add($taxonomy)
{
?>
    <div class="form-field term-group">
        <?php wp_nonce_field('rmss_term_image', 'rmss_term_image_nonce'); ?>
        <label for="rmss_term_image_id"><?php _e('Profile Image / Logo', 'shelfsage'); ?></label>
        <input type="hidden" id="rmss_term_image_id" name="rmss_term_image_id" value="">
        <div id="rmss_term_image_wrapper" style="margin-bottom:10px;"></div>
        <p>
            <input type="button" class="button button-secondary rmss_media_button" value="<?php _e('Add Image', 'shelfsage'); ?>" />
            <input type="button" class="button button-secondary rmss_media_remove" value="<?php _e('Remove Image', 'shelfsage'); ?>" style="display:none;" />
        </p>
    </div>
    <?php
}
add_action('rmss_author_add_form_fields', 'trsss_add_term_image_field_add', 10, 2);
add_action('rmss_publisher_add_form_fields', 'trsss_add_term_image_field_add', 10, 2);
add_action('rmss_series_add_form_fields', 'trsss_add_term_image_field_add', 10, 2);
add_action('rmss_genre_add_form_fields', 'trsss_add_term_image_field_add', 10, 2);

// 2. EDIT FORM FIELDS (When editing an existing term)
function trsss_edit_term_image_field($term, $taxonomy)
{
	$image_id = get_term_meta($term->term_id, 'rmss_image_id', true);
	$image_url = $image_id ? wp_get_attachment_image_url($image_id, 'medium') : '';
?>
    <tr class="form-field term-group-wrap">
        <th scope="row"><label for="rmss_term_image_id"><?php _e('Profile Image / Logo', 'shelfsage'); ?></label></th>
        <td>
            <?php wp_nonce_field('rmss_term_image', 'rmss_term_image_nonce'); ?>
            <input type="hidden" id="rmss_term_image_id" name="rmss_term_image_id" value="<?php echo esc_attr($image_id); ?>">
            <div id="rmss_term_image_wrapper">
                <?php if ($image_url): ?>
                    <img src="<?php echo esc_url($image_url); ?>" style="max-width:150px;border:1px solid #ccc;padding:2px;" />
                <?php
	endif; ?>
            </div>
            <p style="margin-top:10px;">
                <input type="button" class="button button-secondary rmss_media_button_edit" value="<?php _e('Add Image', 'shelfsage'); ?>" />
                <input type="button" class="button button-secondary rmss_media_remove_edit" value="<?php _e('Remove Image', 'shelfsage'); ?>" style="<?php echo $image_id ? '' : 'display:none;'; ?>" />
            </p>
        </td>
    </tr>
    <?php
}
add_action('rmss_author_edit_form_fields', 'trsss_edit_term_image_field', 10, 2);
add_action('rmss_publisher_edit_form_fields', 'trsss_edit_term_image_field', 10, 2);
add_action('rmss_series_edit_form_fields', 'trsss_edit_term_image_field', 10, 2);
add_action('rmss_genre_edit_form_fields', 'trsss_edit_term_image_field', 10, 2);

/**
 * Save Term Image ID
 */
function trsss_save_term_image($term_id)
{
	if (!isset($_POST['rmss_term_image_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['rmss_term_image_nonce'])), 'rmss_term_image')) {
		return;
	}
	$taxonomy = isset($_POST['taxonomy']) ? sanitize_key(wp_unslash($_POST['taxonomy'])) : '';
	if ($taxonomy && !current_user_can('edit_terms', $taxonomy)) {
		return;
	}
	if (isset($_POST['rmss_term_image_id'])) {
		update_term_meta($term_id, 'rmss_image_id', sanitize_text_field(wp_unslash($_POST['rmss_term_image_id'])));
	}
}
if (!function_exists('trsss_is_pro_active') || !trsss_is_pro_active()) {
	add_action('created_rmss_author', 'trsss_save_term_image', 10, 2);
	add_action('edited_rmss_author', 'trsss_save_term_image', 10, 2);
	add_action('created_rmss_publisher', 'trsss_save_term_image', 10, 2);
	add_action('edited_rmss_publisher', 'trsss_save_term_image', 10, 2);
	add_action('created_rmss_series', 'trsss_save_term_image', 10, 2);
	add_action('edited_rmss_series', 'trsss_save_term_image', 10, 2);
	add_action('created_rmss_genre', 'trsss_save_term_image', 10, 2);
	add_action('edited_rmss_genre', 'trsss_save_term_image', 10, 2);
}
