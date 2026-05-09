<?php
/**
 * Plugin Name: ShelfSage
 * Description: Complete WooCommerce bookstore toolkit — book taxonomies, shortcode builder, Vault, Look Inside, affiliate links, Amazon & Google APIs, and all layouts in one package.
 * Version: 1.5.1
 * Author: itsmanzur
 * Author URI: https://shelfsage.com
 * Text Domain: shelfsage
 * Domain Path: /languages
 * Requires at least: 5.8
 * Tested up to: 6.7
 * Requires PHP: 7.4
 * License: GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 *
 * @package ShelfSage
 */

if (!defined('ABSPATH')) {
    exit;
}

// Define plugin constants
define('TRSSS_VERSION', '1.5.1');
define('TRSSS_PATH', plugin_dir_path(__FILE__));
define('TRSSS_URL', plugin_dir_url(__FILE__));

require_once TRSSS_PATH . 'includes/functions-shelfsage-settings.php';
require_once TRSSS_PATH . 'includes/class-shelfsage-credential-store.php';
require_once TRSSS_PATH . 'includes/db-migrations.php';
// Skip heavy ALTER TABLE during normal requests — run manually when needed.
add_filter( 'trsss_skip_postmeta_isbn_index', '__return_true' );

/**
 * Load Plugin Text Domain
 */
function trsss_load_textdomain() {
    load_plugin_textdomain( 'shelfsage', false, dirname( plugin_basename( __FILE__ ) ) . '/languages' );
}
add_action( 'plugins_loaded', 'trsss_load_textdomain' );

/**
 * Whether all premium-style features are available (single marketplace build).
 *
 * @return bool
 */
function trsss_is_pro() {
    /** @var bool $enabled Filter default — single-bundle build enables all capabilities. */
    return (bool) apply_filters( 'trsss_is_pro', true );
}

/**
 * Whether the legacy separate add-on plugin was handling extended features (not used in this build).
 * This build ships everything in one plugin, so taxonomy UI uses the bundled extended handlers only.
 *
 * @return bool
 */
function trsss_is_pro_active() {
    /** @var bool $enabled Filter default — extended handlers bundled in this package. */
    return (bool) apply_filters( 'trsss_is_pro_active', true );
}

// Include taxonomy registration
require_once TRSSS_PATH . 'includes/taxonomies.php';

// Include meta boxes
require_once TRSSS_PATH . 'includes/meta-boxes.php';

// Include custom API endpoints
require_once TRSSS_PATH . 'includes/api.php';

// Include frontend assets
require_once TRSSS_PATH . 'includes/frontend.php';
require_once TRSSS_PATH . 'includes/book-reviews.php';
require_once TRSSS_PATH . 'includes/analytics.php';
require_once TRSSS_PATH . 'includes/series-reading-order.php';
require_once TRSSS_PATH . 'includes/author-profiles.php';
require_once TRSSS_PATH . 'includes/audio-preview.php';
require_once TRSSS_PATH . 'includes/seo-schema.php';

// Section 4 quick wins — copy ISBN + social share on single product
require_once TRSSS_PATH . 'includes/product-quick-wins.php';

// Include admin menu
require_once TRSSS_PATH . 'includes/admin-menu.php';

// Include settings
require_once TRSSS_PATH . 'includes/settings.php';

// Google Books API (secure server-side fetch)
require_once TRSSS_PATH . 'includes/class-google-books-api.php';
new TRSSS_Google_Books_API();

// Include dynamic Gutenberg blocks
require_once TRSSS_PATH . 'includes/blocks.php';

// Elementor widget (only when Elementor is active)
add_action('elementor/widgets/register', function ($widgets_manager) {
	if (!class_exists('\Elementor\Widget_Base')) {
		return;
	}
	try {
		require_once TRSSS_PATH . 'includes/class-elementor-widget.php';
		if (class_exists('ShelfSage_Elementor_Widget')) {
			$widgets_manager->register(new ShelfSage_Elementor_Widget());
		}
	} catch (Throwable $e) {
		if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
			error_log('[ShelfSage] Elementor widget registration failed: ' . $e->getMessage());
		}
	}
});
function trsss_activate()
{
    add_option('trsss_do_activation_redirect', true);
}
register_activation_hook(__FILE__, 'trsss_activate');

