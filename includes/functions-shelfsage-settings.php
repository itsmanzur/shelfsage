<?php
/**
 * Shared ShelfSage settings option helpers (constants + frontend merge accessor).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'TRSSS_OPTION_SETTINGS' ) ) {
	define( 'TRSSS_OPTION_SETTINGS', 'shelfsage_settings' );
}

/**
 * Defaults for ShelfSage global settings (kept DRY with TRSSS_Settings::get_option_defaults()).
 *
 * @return array
 */
function trsss_shelfsage_option_defaults() {
	return array(
		'enable_custom_template'   => true,
		'apply_to_all_products'    => true,
		'single_product_layout'    => 'style-1',
		'vault_single_layout'      => 'style-1',
		'author_profile_layout'    => 'style-1',
		'default_book_image'       => '',
		'primary_color'            => '#2563eb',
		'accent_color'             => '#1d4ed8',
		'book_font_family'         => 'inherit',
		'book_font_family_custom'  => '',
		'enable_look_inside'       => true,
		'pdf_reader_style'         => 'style-1',
		'pdf_reader_engine'        => 'basic',
		'look_inside_btn_position' => 'bottom-left',
		'enable_affiliate'         => true,
		'enable_schema'            => true,
		'enable_advanced_schema'   => true,
		'enable_custom_button'     => false,
		'hide_add_to_cart'         => false,
		'amazon_access_key'        => '',
		'amazon_secret_key'        => '',
		'amazon_associate_tag'     => '',
		'amazon_marketplace'       => 'www.amazon.com',
		'enable_google_books'      => false,
		'google_books_api_key'     => '',
		'wc_sync_enabled'          => true,
		'smart_fallback_enabled'   => true,
		'enable_stock_alerts'      => true,
		'low_stock_alert_qty'      => 5,
		'low_stock_alert_email'    => '',
		'affiliates'               => array(
			array(
				'label' => 'Buy on Amazon',
				'url'   => '',
			),
			array(
				'label' => 'Buy on Rokomari',
				'url'   => '',
			),
		),
		'labels'                   => array(
			'author'             => 'Author',
			'publisher'          => 'Publisher',
			'translator'         => 'Translator',
			'series'             => 'Series',
			'add_to_cart'        => 'Add to Cart',
			'custom_button'      => 'View Details',
			'view_cart'          => 'View Cart',
			'look_inside'        => 'Look Inside',
			'isbn'               => 'ISBN',
			'pages'              => 'Pages',
			'edition'            => 'Edition',
			'binding'            => 'Binding',
			'related_books'      => 'Related Books',
			'more_from_author'   => 'More from this Author',
			'also_available'     => 'Also available at:',
		),
	);
}

/**
 * Merged ShelfSage settings including encrypted credential blobs where stored.
 *
 * @return array
 */
function trsss_get_shelfsage_settings_array() {
	$defaults = trsss_shelfsage_option_defaults();
	$stored   = get_option( TRSSS_OPTION_SETTINGS, array() );

	if ( isset( $stored['affiliates'] ) && ! is_array( $stored['affiliates'] ) ) {
		$stored['affiliates'] = array();
	}
	if ( ! isset( $stored['labels'] ) || ! is_array( $stored['labels'] ) ) {
		$stored['labels'] = array();
	}

	$merged = wp_parse_args( $stored, $defaults );

	return (array) apply_filters( 'trsss_shelfsage_settings_array', $merged );
}

/**
 * Whether the optional WooCommerce integration can safely run.
 *
 * ShelfSage supports multiple data sources. WooCommerce is required only when
 * the selected workflow needs product, cart, price, or stock APIs.
 *
 * @return bool
 */
function trsss_is_woocommerce_available() {
	return class_exists( 'WooCommerce' ) && function_exists( 'wc_get_product' );
}

/**
 * Standard REST error for WooCommerce-only data source requests.
 *
 * @return WP_Error
 */
function trsss_woocommerce_required_error() {
	return new WP_Error(
		'woocommerce_required',
		__( 'WooCommerce is required for the WooCommerce data source. Please activate WooCommerce or choose another ShelfSage source.', 'shelfsage' ),
		array( 'status' => 400 )
	);
}

