<?php
/**
 * Book Condition Badge.
 *
 * Renders a colour-coded "Used – Good Condition" style badge on book product
 * pages so second-hand bookstores (a huge market in South Asia and on
 * Marketplace / OLX-style channels) can transparently surface book condition
 * to buyers.
 *
 * Data source:  product meta `_rmss_condition`
 *               (set under Product → Book Details → Book Condition)
 *
 * Allowed values:
 *   ''           -> badge hidden (default for new-only retail stores)
 *   'new'        -> green   "New"
 *   'like_new'   -> teal    "Used – Like New"
 *   'good'       -> blue    "Used – Good Condition"
 *   'acceptable' -> amber   "Used – Acceptable"
 *   'poor'       -> red     "Used – Poor"
 *
 * Where it appears:
 *   - Auto-injected via `woocommerce_single_product_summary` priority 8
 *     (between title at 5 and rating/price at 10) on stock WooCommerce
 *     templates.
 *   - Embedded in all six ShelfSage single-product templates next to the
 *     pre-order countdown call.
 *   - On any page or post via [shelfsage_book_condition id="123"].
 *
 * Filters:
 *   trsss_book_condition_labels         (array $slug => $label)
 *   trsss_book_condition_colors         (array $slug => ['bg','fg','border'])
 *   trsss_auto_inject_book_condition    (bool  $allow, $product_id)
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Public, translated label for each condition slug.
 *
 * @return array<string,string>
 */
function trsss_get_book_condition_labels() {
	return apply_filters(
		'trsss_book_condition_labels',
		array(
			'new'        => __( 'New', 'shelfsage' ),
			'like_new'   => __( 'Used – Like New', 'shelfsage' ),
			'good'       => __( 'Used – Good Condition', 'shelfsage' ),
			'acceptable' => __( 'Used – Acceptable', 'shelfsage' ),
			'poor'       => __( 'Used – Poor', 'shelfsage' ),
		)
	);
}

/**
 * Background / foreground / border colours for each condition.
 *
 * @return array<string,array{bg:string,fg:string,border:string}>
 */
function trsss_get_book_condition_color_map() {
	return apply_filters(
		'trsss_book_condition_colors',
		array(
			'new'        => array( 'bg' => '#dcfce7', 'fg' => '#166534', 'border' => '#86efac' ),
			'like_new'   => array( 'bg' => '#cffafe', 'fg' => '#155e75', 'border' => '#67e8f9' ),
			'good'       => array( 'bg' => '#dbeafe', 'fg' => '#1e40af', 'border' => '#93c5fd' ),
			'acceptable' => array( 'bg' => '#fef3c7', 'fg' => '#92400e', 'border' => '#fcd34d' ),
			'poor'       => array( 'bg' => '#fee2e2', 'fg' => '#991b1b', 'border' => '#fca5a5' ),
		)
	);
}

/**
 * Read and normalise the stored condition value.
 *
 * Accepts legacy free-text values like "Used - Good", "Like New" or
 * "Acceptable" and folds them into the canonical slug list.
 *
 * @param int $product_id Product ID.
 * @return string Canonical condition slug, or '' when no badge should render.
 */
function trsss_get_book_condition_slug( $product_id ) {
	$raw = trim( (string) get_post_meta( absint( $product_id ), '_rmss_condition', true ) );
	if ( '' === $raw ) {
		return '';
	}

	$slug = strtolower( $raw );
	$slug = preg_replace( '/[\s\-]+/', '_', $slug );
	$slug = preg_replace( '/^used_+/', '', (string) $slug );

	$valid = array_keys( trsss_get_book_condition_labels() );
	return in_array( $slug, $valid, true ) ? $slug : '';
}

/**
 * Render the badge.
 *
 * @param int   $product_id Product ID.
 * @param array $args       Optional. 'class' and 'icon' (bool).
 * @return void
 */