add_action('admin_init', 'trsss_redirect_welcome');
function trsss_redirect_welcome()
{
    if (get_option('trsss_do_activation_redirect', false)) {
        delete_option('trsss_do_activation_redirect');
        // Skip redirect when activating multiple plugins at once (bulk activate)
        if (!filter_has_var(INPUT_GET, 'activate-multi')) {
            wp_safe_redirect(admin_url('admin.php?page=shelfsage-welcome'));
            exit;
        }
    }
}

/**
 * Template loader for ShelfSage taxonomies and single product (book) layout.
 * Chooses theme override, plugin taxonomy template, or plugin single-product template when applicable.
 *
 * @param string $template Current template path.
 * @return string Template path to load.
 */
function trsss_template_loader($template)
{
    $taxonomies = array('rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre');

    if (is_tax($taxonomies)) {
        $term = get_queried_object();
        $taxonomy = $term->taxonomy;

        // Priority: 
        // 1. Theme override (e.g. taxonomy-rmss_author.php in theme folder)
        $theme_template = locate_template(array("taxonomy-{$taxonomy}.php"));
        if ($theme_template) {
            return $theme_template; // Let theme handle it if specific template exists
        }

        // 2. Plugin specific template (if it existed)
        // 3. Plugin generic template (our fallback design)
        $plugin_template = TRSSS_PATH . 'templates/taxonomy-rmss_generic.php';

        if (file_exists($plugin_template)) {
            return $plugin_template;
        }
    }

    // Override Single Product Template for Books
    if (is_singular('product')) {
        if ( ! trsss_is_woocommerce_available() ) {
            return $template;
        }

        $obj_id = get_queried_object_id();

        // Fallback: some themes/FSE setups return 0 from get_queried_object_id() during template_include
        if (!$obj_id) {
            global $post;
            $obj_id = isset($post->ID) ? $post->ID : 0;
        }

        if (!$obj_id) {
            return $template;
        }

        $settings = trsss_get_shelfsage_settings_array();

        // Use filter_var to correctly handle stored values like "1", "0", "true", "false", ""
        $enable_custom_template = isset($settings['enable_custom_template'])
            ? filter_var($settings['enable_custom_template'], FILTER_VALIDATE_BOOLEAN)
            : true;

        if (!$enable_custom_template) {
            return $template;
        }


        // Check if we should apply template to all products, or only ShelfSage-tagged books
        $apply_setting = isset($settings['apply_to_all_products']) ? $settings['apply_to_all_products'] : true;
        $apply_to_all = filter_var($apply_setting, FILTER_VALIDATE_BOOLEAN);

        if (!$apply_to_all) {
            // Only apply template if product has at least one ShelfSage taxonomy term
            $is_book = has_term('', 'rmss_author', $obj_id)
                || has_term('', 'rmss_genre', $obj_id)
                || has_term('', 'rmss_publisher', $obj_id)
                || has_term('', 'rmss_series', $obj_id)
                || has_term('', 'rmss_translator', $obj_id);

            if (!$is_book) {
                return $template;
            }
        }

        $layout = isset($settings['single_product_layout']) && !empty($settings['single_product_layout'])
            ? sanitize_key($settings['single_product_layout'])
            : 'style-1';

        // 'classic' maps to the original single-product-shelfsage.php template
        if ($layout === 'classic') {
            $plugin_template = TRSSS_PATH . 'templates/single-product-shelfsage.php';
        } else {
            $plugin_template = TRSSS_PATH . 'templates/single-product-shelfsage-' . $layout . '.php';
        }

        // Fallback to style-1 if specific template is missing
        if (!file_exists($plugin_template)) {
            $plugin_template = TRSSS_PATH . 'templates/single-product-shelfsage-style-1.php';
        }
        // Fallback to old-name template if style-1 also missing
        if (!file_exists($plugin_template)) {
            $plugin_template = TRSSS_PATH . 'templates/single-product-shelfsage.php';
        }

        if (file_exists($plugin_template)) {
            return $plugin_template;
        }
    }

    return $template;
}
add_filter('template_include', 'trsss_template_loader', 9999); // Very High priority