/**
 * Stable asset version based on file modification time.
 *
 * @param string $relative_path Plugin-relative asset path.
 * @return string
 */
function trsss_asset_version( $relative_path ) {
	$relative_path = ltrim( (string) $relative_path, '/\\' );
	$file          = defined( 'TRSSS_PATH' ) ? TRSSS_PATH . $relative_path : '';

	if ( $file && file_exists( $file ) ) {
		return (string) filemtime( $file );
	}

	return defined( 'TRSSS_VERSION' ) ? (string) TRSSS_VERSION : '1.5.1';
}

/**
 * Safely resolve a term archive URL for templates.
 *
 * @param WP_Term|int|null $term Term object or ID.
 * @return string
 */
function trsss_safe_term_link( $term ) {
	if ( empty( $term ) ) {
		return '#';
	}

	$link = get_term_link( $term );

	return is_wp_error( $link ) ? '#' : $link;
}

/**
 * Get release timestamp for an active pre-order product.
 *
 * @param int $product_id Product ID.
 * @return int Unix timestamp in the site timezone, or 0 when not applicable.
 */
function trsss_get_preorder_release_timestamp( $product_id ) {
	$product_id   = absint( $product_id );
	$pre_order    = get_post_meta( $product_id, '_rmss_pre_order', true );
	$release_date = trim( (string) get_post_meta( $product_id, '_rmss_release_date', true ) );
	$pre_order_on = ! in_array( strtolower( trim( (string) $pre_order ) ), array( '', '0', 'no', 'false', 'off' ), true );

	if ( ! $product_id || ! $pre_order_on || '' === $release_date ) {
		return 0;
	}

	try {
		$timezone = function_exists( 'wp_timezone' ) ? wp_timezone() : new DateTimeZone( 'UTC' );
		$date     = new DateTimeImmutable( $release_date, $timezone );
		$date     = $date->setTime( 0, 0, 0 );
		return $date->getTimestamp();
	} catch ( Exception $e ) {
		$timestamp = strtotime( $release_date );
		return $timestamp ? (int) $timestamp : 0;
	}
}

/**
 * Render a pre-order countdown for single product templates.
 *
 * @param int   $product_id Product ID.
 * @param array $args       Display options.
 * @return void
 */
