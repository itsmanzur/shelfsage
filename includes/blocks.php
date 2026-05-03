<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Register ShelfSage Dynamic Blocks
 */
function trsss_register_blocks()
{
	if (!function_exists('register_block_type')) {
		return;
	}

	$blocks = array(
		'author' => 'trsss_render_author_block',
		'publisher' => 'trsss_render_publisher_block',
		'translator' => 'trsss_render_translator_block',
		'series' => 'trsss_render_series_block',
		'genre' => 'trsss_render_genre_block',
		'books' => 'trsss_render_books_block',
	);

	foreach ($blocks as $block_name => $render_callback) {
		register_block_type(TRSSS_PATH . 'build/blocks/' . $block_name, array(
			'render_callback' => $render_callback,
		));
	}
}
add_action('init', 'trsss_register_blocks');

/**
 * Generic Render helper for Taxonomy Blocks
 */
function trsss_render_generic_taxonomy_block($attributes, $taxonomy, $param_key, $css_prefix, $badge_label, $placeholder_icon)
{
	$term_id = isset($attributes[$param_key]) ? absint($attributes[$param_key]) : 0;

	if (!$term_id) {
		return '';
	}

	$term = get_term($term_id, $taxonomy);

	if (!$term || is_wp_error($term)) {
		return '';
	}

	$align = isset($attributes['align']) ? esc_attr($attributes['align']) : 'center';
	$align_class = $align ? "align{$align}" : '';

	// Get Image (if applicable)
	$image_id = get_term_meta($term_id, 'rmss_image_id', true);
	$image_url = $image_id ? wp_get_attachment_image_url($image_id, 'thumbnail') : '';

	$term_link = get_term_link($term);

	ob_start();
?>
	<div class="shelfsage-block shelfsage-block-<?php echo esc_attr($css_prefix); ?> <?php echo esc_attr($align_class); ?> wp-block-shelfsage-<?php echo esc_attr($css_prefix); ?>">
		<div class="ss-<?php echo esc_attr($css_prefix); ?>-card">
			<?php if ($image_url): ?>
				<div class="ss-<?php echo esc_attr($css_prefix); ?>-avatar">
					<a href="<?php echo esc_url($term_link); ?>">
						<img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($term->name); ?>" loading="lazy" />
					</a>
				</div>
			<?php
	else: ?>
				<div class="ss-<?php echo esc_attr($css_prefix); ?>-avatar ss-avatar-placeholder">
					<?php echo wp_kses_post($placeholder_icon); ?>
				</div>
			<?php
	endif; ?>
			
			<div class="ss-<?php echo esc_attr($css_prefix); ?>-info">
				<div class="ss-<?php echo esc_attr($css_prefix); ?>-badge"><?php echo esc_html($badge_label); ?></div>
				<h3 class="ss-<?php echo esc_attr($css_prefix); ?>-name">
					<a href="<?php echo esc_url($term_link); ?>"><?php echo esc_html($term->name); ?></a>
				</h3>
				<?php if (!empty($term->description)): ?>
					<div class="ss-<?php echo esc_attr($css_prefix); ?>-bio">
						<?php echo wp_kses_post(wpautop($term->description)); ?>
					</div>
				<?php
	endif; ?>
				<div class="ss-<?php echo esc_attr($css_prefix); ?>-link">
					<a href="<?php echo esc_url($term_link); ?>"><?php esc_html_e('View Library &rarr;', 'shelfsage'); ?></a>
				</div>
			</div>
		</div>
	</div>
	<?php
	return ob_get_clean();
}

/**
 * Render Callbacks for specific blocks
 */
function trsss_render_author_block($attributes, $content)
{
	$icon = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
	return trsss_render_generic_taxonomy_block($attributes, 'rmss_author', 'authorId', 'author', __('Book Author', 'shelfsage'), $icon);
}

function trsss_render_publisher_block($attributes, $content)
{
	$icon = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"></path></svg>';
	return trsss_render_generic_taxonomy_block($attributes, 'rmss_publisher', 'publisherId', 'publisher', __('Book Publisher', 'shelfsage'), $icon);
}

function trsss_render_translator_block($attributes, $content)
{
	$icon = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6"></path></svg>';
	return trsss_render_generic_taxonomy_block($attributes, 'rmss_translator', 'translatorId', 'translator', __('Book Translator', 'shelfsage'), $icon);
}

function trsss_render_series_block($attributes, $content)
{
	$icon = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>';
	return trsss_render_generic_taxonomy_block($attributes, 'rmss_series', 'seriesId', 'series', __('Book Series', 'shelfsage'), $icon);
}

function trsss_render_genre_block($attributes, $content)
{
	$icon = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>';
	return trsss_render_generic_taxonomy_block($attributes, 'rmss_genre', 'genreId', 'genre', __('Book Genre', 'shelfsage'), $icon);
}

/**
 * ShelfSage Books Block – renders [trs_shelfsage id=X]
 */
function trsss_render_books_block($attributes, $content)
{
	$shortcode_id = isset($attributes['shortcodeId']) ? absint($attributes['shortcodeId']) : 0;
	if (!$shortcode_id && isset($attributes['shortcode_id'])) {
		$shortcode_id = absint($attributes['shortcode_id']);
	}
	if (!$shortcode_id) {
		return '';
	}
	$out = trsss_render_books_shortcode(array('id' => (string) $shortcode_id));
	return $out ? $out : '';
}