function trsss_render_book_condition_badge( $product_id, $args = array() ) {
	static $rendered_for = array();

	$product_id = absint( $product_id );
	if ( ! $product_id || isset( $rendered_for[ $product_id ] ) ) {
		return;
	}

	$slug = trsss_get_book_condition_slug( $product_id );
	if ( '' === $slug ) {
		return;
	}

	$labels = trsss_get_book_condition_labels();
	$colors = trsss_get_book_condition_color_map();
	if ( ! isset( $labels[ $slug ], $colors[ $slug ] ) ) {
		return;
	}

	$rendered_for[ $product_id ] = true;

	$args = wp_parse_args(
		$args,
		array(
			'class' => '',
			'icon'  => true,
		)
	);

	static $css_printed = false;
	if ( ! $css_printed ) {
		$css_printed = true;
		echo '<style id="trsss-book-condition-css">.trsss-book-condition{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;font-size:12px;font-weight:700;border-radius:999px;letter-spacing:.02em;border:1px solid;line-height:1.4;vertical-align:middle;font-family:inherit}.trsss-book-condition svg{width:14px;height:14px;flex-shrink:0}</style>';
	}

	$icon_svg = $args['icon']
		? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>'
		: '';

	$style = sprintf(
		'background:%s;color:%s;border-color:%s',
		$colors[ $slug ]['bg'],
		$colors[ $slug ]['fg'],
		$colors[ $slug ]['border']
	);

	printf(
		'<span class="trsss-book-condition %1$s" style="%2$s">%3$s%4$s</span>',
		esc_attr( $args['class'] ),
		esc_attr( $style ),
		$icon_svg, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG markup.
		esc_html( $labels[ $slug ] )
	);
}

/**
 * Auto-inject the badge on stock WooCommerce single-product templates.
 *
 * Position 8 = after title (5), before rating / price (10).
 *
 * Filter to disable per product:
 *   add_filter( 'trsss_auto_inject_book_condition', '__return_false' );
 *
 * @return void
 */
function trsss_auto_inject_book_condition_summary() {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}

	$product_id = (int) get_the_ID();
	if ( ! $product_id ) {
		return;
	}

	if ( '' === trsss_get_book_condition_slug( $product_id ) ) {
		return;
	}

	if ( ! apply_filters( 'trsss_auto_inject_book_condition', true, $product_id ) ) {
		return;
	}

	echo '<div class="trsss-book-condition-wrapper" style="margin:8px 0 4px;">';
	trsss_render_book_condition_badge( $product_id );
	echo '</div>';
}
add_action( 'woocommerce_single_product_summary', 'trsss_auto_inject_book_condition_summary', 8 );

/**
 * Shortcode: [shelfsage_book_condition id="123" class="..."]
 *
 * @param array $atts Shortcode attributes.
 * @return string Badge HTML or empty string.
 */
function trsss_book_condition_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'id'    => 0,
			'class' => '',
		),
		$atts,
		'shelfsage_book_condition'
	);

	$product_id = absint( $atts['id'] );
	if ( ! $product_id ) {
		$product_id = (int) get_the_ID();
	}
	if ( ! $product_id ) {
		return '';
	}

	$args = array();
	if ( '' !== $atts['class'] ) {
		$args['class'] = sanitize_html_class( $atts['class'] );
	}

	ob_start();
	trsss_render_book_condition_badge( $product_id, $args );
	return (string) ob_get_clean();
}
add_shortcode( 'shelfsage_book_condition', 'trsss_book_condition_shortcode' );

/**
 * Add Book Condition to the Book schema.
 *
 * Maps internal slug -> schema.org BookCondition values:
 *   https://schema.org/OfferItemCondition
 *
 * @param array $schema Existing schema array.
 * @param int   $product_id Product ID.
 * @return array
 */
function trsss_book_condition_schema_filter( $schema, $product_id ) {
	$slug = trsss_get_book_condition_slug( (int) $product_id );
	if ( '' === $slug || ! is_array( $schema ) ) {
		return $schema;
	}

	$schema_map = array(
		'new'        => 'https://schema.org/NewCondition',
		'like_new'   => 'https://schema.org/UsedCondition',
		'good'       => 'https://schema.org/UsedCondition',
		'acceptable' => 'https://schema.org/UsedCondition',
		'poor'       => 'https://schema.org/DamagedCondition',
	);

	if ( isset( $schema_map[ $slug ] ) ) {
		$schema['itemCondition'] = $schema_map[ $slug ];
	}

	return $schema;
}
add_filter( 'trsss_book_schema', 'trsss_book_condition_schema_filter', 10, 2 );