function trsss_render_preorder_countdown( $product_id, $args = array() ) {
	$product_id  = absint( $product_id );
	$release_ts  = trsss_get_preorder_release_timestamp( $product_id );
	$current_ts  = current_time( 'timestamp' );

	if ( ! $product_id || $release_ts <= $current_ts ) {
		return;
	}

	// Guard against duplicate output when both the ShelfSage template AND the
	// woocommerce_single_product_summary auto-injection (or a shortcode) try to
	// render the same product's countdown on the same request.
	static $rendered_for = array();
	if ( isset( $rendered_for[ $product_id ] ) ) {
		return;
	}
	$rendered_for[ $product_id ] = true;

	$args = wp_parse_args(
		$args,
		array(
			'class' => '',
			'title' => __( 'Pre-order countdown', 'shelfsage' ),
		)
	);

	static $assets_printed = false;
	$countdown_id          = 'trsss-preorder-countdown-' . $product_id . '-' . wp_rand( 1000, 9999 );
	$release_text          = sprintf(
		/* translators: %s: formatted release date. */
		__( 'Releases on %s', 'shelfsage' ),
		date_i18n( get_option( 'date_format' ), $release_ts )
	);
	$labels                = array(
		'days'      => __( 'Days', 'shelfsage' ),
		'hours'     => __( 'Hours', 'shelfsage' ),
		'minutes'   => __( 'Minutes', 'shelfsage' ),
		'seconds'   => __( 'Seconds', 'shelfsage' ),
		'available' => __( 'Available now', 'shelfsage' ),
	);

	if ( ! $assets_printed ) :
		$assets_printed = true;
		?>
		<style id="trsss-preorder-countdown-css">
			.trsss-preorder-countdown{margin:1rem 0;padding:1rem;border:1px solid rgba(37,99,235,.18);border-radius:.75rem;background:linear-gradient(135deg,rgba(239,246,255,.98),rgba(255,255,255,.98));box-shadow:0 10px 28px rgba(15,23,42,.06)}
			.trsss-preorder-countdown__head{display:flex;align-items:center;justify-content:space-between;gap:.75rem;margin-bottom:.75rem}
			.trsss-preorder-countdown__title{margin:0;font-size:.82rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:#1d4ed8}
			.trsss-preorder-countdown__date{font-size:.8rem;font-weight:600;color:#64748b;text-align:right}
			.trsss-preorder-countdown__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem}
			.trsss-preorder-countdown__unit{min-width:0;border-radius:.65rem;background:#fff;border:1px solid rgba(148,163,184,.22);padding:.65rem .35rem;text-align:center}
			.trsss-preorder-countdown__value{display:block;font-size:1.35rem;line-height:1;font-weight:900;color:#0f172a;font-variant-numeric:tabular-nums}
			.trsss-preorder-countdown__label{display:block;margin-top:.35rem;font-size:.68rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.03em}
			.trsss-preorder-countdown.is-complete .trsss-preorder-countdown__grid{display:none}
			.trsss-preorder-countdown__complete{display:none;margin:0;font-weight:800;color:#15803d}
			.trsss-preorder-countdown.is-complete .trsss-preorder-countdown__complete{display:block}
			@media (max-width:480px){.trsss-preorder-countdown{padding:.85rem}.trsss-preorder-countdown__head{align-items:flex-start;flex-direction:column}.trsss-preorder-countdown__date{text-align:left}.trsss-preorder-countdown__grid{gap:.4rem}.trsss-preorder-countdown__value{font-size:1.08rem}.trsss-preorder-countdown__label{font-size:.58rem}}
		</style>
		<script id="trsss-preorder-countdown-js">
		(function(){
			if (window.trsssPreorderCountdownInit) return;
			window.trsssPreorderCountdownInit = function(root) {
				if (!root || root.dataset.trsssCountdownReady) return;
				root.dataset.trsssCountdownReady = '1';
				var target = parseInt(root.getAttribute('data-release-ts'), 10) * 1000;
				var values = {
					days: root.querySelector('[data-countdown-days]'),
					hours: root.querySelector('[data-countdown-hours]'),
					minutes: root.querySelector('[data-countdown-minutes]'),
					seconds: root.querySelector('[data-countdown-seconds]')
				};
				function pad(value) { return value < 10 ? '0' + value : String(value); }
				function tick() {
					var diff = target - Date.now();
					if (diff <= 0) {
						root.classList.add('is-complete');
						if (root._trsssTimer) window.clearInterval(root._trsssTimer);
						return;
					}
					var total = Math.floor(diff / 1000);
					var days = Math.floor(total / 86400);
					total -= days * 86400;
					var hours = Math.floor(total / 3600);
					total -= hours * 3600;
					var minutes = Math.floor(total / 60);
					var seconds = total - minutes * 60;
					if (values.days) values.days.textContent = String(days);
					if (values.hours) values.hours.textContent = pad(hours);
					if (values.minutes) values.minutes.textContent = pad(minutes);
					if (values.seconds) values.seconds.textContent = pad(seconds);
				}
				tick();
				root._trsssTimer = window.setInterval(tick, 1000);
			};
			document.addEventListener('DOMContentLoaded', function(){
				document.querySelectorAll('[data-trsss-preorder-countdown]').forEach(window.trsssPreorderCountdownInit);
			});
		}());
		</script>
		<?php
	endif;
	?>
	<div id="<?php echo esc_attr( $countdown_id ); ?>" class="trsss-preorder-countdown <?php echo esc_attr( $args['class'] ); ?>" data-trsss-preorder-countdown data-release-ts="<?php echo esc_attr( $release_ts ); ?>">
		<div class="trsss-preorder-countdown__head">
			<p class="trsss-preorder-countdown__title"><?php echo esc_html( $args['title'] ); ?></p>
			<span class="trsss-preorder-countdown__date"><?php echo esc_html( $release_text ); ?></span>
		</div>
		<div class="trsss-preorder-countdown__grid" aria-live="polite">
			<span class="trsss-preorder-countdown__unit"><span class="trsss-preorder-countdown__value" data-countdown-days>0</span><span class="trsss-preorder-countdown__label"><?php echo esc_html( $labels['days'] ); ?></span></span>
			<span class="trsss-preorder-countdown__unit"><span class="trsss-preorder-countdown__value" data-countdown-hours>00</span><span class="trsss-preorder-countdown__label"><?php echo esc_html( $labels['hours'] ); ?></span></span>
			<span class="trsss-preorder-countdown__unit"><span class="trsss-preorder-countdown__value" data-countdown-minutes>00</span><span class="trsss-preorder-countdown__label"><?php echo esc_html( $labels['minutes'] ); ?></span></span>
			<span class="trsss-preorder-countdown__unit"><span class="trsss-preorder-countdown__value" data-countdown-seconds>00</span><span class="trsss-preorder-countdown__label"><?php echo esc_html( $labels['seconds'] ); ?></span></span>
		</div>
		<p class="trsss-preorder-countdown__complete"><?php echo esc_html( $labels['available'] ); ?></p>
	</div>
	<script>window.trsssPreorderCountdownInit&&window.trsssPreorderCountdownInit(document.getElementById(<?php echo wp_json_encode( $countdown_id ); ?>));</script>
	<?php
}

/**
 * Shortcode: [shelfsage_preorder_countdown id="123" title="..." class="..."]
 *
 * Renders the pre-order countdown for a given product anywhere a shortcode
 * can be used (page content, block templates, sidebars, custom theme files
 * via do_shortcode()). When `id` is omitted, the current loop product is used.
 *
 * @param array $atts Shortcode attributes.
 * @return string Countdown HTML, or empty string when no active pre-order applies.
 */
function trsss_preorder_countdown_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'id'    => 0,
			'title' => '',
			'class' => '',
		),
		$atts,
		'shelfsage_preorder_countdown'
	);

	$product_id = absint( $atts['id'] );
	if ( ! $product_id ) {
		$product_id = (int) get_the_ID();
	}

	if ( ! $product_id ) {
		return '';
	}

	$args = array();
	if ( '' !== $atts['title'] ) {
		$args['title'] = (string) $atts['title'];
	}
	if ( '' !== $atts['class'] ) {
		$args['class'] = sanitize_html_class( $atts['class'] );
	}

	ob_start();
	trsss_render_preorder_countdown( $product_id, $args );
	return (string) ob_get_clean();
}
add_shortcode( 'shelfsage_preorder_countdown', 'trsss_preorder_countdown_shortcode' );

/**
 * Auto-inject the pre-order countdown on stock WooCommerce single product
 * templates (i.e. when a theme or site has ShelfSage's custom template
 * disabled, or for non-book products that still use _rmss_pre_order meta).
 *
 * Position: priority 25 — between excerpt (20) and add_to_cart (30), giving
 * the countdown maximum visibility right above the buy button.
 *
 * The static guard inside trsss_render_preorder_countdown() prevents this
 * hook from producing a duplicate countdown when a ShelfSage custom
 * template has already rendered one earlier in the request.
 *
 * Disable per-product: add_filter( 'trsss_auto_inject_preorder_countdown', '__return_false' );
 *
 * @return void
 */
function trsss_auto_inject_preorder_countdown_summary() {
	if ( ! function_exists( 'is_product' ) || ! is_product() ) {
		return;
	}

	$product_id = (int) get_the_ID();
	if ( ! $product_id ) {
		return;
	}

	if ( ! trsss_get_preorder_release_timestamp( $product_id ) ) {
		return;
	}

	if ( ! apply_filters( 'trsss_auto_inject_preorder_countdown', true, $product_id ) ) {
		return;
	}

	trsss_render_preorder_countdown( $product_id );
}
add_action( 'woocommerce_single_product_summary', 'trsss_auto_inject_preorder_countdown_summary', 25 );