/**
 * Bulletproof fallback for Bengali/Unicode product slugs.
 *
 * WordPress's WP_Query cannot reliably route non-ASCII slugs because
 * sanitize_title_for_query() URL-encodes them before the SQL comparison,
 * while the database stores them as raw Unicode.
 *
 * If WordPress resolves to a 404 on a /product/{slug}/ URL, we:
 *   1. Extract the slug from REQUEST_URI and decode it.
 *   2. Do a direct database lookup by the decoded slug.
 *   3. Re-populate $wp_query so the rest of WP treats it as a singular product.
 */
add_action( 'template_redirect', 'trsss_unicode_product_fallback', 1 );
function trsss_unicode_product_fallback() {
	if ( ! is_404() ) {
		return;
	}

	$path = trim( parse_url( $_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH ), '/' );

	// Only act on /product/{slug}[/] URLs
	if ( ! preg_match( '#^product/([^/]+)/?$#', $path, $m ) ) {
		return;
	}

	$slug = rawurldecode( $m[1] );
	if ( empty( $slug ) ) {
		return;
	}

	global $wpdb;
	$id = (int) $wpdb->get_var(
		$wpdb->prepare(
			"SELECT ID FROM {$wpdb->posts} WHERE post_name = %s AND post_type = 'product' AND post_status = 'publish' LIMIT 1",
			$slug
		)
	);

	if ( ! $id ) {
		return;
	}

	// Re-wire the global WP_Query so the rest of WP sees a found singular product
	global $wp_query;
	$post                          = get_post( $id );
	$wp_query->posts               = array( $post );
	$wp_query->post_count          = 1;
	$wp_query->found_posts         = 1;
	$wp_query->is_404              = false;
	$wp_query->is_single           = true;
	$wp_query->is_singular         = true;
	$wp_query->post                = $post;
	$wp_query->queried_object      = $post;
	$wp_query->queried_object_id   = $id;
	$GLOBALS['post']               = $post;
	status_header( 200 );
	setup_postdata( $post );
}

/**
 * Fix: WordPress's sanitize_title_for_query() URL-encodes Bengali/Unicode slugs
 * (e.g. 'চোখের-হেফাজত' → '%e0%a6%9a...'), but the database stores them as
 * raw Unicode. This causes WP_Query to find nothing → 404 on all Bengali product pages.
 *
 * Step 1: Decode URL-encoded product slug in request vars (before WP_Query runs).
 */
add_filter( 'request', 'trsss_decode_unicode_product_request', 1 );
function trsss_decode_unicode_product_request( $qv ) {
	$keys = array();

	if ( ! empty( $qv['product'] ) ) {
		$keys[] = 'product';
	}

	if ( ! empty( $qv['post_type'] ) && 'product' === $qv['post_type'] && ! empty( $qv['name'] ) ) {
		$keys[] = 'name';
	}

	foreach ( $keys as $key ) {
		if ( ! empty( $qv[ $key ] ) && is_string( $qv[ $key ] ) && strpos( $qv[ $key ], '%' ) !== false ) {
			$decoded = rawurldecode( $qv[ $key ] );
			if ( $decoded !== $qv[ $key ] ) {
				$qv[ $key ] = $decoded;
			}
		}
	}
	return $qv;
}

/**
 * Step 2: By the time posts_where fires, parse_query() has already called
 * sanitize_title_for_query() which URL-encodes the Unicode slug to '%e0%a6%9a...'.
 * The WHERE clause therefore contains the URL-encoded form, which MySQL cannot
 * match against the Unicode slug stored in post_name.
 * We detect the encoded form and replace it with the decoded Unicode slug.
 */
