<?php
/**
 * E-book Download Gate
 *
 * Replaces the public `_rmss_ebook_url` link with a purchase-gated download
 * flow:
 *
 *   - Customers see a "Download e-book" button on the single product page
 *     ONLY when they are logged in and have a paid order containing the
 *     product (status = completed | processing).
 *   - Order completion / processing emails get a "Your e-book downloads"
 *     section appended automatically with HMAC-signed URLs that work for
 *     guest checkout customers without a WP account.
 *   - The download endpoint validates an expiring HMAC token, re-checks
 *     order ownership and paid status, increments a download counter on
 *     the order, then either streams a local file or redirects to the
 *     external storage URL.
 *
 * URL shape:
 *   /?shelfsage_ebook_download=1&order=123&product=456&exp=1779999999&token=abc
 *
 * Security:
 *   - HMAC-SHA256 over `order|product|expiry` using wp_salt('auth').
 *   - hash_equals() constant-time compare.
 *   - Re-checks order paid status and product membership at request time.
 *   - Local file streaming refuses to leave the uploads dir.
 *   - All output is escaped; all input is sanitised.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TRSSS_EBOOK_DOWNLOAD_QUERY_VAR = 'shelfsage_ebook_download';
const TRSSS_EBOOK_TOKEN_TTL_DEFAULT  = 30 * DAY_IN_SECONDS;
const TRSSS_EBOOK_LOG_META_PREFIX    = '_trsss_ebook_dl_';

/**
 * Build an HMAC-SHA256 token over (order_id|product_id|expiry).
 *
 * @param int $order_id   Order ID.
 * @param int $product_id Product ID.
 * @param int $expiry     Unix timestamp at which the token stops being valid.
 * @return string Hex digest.
 */
function trsss_ebook_make_token( $order_id, $product_id, $expiry ) {
	$payload = (int) $order_id . '|' . (int) $product_id . '|' . (int) $expiry;
	return hash_hmac( 'sha256', $payload, wp_salt( 'auth' ) );
}

/**
 * Constant-time verification of a download token.
 *
 * @param int    $order_id   Order ID.
 * @param int    $product_id Product ID.
 * @param int    $expiry     Embedded expiry timestamp.
 * @param string $token      Token from the query string.
 * @return bool
 */
function trsss_ebook_verify_token( $order_id, $product_id, $expiry, $token ) {
	if ( (int) $expiry < time() ) {
		return false;
	}

	$expected = trsss_ebook_make_token( $order_id, $product_id, $expiry );
	return hash_equals( $expected, (string) $token );
}

/**
 * Find the most recent paid order belonging to a user that contains a given
 * product. Returns 0 when no eligible order is found or WooCommerce is not
 * loaded.
 *
 * @param int $user_id    User ID.
 * @param int $product_id Product ID.
 * @return int Order ID or 0.
 */
function trsss_ebook_get_recent_order_for_product( $user_id, $product_id ) {
	if ( ! function_exists( 'wc_get_orders' ) ) {
		return 0;
	}

	$user_id    = absint( $user_id );
	$product_id = absint( $product_id );
	if ( ! $user_id || ! $product_id ) {
		return 0;
	}

	$statuses = (array) apply_filters(
		'trsss_ebook_paid_statuses',
		array( 'completed', 'processing' )
	);

	$orders = wc_get_orders(
		array(
			'customer_id' => $user_id,
			'status'      => $statuses,
			'limit'       => 50,
			'orderby'     => 'date',
			'order'       => 'DESC',
		)
	);

	foreach ( $orders as $order ) {
		foreach ( $order->get_items() as $item ) {
			if ( (int) $item->get_product_id() === $product_id ) {
				return (int) $order->get_id();
			}
		}
	}

	return 0;
}

/**
 * Build a signed, time-limited download URL for an e-book.
 *
 * @param int $product_id Product ID.
 * @param int $order_id   Order ID that proves entitlement.
 * @param int $ttl        Optional override for the token lifetime in seconds.
 * @return string Empty string when inputs are invalid.
 */
function trsss_get_ebook_download_url( $product_id, $order_id, $ttl = 0 ) {
	$product_id = absint( $product_id );
	$order_id   = absint( $order_id );
	if ( ! $product_id || ! $order_id ) {
		return '';
	}

	$ttl = $ttl > 0
		? (int) $ttl
		: (int) apply_filters(
			'trsss_ebook_token_ttl',
			TRSSS_EBOOK_TOKEN_TTL_DEFAULT,
			$product_id,
			$order_id
		);

	$expiry = time() + max( 60, $ttl );
	$token  = trsss_ebook_make_token( $order_id, $product_id, $expiry );

	return add_query_arg(
		array(
			TRSSS_EBOOK_DOWNLOAD_QUERY_VAR => 1,
			'order'                        => $order_id,
			'product'                      => $product_id,
			'exp'                          => $expiry,
			'token'                        => $token,
		),
		home_url( '/' )
	);
}

