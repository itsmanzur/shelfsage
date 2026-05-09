<?php
/**
 * Low / Out of Stock Email Alerts.
 *
 * The ShelfSage Inventory dashboard already surfaces low-stock and
 * out-of-stock counts, but shop owners do not check the dashboard every day.
 * This module piggybacks on the WooCommerce stock notification hooks so they
 * receive a customised, book-specific email the moment stock drops below the
 * configured threshold.
 *
 * What the email contains:
 *   - Book cover thumbnail
 *   - Book title (linked to product page)
 *   - ISBN (from `_rmss_isbn`)
 *   - Current stock quantity
 *   - "Edit Product" button
 *
 * Throttle:
 *   WooCommerce fires `woocommerce_low_stock` on every stock change, which
 *   could easily flood the inbox during bulk edits or a busy morning.
 *   We store a 12-hour transient per product per alert type so each book can
 *   only generate one low-stock and one out-of-stock notification per cycle.
 *
 * Settings (Settings -> Features -> Inventory Alerts):
 *   - enable_stock_alerts     (bool, default true)
 *   - low_stock_alert_qty     (int,  default 5)
 *   - low_stock_alert_email   (csv,  default admin_email when blank)
 *
 * Filters:
 *   trsss_stock_alert_recipients   (array $emails, $product, $type)
 *   trsss_stock_alert_subject      (string $subject, $product, $type)
 *   trsss_stock_alert_throttle     (int $seconds, $product, $type) default 12 * HOUR_IN_SECONDS
 *   trsss_stock_alert_should_send  (bool $allow, $product, $type)
 *   trsss_stock_alert_html         (string $html, $product, $type, $context)
 *   trsss_stock_alert_threshold    (int $threshold)
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TRSSS_STOCK_ALERT_TRANSIENT_PREFIX = 'trsss_stock_alert_';

/**
 * Read a single settings key with a default.
 *
 * @param string $key     Settings key.
 * @param mixed  $default Fallback value.
 * @return mixed
 */
function trsss_stock_alert_get_setting( $key, $default = null ) {
	$settings = function_exists( 'trsss_get_shelfsage_settings_array' )
		? trsss_get_shelfsage_settings_array()
		: (array) get_option( 'shelfsage_settings', array() );

	return array_key_exists( $key, $settings ) ? $settings[ $key ] : $default;
}

/**
 * Whether stock alerts are switched on at all.
 *
 * @return bool
 */
function trsss_stock_alerts_enabled() {
	return (bool) apply_filters(
		'trsss_stock_alerts_enabled',
		(bool) trsss_stock_alert_get_setting( 'enable_stock_alerts', true )
	);
}

/**
 * Low-stock threshold (quantity at or below which an alert fires).
 *
 * @return int
 */
function trsss_stock_alert_threshold() {
	$t = (int) trsss_stock_alert_get_setting( 'low_stock_alert_qty', 5 );
	if ( $t < 0 ) {
		$t = 0;
	}
	return (int) apply_filters( 'trsss_stock_alert_threshold', $t );
}

/**
 * Resolve recipients: comma / semicolon / newline-separated CSV.
 *
 * @param object|null $product WC_Product instance (passed to filter).
 * @param string      $type    'low' | 'no'.
 * @return string[]
 */
function trsss_stock_alert_recipients( $product = null, $type = 'low' ) {
	$raw = trim( (string) trsss_stock_alert_get_setting( 'low_stock_alert_email', '' ) );
	if ( '' === $raw ) {
		$raw = (string) get_option( 'admin_email', '' );
	}

	$emails = preg_split( '/[\s,;]+/', $raw, -1, PREG_SPLIT_NO_EMPTY );
	$valid  = array();
	foreach ( (array) $emails as $email ) {
		$email = trim( $email );
		if ( is_email( $email ) ) {
			$valid[] = $email;
		}
	}

	$valid = array_values( array_unique( $valid ) );
	return (array) apply_filters( 'trsss_stock_alert_recipients', $valid, $product, $type );
}

/**
 * Convert "12 H 30 M" stock figures to a printable label.
 *
 * @param object $product WC_Product.
 * @return string
 */