add_filter( 'posts_where', 'trsss_fix_unicode_slug_sql', 1, 2 );
function trsss_fix_unicode_slug_sql( $where, $query ) {
	global $wpdb;

	if ( ! $query instanceof WP_Query || ! $query->is_main_query() ) {
		return $where;
	}

	$post_type = $query->get( 'post_type' );
	if ( ! in_array( $post_type, array( 'product', array( 'product' ) ), true ) && ! $query->get( 'product' ) ) {
		return $where;
	}

	// Get the slug from query vars — at this point it's already URL-encoded (e.g. '%e0%a6%9a...')
	$encoded_name = '';
	foreach ( array( 'product', 'name' ) as $key ) {
		if ( ! empty( $query->query_vars[ $key ] ) ) {
			$encoded_name = $query->query_vars[ $key ];
			break;
		}
	}

	// Only act when the slug looks URL-encoded (contains %xx sequences with hex digits)
	if ( empty( $encoded_name ) || ! preg_match( '/%[0-9a-fA-F]{2}/', $encoded_name ) ) {
		return $where;
	}

	// Decode once: '%e0%a6%9a...' → 'চোখের-হেফাজত'
	$decoded = rawurldecode( $encoded_name );

	if ( $decoded === $encoded_name ) {
		return $where; // Nothing changed — no real encoding
	}

	// Replace the URL-encoded form in the WHERE clause with the Unicode form
	$unicode_sql = esc_sql( $decoded );

	foreach ( array(
		"{$wpdb->posts}.post_name = '" . $encoded_name . "'",
		"post_name = '" . $encoded_name . "'",
	) as $search ) {
		$replace = str_replace( $encoded_name, $unicode_sql, $search );
		if ( strpos( $where, $search ) !== false ) {
			$where = str_replace( $search, $replace, $where );
		}
	}

	return $where;
}

/**
 * ============================================================
 * UNICODE / MOJIBAKE FIXES FOR PRODUCTS
 * ============================================================
 */

/**
 * Fix garbled product slugs when saving/updating a WooCommerce product.
 * WordPress's sanitize_title() strips Bengali/Arabic Unicode chars, producing gibberish.
 * We generate a Unicode-safe slug from the post title instead.
 *
 * @param array $data    Slashed post data about to be saved.
 * @param array $postarr Raw POST data.
 * @return array Modified post data.
 */function trsss_fix_product_slug_unicode( $data, $postarr ) {
	// Only for products with a Unicode title.
	if ( $data['post_type'] !== 'product' || empty( $data['post_title'] ) ) {
		return $data;
	}
	$title = wp_strip_all_tags( $data['post_title'] );
	if ( ! preg_match( '/[^\x00-\x7F]/', $title ) ) {
		return $data; // Pure ASCII title — let WordPress handle normally.
	}
	if ( ! function_exists( 'trsss_unicode_safe_slug' ) ) {
		return $data;
	}

	$current_slug  = isset( $data['post_name'] ) ? $data['post_name'] : '';
	$is_auto_draft = ( strpos( $current_slug, 'auto-draft' ) !== false );
	$is_garbled    = trsss_slug_is_garbled( $current_slug );
	$is_empty      = ( $current_slug === '' );

	// If user manually typed a clean ASCII slug in the Permalink field, respect it.
	$user_custom_slug = isset( $postarr['post_name'] ) ? $postarr['post_name'] : '';
	$user_set_clean   = ( $user_custom_slug !== '' && ! preg_match( '/[^\x00-\x7F]/', $user_custom_slug )
		&& ! trsss_slug_is_garbled( $user_custom_slug ) && strpos( $user_custom_slug, 'auto-draft' ) === false );

	if ( $user_set_clean ) {
		return $data; // Honour the user's manual ASCII slug.
	}

	if ( $is_empty || $is_auto_draft || $is_garbled || $current_slug !== '' ) {
		$new_slug = trsss_unicode_safe_slug( $title );
		if ( $new_slug !== '' ) {
			// Store in global — sanitize_post() will destroy post_name,
			// so we retrieve it in wp_unique_post_slug filter below.
			$GLOBALS['trsss_pending_unicode_slug'] = $new_slug;
		}
	}
	return $data;
}
add_filter( 'wp_insert_post_data', 'trsss_fix_product_slug_unicode', 5, 2 );

/**
 * Apply the Unicode slug AFTER WordPress's sanitize_post() has run.
 * wp_unique_post_slug fires right before the slug is written to the database.
 * This is where we restore the Unicode slug we stored in the global above.
 *
 * @param string $slug         The (sanitized/broken) proposed slug.
 * @param int    $post_ID      Post ID.
 * @param string $post_status  Post status.
 * @param string $post_type    Post type.
 * @param int    $post_parent  Parent post ID.
 * @param string $original_slug Original slug before uniqueness check.
 * @return string Unicode-safe slug.
 */
