<?php
/**
 * Encrypt/decrypt ShelfSage-stored secrets (Amazon API keys, etc.).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! defined( 'TRSSS_CRED_PREFIX' ) ) {
	define( 'TRSSS_CRED_PREFIX', 'ss1:' );
}

/**
 * Derived 32-byte key for openssl (ties blob to wp-config salts).
 *
 * @return string
 */
function trsss_credential_store_bin_key() {
	if ( defined( 'LOGGED_IN_KEY' ) && LOGGED_IN_KEY !== '' ) {
		return substr( hash( 'sha256', LOGGED_IN_KEY . '|shelfsage-creds', true ), 0, 32 );
	}
	if ( defined( 'AUTH_KEY' ) && AUTH_KEY !== '' ) {
		return substr( hash( 'sha256', AUTH_KEY . '|shelfsage-creds', true ), 0, 32 );
	}
	return substr( hash( 'sha256', wp_salt( 'auth' ) . '|shelfsage-creds', true ), 0, 32 );
}

/**
 * Encrypt a single setting value for storage. Falls back to plain when OpenSSL is unavailable.
 *
 * @param string $plain Plain text.
 * @return string
 */
function trsss_encrypt_setting_secret( $plain ) {
	if ( ! is_string( $plain ) || $plain === '' ) {
		return '';
	}
	if ( ! function_exists( 'openssl_encrypt' ) || ! function_exists( 'openssl_cipher_iv_length' ) ) {
		return $plain;
	}
	$ivlen = openssl_cipher_iv_length( 'aes-256-cbc' );
	if ( ! $ivlen ) {
		return $plain;
	}
	$iv = function_exists( 'random_bytes' )
		? random_bytes( $ivlen )
		: openssl_random_pseudo_bytes( $ivlen );
	if ( ! is_string( $iv ) || strlen( $iv ) !== $ivlen ) {
		return $plain;
	}
	$raw = openssl_encrypt( $plain, 'aes-256-cbc', trsss_credential_store_bin_key(), OPENSSL_RAW_DATA, $iv );
	if ( $raw === false ) {
		return $plain;
	}
	return TRSSS_CRED_PREFIX . base64_encode( $iv . $raw );
}

/**
 * Decrypt a stored value, or return legacy/plain strings unchanged.
 *
 * @param string $stored Value from the options table.
 * @return string
 */
function trsss_decrypt_setting_secret( $stored ) {
	if ( ! is_string( $stored ) || $stored === '' ) {
		return '';
	}
	if ( strpos( $stored, TRSSS_CRED_PREFIX ) !== 0 ) {
		return $stored;
	}
	if ( ! function_exists( 'openssl_decrypt' ) || ! function_exists( 'openssl_cipher_iv_length' ) ) {
		return '';
	}
	$blob = base64_decode( substr( $stored, strlen( TRSSS_CRED_PREFIX ) ), true );
	if ( ! is_string( $blob ) || $blob === '' ) {
		return '';
	}
	$ivlen = openssl_cipher_iv_length( 'aes-256-cbc' );
	if ( ! $ivlen || strlen( $blob ) <= $ivlen ) {
		return '';
	}
	$iv = substr( $blob, 0, $ivlen );
	$ct = substr( $blob, $ivlen );
	$plain = openssl_decrypt( $ct, 'aes-256-cbc', trsss_credential_store_bin_key(), OPENSSL_RAW_DATA, $iv );
	return ( false !== $plain ) ? $plain : '';
}

/**
 * One-time migration: encrypt previously plain Amazon keys in the options array.
 */
function trsss_maybe_encrypt_stored_amazon_keys() {
	if ( get_option( 'trsss_amazon_cred_migrated_v1', false ) ) {
		return;
	}
	$option_name = TRSSS_OPTION_SETTINGS;
	$s           = get_option( $option_name, array() );
	if ( ! is_array( $s ) ) {
		update_option( 'trsss_amazon_cred_migrated_v1', true );
		return;
	}
	$changed = false;
	foreach ( array( 'amazon_access_key', 'amazon_secret_key' ) as $k ) {
		if ( empty( $s[ $k ] ) || ! is_string( $s[ $k ] ) ) {
			continue;
		}
		if ( strpos( $s[ $k ], TRSSS_CRED_PREFIX ) === 0 ) {
			continue;
		}
		$enc         = trsss_encrypt_setting_secret( $s[ $k ] );
		$s[ $k ]     = $enc;
		$changed     = true;
	}
	if ( $changed ) {
		update_option( $option_name, $s );
	}
	update_option( 'trsss_amazon_cred_migrated_v1', true );
}
add_action( 'admin_init', 'trsss_maybe_encrypt_stored_amazon_keys', 5 );