function trsss_stock_alert_format_qty( $product ) {
	if ( ! method_exists( $product, 'get_stock_quantity' ) ) {
		return '0';
	}
	$qty = $product->get_stock_quantity();
	return null === $qty ? '0' : (string) (int) $qty;
}

/**
 * Build the HTML message body.
 *
 * @param object $product WC_Product.
 * @param string $type    'low' | 'no'.
 * @return string
 */
function trsss_stock_alert_html( $product, $type ) {
	$product_id = (int) $product->get_id();
	$title      = (string) $product->get_name();
	$isbn       = (string) get_post_meta( $product_id, '_rmss_isbn', true );
	$isbn13     = (string) get_post_meta( $product_id, '_rmss_isbn13', true );
	$qty        = trsss_stock_alert_format_qty( $product );
	$threshold  = trsss_stock_alert_threshold();
	$permalink  = (string) get_permalink( $product_id );
	$edit_url   = (string) get_edit_post_link( $product_id, 'raw' );
	$thumb_url  = (string) get_the_post_thumbnail_url( $product_id, 'thumbnail' );
	$site_name  = (string) get_bloginfo( 'name' );

	$is_no = ( 'no' === $type );

	$badge_label = $is_no ? __( 'Out of Stock', 'shelfsage' ) : __( 'Low Stock', 'shelfsage' );
	$badge_color = $is_no ? '#991b1b' : '#92400e';
	$badge_bg    = $is_no ? '#fee2e2' : '#fef3c7';
	$intro       = $is_no
		? sprintf(
			/* translators: %s: book title */
			__( '%s is now out of stock. Replenish it as soon as possible to avoid lost sales.', 'shelfsage' ),
			'<strong>' . esc_html( $title ) . '</strong>'
		)
		: sprintf(
			/* translators: 1: book title, 2: remaining quantity, 3: configured threshold */
			__( '%1$s only has %2$s units left in stock (threshold: %3$s). Consider restocking soon.', 'shelfsage' ),
			'<strong>' . esc_html( $title ) . '</strong>',
			'<strong>' . esc_html( $qty ) . '</strong>',
			'<strong>' . esc_html( (string) $threshold ) . '</strong>'
		);

	$rows = '';
	if ( '' !== $isbn ) {
		$rows .= '<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;width:120px;">ISBN</td><td style="padding:6px 12px;color:#0f172a;font-size:13px;font-family:ui-monospace,monospace;">' . esc_html( $isbn ) . '</td></tr>';
	}
	if ( '' !== $isbn13 ) {
		$rows .= '<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;">ISBN-13</td><td style="padding:6px 12px;color:#0f172a;font-size:13px;font-family:ui-monospace,monospace;">' . esc_html( $isbn13 ) . '</td></tr>';
	}
	$rows .= '<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;">' . esc_html__( 'Stock left', 'shelfsage' ) . '</td><td style="padding:6px 12px;color:' . esc_attr( $badge_color ) . ';font-size:13px;font-weight:700;">' . esc_html( $qty ) . '</td></tr>';
	if ( ! $is_no ) {
		$rows .= '<tr><td style="padding:6px 12px;color:#64748b;font-size:13px;">' . esc_html__( 'Threshold', 'shelfsage' ) . '</td><td style="padding:6px 12px;color:#0f172a;font-size:13px;">' . esc_html( (string) $threshold ) . '</td></tr>';
	}

	$thumb_html = '';
	if ( '' !== $thumb_url ) {
		$thumb_html = '<td style="padding:0 16px 0 0;width:96px;vertical-align:top;"><img src="' . esc_url( $thumb_url ) . '" alt="" width="80" style="display:block;border-radius:6px;border:1px solid #e2e8f0;width:80px;height:auto;"/></td>';
	}

	$buttons = '';
	if ( '' !== $edit_url ) {
		$buttons .= '<a href="' . esc_url( $edit_url ) . '" style="display:inline-block;padding:10px 18px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;border-radius:8px;font-size:13px;margin-right:8px;">' . esc_html__( 'Edit product', 'shelfsage' ) . '</a>';
	}
	if ( '' !== $permalink ) {
		$buttons .= '<a href="' . esc_url( $permalink ) . '" style="display:inline-block;padding:10px 18px;background:#f1f5f9;color:#0f172a;text-decoration:none;font-weight:700;border-radius:8px;font-size:13px;border:1px solid #e2e8f0;">' . esc_html__( 'View product', 'shelfsage' ) . '</a>';
	}

	$html  = '<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">';
	$html .= '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;padding:24px 0;">';
	$html .= '<tr><td align="center"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:580px;background:#ffffff;border-radius:14px;border:1px solid #e2e8f0;overflow:hidden;">';

	$html .= '<tr><td style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">';
	$html .= '<div style="display:inline-block;padding:4px 12px;border-radius:999px;background:' . esc_attr( $badge_bg ) . ';color:' . esc_attr( $badge_color ) . ';font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;">' . esc_html( $badge_label ) . '</div>';
	$html .= '<h1 style="margin:8px 0 0;font-size:18px;color:#0f172a;">' . esc_html( $site_name ) . ' &mdash; ShelfSage Inventory Alert</h1>';
	$html .= '</td></tr>';

	$html .= '<tr><td style="padding:24px;">';
	$html .= '<p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#334155;">' . wp_kses_post( $intro ) . '</p>';
	$html .= '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>' . $thumb_html . '<td style="vertical-align:top;">';
	$html .= '<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">' . $rows . '</table>';
	$html .= '</td></tr></table>';
	$html .= '<div style="margin-top:22px;">' . $buttons . '</div>';
	$html .= '</td></tr>';

	$html .= '<tr><td style="padding:14px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#64748b;">';
	$html .= esc_html__( 'You are receiving this because Inventory Alerts are enabled in ShelfSage Settings.', 'shelfsage' );
	$html .= '</td></tr>';

	$html .= '</table></td></tr></table></body></html>';

	$context = array(
		'product_id' => $product_id,
		'qty'        => $qty,
		'threshold'  => $threshold,
		'isbn'       => $isbn,
		'edit_url'   => $edit_url,
		'permalink'  => $permalink,
	);

	return (string) apply_filters( 'trsss_stock_alert_html', $html, $product, $type, $context );
}