function trsss_apply_pending_unicode_slug( $slug, $post_ID, $post_status, $post_type, $post_parent, $original_slug ) {
	if ( $post_type !== 'product' || empty( $GLOBALS['trsss_pending_unicode_slug'] ) ) {
		return $slug;
	}
	$unicode_slug = $GLOBALS['trsss_pending_unicode_slug'];
	unset( $GLOBALS['trsss_pending_unicode_slug'] );
	return $unicode_slug;
}
add_filter( 'wp_unique_post_slug', 'trsss_apply_pending_unicode_slug', 5, 6 );

/**
 * Detect a garbled (percent-encoded or mojibake) slug.
 *
 * @param string $slug
 * @return bool
 */
function trsss_slug_is_garbled( $slug ) {
	if ( strpos( $slug, '%' ) !== false ) {
		return true;
	}
	// Latin-1 supplement chars embedded in slug = double-encoded UTF-8
	if ( preg_match( '/[\x{00A0}-\x{00FF}]/u', $slug ) ) {
		return true;
	}
	return false;
}

/**
 * Fix mojibake in post/product content on the FRONTEND (the_content filter).
 * Only processes content that contains the Latin-1 mojibake signature.
 *
 * @param string $content Post content HTML.
 * @return string Fixed content.
 */
function trsss_fix_product_content_mojibake( $content ) {
	if ( ! is_string( $content ) || $content === '' ) {
		return $content;
	}
	if ( ! trsss_should_fix_mojibake_for_current_request( get_the_ID() ) ) {
		return $content;
	}
	// Quick bail: only act when mojibake signature present.
	if ( strpos( $content, 'à¦' ) === false && strpos( $content, 'à§' ) === false && strpos( $content, 'Ø' ) === false ) {
		return $content;
	}
	if ( ! function_exists( 'trsss_maybe_fix_utf8_mojibake' ) ) {
		return $content;
	}
	// Fix runs of Latin-1 supplement chars in text nodes only (avoid breaking HTML tags).
	$fixed = preg_replace_callback(
		'/[\x{00A0}-\x{00FF}]+/u',
		function ( $m ) {
			$f = trsss_maybe_fix_utf8_mojibake( $m[0] );
			return ( $f !== $m[0] ) ? $f : $m[0];
		},
		$content
	);
	return ( $fixed !== null ) ? $fixed : $content;
}
// Elementor editor context-এ mojibake filters skip করো
$trsss_el_editor_action = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : '';
if ( ! is_admin() && ( ! defined( 'ELEMENTOR_VERSION' ) || $trsss_el_editor_action !== 'elementor' ) ) {
	add_filter( 'the_content', 'trsss_fix_product_content_mojibake', 1 );
}
unset( $trsss_el_editor_action );

/**
 * Whether display-time mojibake repair should run for the current object.
 *
 * @param int $post_id Current post ID.
 * @return bool
 */
function trsss_should_fix_mojibake_for_current_request( $post_id = 0 ) {
	if ( is_admin() || wp_doing_ajax() || wp_is_json_request() || is_feed() ) {
		return false;
	}

	$post_id = (int) $post_id;
	if ( $post_id && 'product' === get_post_type( $post_id ) ) {
		return true;
	}

	if ( function_exists( 'is_tax' ) && is_tax( array( 'rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre', 'rmss_collection' ) ) ) {
		return true;
	}

	return (bool) apply_filters( 'trsss_should_fix_display_mojibake', false, $post_id );
}

/**
 * Also fix product title display (the_title filter) on frontend.
 *
 * @param string $title Post title.
 * @param int    $id    Post ID.
 * @return string Fixed title.
 */
function trsss_fix_product_title_mojibake( $title, $id = 0 ) {
	if ( ! is_string( $title ) || $title === '' ) {
		return $title;
	}
	if ( ! trsss_should_fix_mojibake_for_current_request( $id ) ) {
		return $title;
	}
	if ( strpos( $title, 'à¦' ) === false && strpos( $title, 'à§' ) === false && ! preg_match( '/[\x{00A0}-\x{00FF}]/u', $title ) ) {
		return $title;
	}
	if ( ! function_exists( 'trsss_maybe_fix_utf8_mojibake' ) ) {
		return $title;
	}
	return trsss_maybe_fix_utf8_mojibake( $title );
}
// Elementor editor context-এ title mojibake filter skip করো
$trsss_el_editor_action_title = isset( $_GET['action'] ) ? sanitize_key( wp_unslash( $_GET['action'] ) ) : '';
if ( ! is_admin() && ( ! defined( 'ELEMENTOR_VERSION' ) || $trsss_el_editor_action_title !== 'elementor' ) ) {
	add_filter( 'the_title', 'trsss_fix_product_title_mojibake', 1, 2 );
}
unset( $trsss_el_editor_action_title );

