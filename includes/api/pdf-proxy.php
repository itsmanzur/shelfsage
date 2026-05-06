<?php
/**
 * Same-origin proxy for Look Inside PDFs.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Validate that a URL is registered as a Look Inside asset.
 *
 * @param string $url PDF URL.
 * @return bool
 */
function trsss_is_authorized_look_inside_url( $url ) {
	global $wpdb;

	$meta_keys = array( '_rmss_look_inside_url', '_ss_vault_look_inside_url' );
	$placeholders = implode( ',', array_fill( 0, count( $meta_keys ), '%s' ) );

	$query_args = array_merge( $meta_keys, array( $url ) );
	$sql        = $wpdb->prepare(
		"SELECT COUNT(*) FROM {$wpdb->postmeta}
		 WHERE meta_key IN ($placeholders)
		   AND meta_value = %s
		 LIMIT 1",
		$query_args
	);

	return (bool) $wpdb->get_var( $sql );
}

/**
 * Stream a whitelisted remote/local PDF through WordPress so PDF.js can read it
 * without mobile browser download prompts or cross-origin failures.
 *
 * @param WP_REST_Request $request Request.
 * @return void
 */
function trsss_handle_pdf_proxy( WP_REST_Request $request ) {

	$url = esc_url_raw( (string) $request->get_param( 'file' ) );
	if ( empty( $url ) || ! preg_match( '#^https?://#i', $url ) || ! trsss_is_authorized_look_inside_url( $url ) ) {
		status_header( 403 );
		exit;
	}

	$response = wp_safe_remote_get(
		$url,
		array(
			'timeout'             => 20,
			'redirection'         => 3,
			'limit_response_size' => (int) apply_filters( 'trsss_pdf_proxy_max_bytes', 25 * 1024 * 1024 ),
		)
	);

	if ( is_wp_error( $response ) ) {
		status_header( 502 );
		exit;
	}

	$status = (int) wp_remote_retrieve_response_code( $response );
	if ( $status < 200 || $status >= 300 ) {
		status_header( 502 );
		exit;
	}

	$body = wp_remote_retrieve_body( $response );
	if ( '' === $body ) {
		status_header( 404 );
		exit;
	}

	nocache_headers();
	header( 'Content-Type: application/pdf' );
	header( 'Content-Disposition: inline; filename="look-inside.pdf"' );
	header( 'X-Content-Type-Options: nosniff' );
	header( 'Content-Length: ' . strlen( $body ) );
	echo $body; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit;
}