/**
 * Plain-text fallback body, attached as the AltBody by the html_content_type
 * filter via wp_mail's automatic boundary handling. We deliver as `text/html`,
 * so this is mostly used by webmail clients that prefer multipart/alternative.
 *
 * @param object $product WC_Product.
 * @param string $type    'low' | 'no'.
 * @return string
 */
function trsss_stock_alert_plain( $product, $type ) {
	$product_id = (int) $product->get_id();
	$title      = (string) $product->get_name();
	$isbn       = (string) get_post_meta( $product_id, '_rmss_isbn', true );
	$qty        = trsss_stock_alert_format_qty( $product );
	$threshold  = trsss_stock_alert_threshold();
	$edit_url   = (string) get_edit_post_link( $product_id, 'raw' );

	$lines   = array();
	$lines[] = ( 'no' === $type ) ? __( '*** OUT OF STOCK ***', 'shelfsage' ) : __( '*** LOW STOCK ***', 'shelfsage' );
	$lines[] = '';
	$lines[] = sprintf( __( 'Book: %s', 'shelfsage' ), $title );
	if ( '' !== $isbn ) {
		$lines[] = sprintf( __( 'ISBN: %s', 'shelfsage' ), $isbn );
	}
	$lines[] = sprintf( __( 'Stock left: %s', 'shelfsage' ), $qty );
	if ( 'no' !== $type ) {
		$lines[] = sprintf( __( 'Threshold: %s', 'shelfsage' ), (string) $threshold );
	}
	if ( '' !== $edit_url ) {
		$lines[] = '';
		$lines[] = sprintf( __( 'Edit: %s', 'shelfsage' ), $edit_url );
	}

	return implode( "\n", $lines );
}

/**
 * Force HTML content type for the duration of one wp_mail call.
 *
 * @return string
 */
function trsss_stock_alert_set_html_content_type() {
	return 'text/html';
}

/**
 * Send a stock alert (low or no), with throttle + filters.
 *
 * @param object $product WC_Product.
 * @param string $type    'low' | 'no'.
 * @return bool True if sent, false if skipped.
 */