/**
 * Render the gated "Download e-book" button (or the "Buy to download"
 * fallback) on a single product page. Outputs nothing when the product has
 * no `_rmss_ebook_url` meta.
 *
 * @param int   $product_id Product ID.
 * @param array $args       Optional. CSS class overrides:
 *                          'class'        => button class (entitled),
 *                          'locked_class' => button class (not entitled),
 *                          'icon'         => bool, show download icon.
 * @return void
 */
function trsss_render_ebook_download_button( $product_id, $args = array() ) {
	$product_id = absint( $product_id );
	if ( ! $product_id ) {
		return;
	}

	$ebook_url = trim( (string) get_post_meta( $product_id, '_rmss_ebook_url', true ) );
	if ( '' === $ebook_url ) {
		return;
	}

	$args = wp_parse_args(
		$args,
		array(
			'class'        => 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-medium transition-colors',
			'locked_class' => 'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 text-sm font-medium transition-colors',
			'icon'         => true,
		)
	);

	$icon_html = $args['icon']
		? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>'
		: '';

	$user_id  = is_user_logged_in() ? get_current_user_id() : 0;
	$order_id = $user_id ? trsss_ebook_get_recent_order_for_product( $user_id, $product_id ) : 0;

	if ( ! $order_id ) {
		$locked_label = esc_html(
			apply_filters( 'trsss_ebook_locked_label', __( 'Buy to download e-book', 'shelfsage' ) )
		);
		printf(
			'<a href="%1$s" class="%2$s trsss-ebook-locked" rel="nofollow">%3$s%4$s</a>',
			esc_url( get_permalink( $product_id ) ),
			esc_attr( $args['locked_class'] ),
			$icon_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG
			$locked_label
		);
		return;
	}

	$download_url = trsss_get_ebook_download_url( $product_id, $order_id );
	if ( '' === $download_url ) {
		return;
	}

	$label = esc_html(
		apply_filters( 'rmss_ebook_link_label', __( 'Download e-book', 'shelfsage' ) )
	);

	printf(
		'<a href="%1$s" class="%2$s trsss-ebook-download" rel="nofollow noopener">%3$s%4$s</a>',
		esc_url( $download_url ),
		esc_attr( $args['class'] ),
		$icon_html, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static SVG
		$label
	);
}

/**
 * Resolve a URL pointing inside the WordPress uploads directory to its
 * absolute filesystem path. Returns empty string for any URL outside that
 * directory, so the streamer can never leak arbitrary files.
 *
 * @param string $url Public URL.
 * @return string Filesystem path, or '' for external/non-uploads URLs.
 */
function trsss_ebook_resolve_local_path( $url ) {
	$url = (string) $url;
	if ( '' === $url ) {
		return '';
	}

	$upload_dir = wp_get_upload_dir();
	if ( empty( $upload_dir['baseurl'] ) || empty( $upload_dir['basedir'] ) ) {
		return '';
	}

	if ( strpos( $url, $upload_dir['baseurl'] ) !== 0 ) {
		return '';
	}

	$path     = str_replace( $upload_dir['baseurl'], $upload_dir['basedir'], $url );
	$real     = realpath( $path );
	$base     = realpath( $upload_dir['basedir'] );

	// Defence-in-depth: refuse path traversal outside the uploads root.
	if ( ! $real || ! $base || strpos( $real, $base ) !== 0 ) {
		return '';
	}

	return $real;
}

/**
 * Stream a local file with download headers and exit.
 *
 * @param string $path     Filesystem path (already validated by resolver).
 * @param string $filename Suggested filename for the browser.
 * @return void
 */
