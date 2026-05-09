<?php
/**
 * Age Rating / Content Advisory Badge.
 *
 * Surfaces a colour-coded content advisory pill on book product pages so
 * parents (and CodeCanyon reviewers) can see at a glance who the book is
 * appropriate for. The badge is also pushed into the JSON-LD Book schema as
 * `contentRating`, so Google can surface "Adult 18+" / "All Ages" style
 * labels on rich results.
 *
 * Data source:  product meta `_rmss_age_rating`
 *               (set under Product → Book Details → Age Rating)
 *
 * Allowed values:
 *   ''             -> badge hidden (default for general bookstores)
 *   'all_ages'     -> green   "All Ages"
 *   'children'     -> blue    "Children"          (also accepts legacy "kids")
 *   'teen'         -> amber   "Teen 13+"
 *   'young_adult'  -> orange  "Young Adult 16+"   (also accepts legacy "ya")
 *   'adult'        -> red     "Adult 18+"
 *
 * Where it appears:
 *   - Auto-injected via `woocommerce_single_product_summary` priority 9
 *     (after Book Condition badge at 8, before rating / price at 10) on
 *     stock WooCommerce templates.
 *   - Embedded in all six ShelfSage single-product templates next to the
 *     Book Condition badge.
 *   - On any page or post via [shelfsage_age_rating id="123"].
 *
 * Filters:
 *   trsss_age_rating_labels         (array $slug => $label)
 *   trsss_age_rating_colors         (array $slug => ['bg','fg','border'])
 *   trsss_age_rating_icons          (array $slug => $emoji)
 *   trsss_auto_inject_age_rating    (bool  $allow, $product_id)
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Public, translated label for each age-rating slug.
 *
 * @return array<string,string>
 */
function trsss_get_age_rating_labels() {
	return apply_filters(
		'trsss_age_rating_labels',
		array(
			'all_ages'    => __( 'All Ages', 'shelfsage' ),
			'children'    => __( 'Children', 'shelfsage' ),
			'teen'        => __( 'Teen 13+', 'shelfsage' ),
			'young_adult' => __( 'Young Adult 16+', 'shelfsage' ),
			'adult'       => __( 'Adult 18+', 'shelfsage' ),
		)
	);
}

/**
 * Background / foreground / border colours for each rating.
 *
 * @return array<string,array{bg:string,fg:string,border:string}>
 */
function trsss_get_age_rating_color_map() {
	return apply_filters(
		'trsss_age_rating_colors',
		array(
			'all_ages'    => array( 'bg' => '#dcfce7', 'fg' => '#166534', 'border' => '#86efac' ),
			'children'    => array( 'bg' => '#e0f2fe', 'fg' => '#075985', 'border' => '#7dd3fc' ),
			'teen'        => array( 'bg' => '#fef3c7', 'fg' => '#92400e', 'border' => '#fcd34d' ),
			'young_adult' => array( 'bg' => '#ffedd5', 'fg' => '#9a3412', 'border' => '#fdba74' ),
			'adult'       => array( 'bg' => '#fee2e2', 'fg' => '#991b1b', 'border' => '#fca5a5' ),
		)
	);
}

/**
 * Single-glyph icon for each rating (used inside the badge).
 *
 * @return array<string,string>
 */
function trsss_get_age_rating_icons() {
	return apply_filters(
		'trsss_age_rating_icons',
		array(
			'all_ages'    => '🟢',
			'children'    => '🔵',
			'teen'        => '🟡',
			'young_adult' => '🟠',
			'adult'       => '🔴',
		)
	);
}

/**
 * Read and normalise the stored rating value.
 *
 * Accepts legacy free-text values like "13+", "Adult", "YA", "Kids" and
 * folds them into the canonical slug list.
 *
 * @param int $product_id Product ID.
 * @return string Canonical age-rating slug, or '' when no badge should render.
 */
function trsss_get_age_rating_slug( $product_id ) {
	$raw = trim( (string) get_post_meta( absint( $product_id ), '_rmss_age_rating', true ) );
	if ( '' === $raw ) {
		return '';
	}

	$slug = strtolower( $raw );
	$slug = preg_replace( '/[\s\-+]+/', '_', $slug );
	$slug = trim( (string) $slug, '_' );

	$aliases = array(
		'kids'       => 'children',
		'child'      => 'children',
		'children'   => 'children',
		'ya'         => 'young_adult',
		'youngadult' => 'young_adult',
		'young'      => 'young_adult',
		'13'         => 'teen',
		'13_plus'    => 'teen',
		'16'         => 'young_adult',
		'16_plus'    => 'young_adult',
		'18'         => 'adult',
		'18_plus'    => 'adult',
		'all'        => 'all_ages',
		'allages'    => 'all_ages',
		'general'    => 'all_ages',
		'mature'     => 'adult',
	);
	if ( isset( $aliases[ $slug ] ) ) {
		$slug = $aliases[ $slug ];
	}

	$valid = array_keys( trsss_get_age_rating_labels() );
	return in_array( $slug, $valid, true ) ? $slug : '';
}

/**
 * Render the badge.
 *
 * @param int   $product_id Product ID.
 * @param array $args       Optional. 'class' and 'icon' (bool).
 * @return void
 */