function trsss_stock_alert_dispatch( $product, $type ) {
	if ( ! is_object( $product ) || ! method_exists( $product, 'get_id' ) ) {
		return false;
	}
	if ( ! trsss_stock_alerts_enabled() ) {
		return false;
	}

	$type = ( 'no' === $type ) ? 'no' : 'low';
	$product_id = (int) $product->get_id();
	if ( ! $product_id ) {
		return false;
	}

	if ( ! apply_filters( 'trsss_stock_alert_should_send', true, $product, $type ) ) {
		return false;
	}

	if ( 'low' === $type ) {
		$qty       = method_exists( $product, 'get_stock_quantity' ) ? (int) $product->get_stock_quantity() : 0;
		$threshold = trsss_stock_alert_threshold();
		if ( $qty > $threshold ) {
			return false;
		}
	}

	$throttle = (int) apply_filters( 'trsss_stock_alert_throttle', 12 * HOUR_IN_SECONDS, $product, $type );
	$key      = TRSSS_STOCK_ALERT_TRANSIENT_PREFIX . $type . '_' . $product_id;
	if ( $throttle > 0 && get_transient( $key ) ) {
		return false;
	}

	$recipients = trsss_stock_alert_recipients( $product, $type );
	if ( empty( $recipients ) ) {
		return false;
	}

	$site_name = (string) get_bloginfo( 'name' );
	$subject   = sprintf(
		/* translators: 1: site name, 2: alert label, 3: book title */
		__( '[%1$s] %2$s: %3$s', 'shelfsage' ),
		$site_name,
		( 'no' === $type ) ? __( 'Out of Stock', 'shelfsage' ) : __( 'Low Stock', 'shelfsage' ),
		(string) $product->get_name()
	);
	$subject = (string) apply_filters( 'trsss_stock_alert_subject', $subject, $product, $type );

	$html = trsss_stock_alert_html( $product, $type );

	add_filter( 'wp_mail_content_type', 'trsss_stock_alert_set_html_content_type' );
	$sent = wp_mail( $recipients, $subject, $html );
	remove_filter( 'wp_mail_content_type', 'trsss_stock_alert_set_html_content_type' );

	if ( $sent && $throttle > 0 ) {
		set_transient( $key, 1, $throttle );
	}

	/**
	 * Fires after a stock alert email has been dispatched (or skipped because
	 * wp_mail returned false).
	 *
	 * @param bool   $sent
	 * @param object $product
	 * @param string $type
	 * @param array  $recipients
	 */
	do_action( 'trsss_stock_alert_sent', $sent, $product, $type, $recipients );

	return (bool) $sent;
}

/**
 * woocommerce_low_stock callback.
 *
 * @param object $product WC_Product.
 * @return void
 */
function trsss_send_low_stock_alert( $product ) {
	trsss_stock_alert_dispatch( $product, 'low' );
}
add_action( 'woocommerce_low_stock', 'trsss_send_low_stock_alert', 20 );

/**
 * woocommerce_no_stock callback.
 *
 * @param object $product WC_Product.
 * @return void
 */
function trsss_send_no_stock_alert( $product ) {
	trsss_stock_alert_dispatch( $product, 'no' );
}
add_action( 'woocommerce_no_stock', 'trsss_send_no_stock_alert', 20 );

/**
 * Clear the throttle transient when stock is replenished above the threshold,
 * so the next dip below threshold triggers a fresh alert immediately.
 *
 * @param object $product WC_Product.
 * @return void
 */
function trsss_stock_alert_clear_on_replenish( $product ) {
	if ( ! is_object( $product ) || ! method_exists( $product, 'get_id' ) ) {
		return;
	}
	$product_id = (int) $product->get_id();
	if ( ! $product_id ) {
		return;
	}
	$qty       = method_exists( $product, 'get_stock_quantity' ) ? (int) $product->get_stock_quantity() : 0;
	$threshold = trsss_stock_alert_threshold();
	if ( $qty > $threshold ) {
		delete_transient( TRSSS_STOCK_ALERT_TRANSIENT_PREFIX . 'low_' . $product_id );
		delete_transient( TRSSS_STOCK_ALERT_TRANSIENT_PREFIX . 'no_' . $product_id );
	}
}
add_action( 'woocommerce_product_set_stock', 'trsss_stock_alert_clear_on_replenish', 20 );
add_action( 'woocommerce_variation_set_stock', 'trsss_stock_alert_clear_on_replenish', 20 );