function trsss_ebook_stream_file( $path, $filename ) {
	if ( function_exists( 'ob_get_level' ) ) {
		while ( ob_get_level() > 0 ) {
			ob_end_clean();
		}
	}

	nocache_headers();
	header( 'Content-Description: File Transfer' );
	header( 'Content-Type: application/octet-stream' );
	header( 'Content-Disposition: attachment; filename="' . sanitize_file_name( $filename ) . '"' );
	header( 'Content-Transfer-Encoding: binary' );
	header( 'X-Content-Type-Options: nosniff' );

	$size = @filesize( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors
	if ( $size ) {
		header( 'Content-Length: ' . (int) $size );
	}

	@readfile( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors,WordPress.WP.AlternativeFunctions.file_system_read_readfile
}

/**
 * Handle ?shelfsage_ebook_download=1 download requests.
 *
 * @return void
 */
function trsss_ebook_download_handler() {
	if ( empty( $_GET[ TRSSS_EBOOK_DOWNLOAD_QUERY_VAR ] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Token-signed link, not a form submission.
		return;
	}

	$order_id   = isset( $_GET['order'] ) ? absint( $_GET['order'] ) : 0;       // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$product_id = isset( $_GET['product'] ) ? absint( $_GET['product'] ) : 0;   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$expiry     = isset( $_GET['exp'] ) ? absint( $_GET['exp'] ) : 0;           // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$token      = isset( $_GET['token'] )                                       // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		? sanitize_text_field( wp_unslash( $_GET['token'] ) )                   // phpcs:ignore WordPress.Security.NonceVerification.Recommended
		: '';

	if ( ! $order_id || ! $product_id || ! $expiry || '' === $token ) {
		wp_die(
			esc_html__( 'Invalid e-book download link.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 400 )
		);
	}

	if ( ! trsss_ebook_verify_token( $order_id, $product_id, $expiry, $token ) ) {
		wp_die(
			esc_html__( 'This download link has expired or is invalid. Please request a new one from your account.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 403 )
		);
	}

	if ( ! function_exists( 'wc_get_order' ) ) {
		wp_die(
			esc_html__( 'WooCommerce is required to verify this download.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 503 )
		);
	}

	$order = wc_get_order( $order_id );
	if ( ! $order ) {
		wp_die(
			esc_html__( 'Order not found.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 404 )
		);
	}

	$allowed_statuses = (array) apply_filters(
		'trsss_ebook_paid_statuses',
		array( 'completed', 'processing' )
	);

	if ( ! in_array( $order->get_status(), $allowed_statuses, true ) ) {
		wp_die(
			esc_html__( 'This order is not paid yet, so the e-book is not available.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 403 )
		);
	}

	$product_in_order = false;
	foreach ( $order->get_items() as $item ) {
		if ( (int) $item->get_product_id() === $product_id ) {
			$product_in_order = true;
			break;
		}
	}

	if ( ! $product_in_order ) {
		wp_die(
			esc_html__( 'This product is not part of the supplied order.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 403 )
		);
	}

	$ebook_url = trim( (string) get_post_meta( $product_id, '_rmss_ebook_url', true ) );
	if ( '' === $ebook_url ) {
		wp_die(
			esc_html__( 'No e-book is attached to this product.', 'shelfsage' ),
			esc_html__( 'Download error', 'shelfsage' ),
			array( 'response' => 404 )
		);
	}

	$count = (int) $order->get_meta( TRSSS_EBOOK_LOG_META_PREFIX . 'count_' . $product_id );
	$order->update_meta_data( TRSSS_EBOOK_LOG_META_PREFIX . 'count_' . $product_id, $count + 1 );
	$order->update_meta_data( TRSSS_EBOOK_LOG_META_PREFIX . 'last_' . $product_id, current_time( 'mysql' ) );
	$order->save();

	/**
	 * Fires immediately before an e-book is served to the customer.
	 *
	 * @param int    $order_id   Order ID.
	 * @param int    $product_id Product ID.
	 * @param string $ebook_url  Underlying e-book URL stored in product meta.
	 */
	do_action( 'trsss_ebook_download_served', $order_id, $product_id, $ebook_url );

	$local_path = trsss_ebook_resolve_local_path( $ebook_url );
	if ( $local_path && file_exists( $local_path ) ) {
		$filename = wp_basename( $local_path );
		trsss_ebook_stream_file( $local_path, $filename );
		exit;
	}

	nocache_headers();
	wp_safe_redirect( esc_url_raw( $ebook_url ), 302 );
	exit;
}
add_action( 'template_redirect', 'trsss_ebook_download_handler', 1 );

/**
 * Append "Your e-book downloads" section to the customer's processing /
 * completed order email. Skipped for admin emails and for emails that don't
 * carry purchase entitlement (e.g. new-order admin notification).
 *
 * @param WC_Order $order        Order object.
 * @param bool     $sent_to_admin Whether this email is going to an admin.
 * @param bool     $plain_text    Whether the email is plain-text.
 * @param WC_Email $email         Email object.
 * @return void
 */
function trsss_ebook_email_inject_links( $order, $sent_to_admin, $plain_text, $email = null ) {
	if ( $sent_to_admin || ! ( $order instanceof WC_Order ) ) {
		return;
	}

	$valid_email_ids = (array) apply_filters(
		'trsss_ebook_email_ids',
		array( 'customer_completed_order', 'customer_processing_order' )
	);

	$email_id = is_object( $email ) && isset( $email->id ) ? (string) $email->id : '';
	if ( '' === $email_id || ! in_array( $email_id, $valid_email_ids, true ) ) {
		return;
	}

	$allowed_statuses = (array) apply_filters(
		'trsss_ebook_paid_statuses',
		array( 'completed', 'processing' )
	);

	if ( ! in_array( $order->get_status(), $allowed_statuses, true ) ) {
		return;
	}

	$links = array();
	foreach ( $order->get_items() as $item ) {
		$product_id = (int) $item->get_product_id();
		if ( ! $product_id ) {
			continue;
		}

		$ebook_url = trim( (string) get_post_meta( $product_id, '_rmss_ebook_url', true ) );
		if ( '' === $ebook_url ) {
			continue;
		}

		$download_url = trsss_get_ebook_download_url( $product_id, $order->get_id() );
		if ( '' === $download_url ) {
			continue;
		}

		$links[] = array(
			'name' => $item->get_name(),
			'url'  => $download_url,
		);
	}

	if ( empty( $links ) ) {
		return;
	}

	if ( $plain_text ) {
		echo "\n" . esc_html__( 'Your e-book downloads', 'shelfsage' ) . "\n";
		echo str_repeat( '=', 30 ) . "\n";
		foreach ( $links as $l ) {
			echo esc_html( $l['name'] ) . "\n" . esc_url_raw( $l['url'] ) . "\n\n";
		}
		echo esc_html__( 'These links are personal and expire after 30 days.', 'shelfsage' ) . "\n\n";
		return;
	}

	echo '<h2 style="margin:24px 0 12px;font-size:18px;">' . esc_html__( 'Your e-book downloads', 'shelfsage' ) . '</h2>';
	echo '<ul style="padding:0;margin:0 0 12px 20px;">';
	foreach ( $links as $l ) {
		echo '<li style="margin:0 0 8px;"><a href="' . esc_url( $l['url'] ) . '" style="color:#1d4ed8;text-decoration:underline;">' . esc_html( $l['name'] ) . '</a></li>';
	}
	echo '</ul>';
	echo '<p style="font-size:13px;color:#64748b;margin:0 0 16px;">' . esc_html__( 'These links are personal and expire after 30 days. Do not share them.', 'shelfsage' ) . '</p>';
}
add_action( 'woocommerce_email_after_order_table', 'trsss_ebook_email_inject_links', 20, 4 );

/**
 * Show download counters on the WooCommerce admin order screen so shop
 * managers can see who actually downloaded each e-book.
 *
 * @param WC_Order $order Order object.
 * @return void
 */
function trsss_ebook_render_admin_order_meta( $order ) {
	if ( ! ( $order instanceof WC_Order ) ) {
		return;
	}

	$rows = array();
	foreach ( $order->get_items() as $item ) {
		$product_id = (int) $item->get_product_id();
		if ( ! $product_id ) {
			continue;
		}
		$ebook_url = trim( (string) get_post_meta( $product_id, '_rmss_ebook_url', true ) );
		if ( '' === $ebook_url ) {
			continue;
		}
		$count = (int) $order->get_meta( TRSSS_EBOOK_LOG_META_PREFIX . 'count_' . $product_id );
		$last  = (string) $order->get_meta( TRSSS_EBOOK_LOG_META_PREFIX . 'last_' . $product_id );
		$rows[] = array(
			'name'  => $item->get_name(),
			'count' => $count,
			'last'  => $last,
		);
	}

	if ( empty( $rows ) ) {
		return;
	}

	echo '<h3>' . esc_html__( 'ShelfSage e-book downloads', 'shelfsage' ) . '</h3>';
	echo '<table class="widefat striped" style="margin-top:8px;"><thead><tr><th>' .
		esc_html__( 'Product', 'shelfsage' ) . '</th><th>' .
		esc_html__( 'Downloads', 'shelfsage' ) . '</th><th>' .
		esc_html__( 'Last download', 'shelfsage' ) . '</th></tr></thead><tbody>';
	foreach ( $rows as $r ) {
		echo '<tr><td>' . esc_html( $r['name'] ) . '</td><td>' . (int) $r['count'] . '</td><td>' .
			esc_html( '' === $r['last'] ? '—' : $r['last'] ) . '</td></tr>';
	}
	echo '</tbody></table>';
}
add_action( 'woocommerce_admin_order_data_after_order_details', 'trsss_ebook_render_admin_order_meta', 20 );