function trsss_render_age_rating_badge( $product_id, $args = array() ) {
	static $rendered_for = array();

	$product_id = absint( $product_id );
	if ( ! $product_id || isset( $rendered_for[ $product_id ] ) ) {
		return;
	}

	$slug = trsss_get_age_rating_slug( $product_id );
	if ( '' === $slug ) {
		return;
	}

	$labels = trsss_get_age_rating_labels();
	$colors = trsss_get_age_rating_color_map();
	$icons  = trsss_get_age_rating_icons();
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
		echo '<style id="trsss-age-rating-css">.trsss-age-rating{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;font-size:12px;font-weight:700;border-radius:999px;letter-spacing:.02em;border:1px solid;line-height:1.4;vertical-align:middle;font-family:inherit}.trsss-age-rating .trsss-age-rating__icon{font-size:11px;line-height:1}</style>';
	}

	$icon_html = '';
	if ( $args['icon'] && isset( $icons[ $slug ] ) && '' !== $icons[ $slug ] ) {
		$icon_html = '<span class="trsss-age-rating__icon" aria-hidden="true">' . esc_html( $icons[ $slug ] ) . '</span>';
	}

	$style = sprintf(
		'background:%s;color:%s;border-color:%s',
		$colors[ $slug ]['bg'],
		$colors[ $slug ]['fg'],
		$colors[ $slug ]['border']
	);

	$aria_label = sprintf(
		/* translators: %s: age rating label */
		__( 'Content advisory: %s', 'shelfsage' ),
		$labels[ $slug ]
	);

	printf(
		'<span class="trsss-age-rating %1$s" style="%2$s" role="img" aria-label="%3$s">%4$s%5$s</span>',
		esc_attr( $args['class'] ),
		esc_attr( $style ),
		esc_attr( $aria_label ),
		$icon_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- already escaped above.
		esc_html( $labels[ $slug ] )
	);
}

/**
 * Auto-inject the badge on stock WooCommerce single-product templates.
 *
 * Position 9 = after Book Condition (8), before rating / price (10).
 *
 * Filter to disable per product:
 *   add_filter( 'trsss_auto_inject_age_rating', '__return_false' );
 *
 * @return void
 */
function trsss_auto_inject_age_rating_summary() {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}

	$product_id = (int) get_the_ID();
	if ( ! $product_id ) {
		return;
	}

	if ( '' === trsss_get_age_rating_slug( $product_id ) ) {
		return;
	}

	if ( ! apply_filters( 'trsss_auto_inject_age_rating', true, $product_id ) ) {
		return;
	}

	echo '<div class="trsss-age-rating-wrapper" style="margin:6px 0 8px;">';
	trsss_render_age_rating_badge( $product_id );
	echo '</div>';
}
add_action( 'woocommerce_single_product_summary', 'trsss_auto_inject_age_rating_summary', 9 );

/**
 * Shortcode: [shelfsage_age_rating id="123" class="..." icon="yes|no"]
 *
 * @param array $atts Shortcode attributes.
 * @return string Badge HTML or empty string.
 */
function trsss_age_rating_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'id'    => 0,
			'class' => '',
			'icon'  => 'yes',
		),
		$atts,
		'shelfsage_age_rating'
	);

	$product_id = absint( $atts['id'] );
	if ( ! $product_id ) {
		$product_id = (int) get_the_ID();
	}
	if ( ! $product_id ) {
		return '';
	}

	$args = array(
		'icon' => ! in_array( strtolower( (string) $atts['icon'] ), array( 'no', 'false', '0', 'off' ), true ),
	);
	if ( '' !== $atts['class'] ) {
		$args['class'] = sanitize_html_class( $atts['class'] );
	}

	ob_start();
	trsss_render_age_rating_badge( $product_id, $args );
	return (string) ob_get_clean();
}
add_shortcode( 'shelfsage_age_rating', 'trsss_age_rating_shortcode' );

/**
 * Push the age rating into the JSON-LD Book schema as `contentRating`.
 *
 * Per schema.org/CreativeWork#contentRating this is a free-text field
 * (e.g. "MPAA PG-13"). We use the human-readable label so Google Rich
 * Results can render it as-is.
 *
 * @param array $schema     Existing schema array.
 * @param int   $product_id Product ID.
 * @return array
 */
function trsss_age_rating_schema_filter( $schema, $product_id ) {
	$slug = trsss_get_age_rating_slug( (int) $product_id );
	if ( '' === $slug || ! is_array( $schema ) ) {
		return $schema;
	}

	$labels = trsss_get_age_rating_labels();
	if ( isset( $labels[ $slug ] ) ) {
		$schema['contentRating'] = (string) $labels[ $slug ];

		// Adult-rated books should also flag typicalAgeRange so retail filters work.
		$age_range = array(
			'all_ages'    => null,
			'children'    => '5-11',
			'teen'        => '13-17',
			'young_adult' => '16-18',
			'adult'       => '18-',
		);
		if ( ! empty( $age_range[ $slug ] ) ) {
			$schema['typicalAgeRange'] = $age_range[ $slug ];
		}
	}

	return $schema;
}
add_filter( 'trsss_book_schema', 'trsss_age_rating_schema_filter', 11, 2 );