/**
 * Bulk repair corrupted product slugs and titles via admin action.
 * Visit: /wp-admin/?action=trsss_repair_product_slugs&_wpnonce=...
 */
function trsss_bulk_repair_product_slugs() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( ! isset( $_GET['action'] ) || sanitize_key( wp_unslash( $_GET['action'] ) ) !== 'trsss_repair_product_slugs' ) {
		return;
	}
	if ( ! isset( $_GET['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_GET['_wpnonce'] ) ), 'trsss_repair_product_slugs' ) ) {
		wp_die( esc_html__( 'Invalid or missing security token for product slug repair.', 'shelfsage' ), '', array( 'response' => 403 ) );
	}
	if ( ! function_exists( 'trsss_unicode_safe_slug' ) || ! function_exists( 'trsss_maybe_fix_utf8_mojibake' ) ) {
		wp_die( 'ShelfSage functions not ready. Make sure the plugin is fully loaded.' );
	}
	$repaired = 0;
	$skipped  = 0;
	$paged    = 1;
	while ( true ) {
		$products = get_posts( array(
			'post_type'      => 'product',
			'posts_per_page' => 50,
			'paged'          => $paged,
			'post_status'    => array( 'publish', 'draft', 'pending', 'private' ),
			'fields'         => 'all',
		) );
		if ( empty( $products ) ) {
			break;
		}
		foreach ( $products as $product ) {
			$needs_repair = false;
			$new_slug  = $product->post_name;
			$new_title = $product->post_title;
			// Fix slug if garbled (or was improperly auto-generated).
			if ( trsss_slug_is_garbled( $product->post_name ) || $product->post_name === sanitize_title( wp_strip_all_tags( $product->post_title ) ) ) {
				$fixed_title = trsss_maybe_fix_utf8_mojibake( $product->post_title );
				// Only if title has unicode characters.
				if ( preg_match( '/[^\x00-\x7F]/', $fixed_title ) ) {
					$new_slug = trsss_unicode_safe_slug( $fixed_title );
					if ( $new_slug === '' ) {
						$new_slug = 'product-' . $product->ID;
					}
					// Only repair if it actually yields a different, valid slug.
					if ( $new_slug !== '' && $new_slug !== $product->post_name ) {
						$needs_repair = true;
					}
				}
			}
			// Fix title if mojibake.
			$fixed_title = trsss_maybe_fix_utf8_mojibake( $product->post_title );
			if ( $fixed_title !== $product->post_title ) {
				$new_title    = $fixed_title;
				$needs_repair = true;
			}
			if ( $needs_repair ) {
				// Tell our wp_unique_post_slug filter to use this exact slug during update.
				$GLOBALS['trsss_pending_unicode_slug'] = $new_slug;
				wp_update_post( array(
					'ID'         => $product->ID,
					'post_name'  => $new_slug,
					'post_title' => $new_title,
				) );
				$repaired++;
			} else {
				$skipped++;
			}
		}
		$paged++;
	}
	wp_die(
		esc_html( sprintf( 'ShelfSage product repair done. Repaired: %d, Already OK: %d. Rewrite rules flushed.', $repaired, $skipped ) ),
		'ShelfSage Product Repair',
		array( 'response' => 200, 'back_link' => true )
	);
}
add_action( 'admin_init', 'trsss_bulk_repair_product_slugs' );

// ============================================================
// Extended UI (taxonomy media, affiliate tab, etc.) — same plugin package
// ============================================================
require_once TRSSS_PATH . 'includes/class-shelfsage-extended-features.php';
require_once TRSSS_PATH . 'includes/vault.php';

$_trsss_google_books_enhanced = TRSSS_PATH . 'includes/class-google-books-enhanced.php';
if ( file_exists( $_trsss_google_books_enhanced ) ) {
	require_once $_trsss_google_books_enhanced;
	if ( class_exists( 'TRSSS_Google_Books_Enhanced' ) ) {
		new TRSSS_Google_Books_Enhanced();
	}
}
