<?php
/**
 * POST /shelfsage/v1/test-api-connection
 *
 * Body: { "api": "google_books" | "amazon" }
 *
 * Returns:
 *   { ok: true,  latency_ms: 123, message: "..." }
 *   { ok: false, message: "..." }
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * REST callback — route registered in register-rest-routes.php.
 */
function trsss_test_api_connection( WP_REST_Request $request ): WP_REST_Response {
	$params = $request->get_json_params();
	$api    = isset( $params['api'] ) ? sanitize_key( $params['api'] ) : '';

	switch ( $api ) {
		case 'google_books':
			return trsss_test_google_books_connection();
		case 'amazon':
			return trsss_test_amazon_connection();
		default:
			return new WP_REST_Response(
				array( 'ok' => false, 'message' => __( 'Unknown API. Use "google_books" or "amazon".', 'shelfsage' ) ),
				400
			);
	}
}

/**
 * Ping Google Books API with a simple known-ISBN query.
 */
function trsss_test_google_books_connection(): WP_REST_Response {
	$saved   = trsss_get_shelfsage_settings_array();
	$api_key = $saved['google_books_api_key'] ?? '';

	if ( empty( $api_key ) ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => __( 'Google Books API key is not configured.', 'shelfsage' ) ),
			200
		);
	}

	$url      = add_query_arg(
		array( 'q' => 'isbn:9780743273565', 'maxResults' => '1', 'key' => $api_key ),
		'https://www.googleapis.com/books/v1/volumes'
	);
	$t_start  = microtime( true );
	$response = wp_remote_get( $url, array( 'timeout' => 10, 'sslverify' => true ) );
	$latency  = (int) round( ( microtime( true ) - $t_start ) * 1000 );

	if ( is_wp_error( $response ) ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => $response->get_error_message(), 'latency_ms' => $latency ),
			200
		);
	}

	$code = wp_remote_retrieve_response_code( $response );
	$body = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( $code === 400 && isset( $body['error']['status'] ) && $body['error']['status'] === 'INVALID_ARGUMENT' ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => __( 'Invalid API key.', 'shelfsage' ), 'latency_ms' => $latency ),
			200
		);
	}

	if ( $code === 403 ) {
		$msg = $body['error']['message'] ?? __( 'API key rejected (403 Forbidden).', 'shelfsage' );
		return new WP_REST_Response( array( 'ok' => false, 'message' => $msg, 'latency_ms' => $latency ), 200 );
	}

	if ( $code !== 200 ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => sprintf( __( 'Unexpected HTTP %d from Google Books.', 'shelfsage' ), $code ), 'latency_ms' => $latency ),
			200
		);
	}

	$found = ! empty( $body['items'] );
	return new WP_REST_Response(
		array(
			'ok'         => true,
			'latency_ms' => $latency,
			'message'    => $found
				? sprintf( __( 'Connection successful — %d result(s) returned.', 'shelfsage' ), count( $body['items'] ) )
				: __( 'Connected (no results for test ISBN — key is valid).', 'shelfsage' ),
		),
		200
	);
}

/**
 * Ping Amazon PA-API v5 with a minimal SearchItems call.
 */
function trsss_test_amazon_connection(): WP_REST_Response {
	$saved  = trsss_get_shelfsage_settings_array();
	$key    = isset( $saved['amazon_access_key'] )  ? trsss_decrypt_setting_secret( $saved['amazon_access_key'] )  : '';
	$secret = isset( $saved['amazon_secret_key'] )  ? trsss_decrypt_setting_secret( $saved['amazon_secret_key'] )  : '';
	$tag    = $saved['amazon_associate_tag'] ?? '';
	$host   = $saved['amazon_marketplace']   ?? 'www.amazon.com';

	if ( empty( $key ) || empty( $secret ) ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => __( 'Amazon PA-API credentials are not configured.', 'shelfsage' ) ),
			200
		);
	}
	if ( empty( $tag ) ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => __( 'Amazon Associate Tag is missing.', 'shelfsage' ) ),
			200
		);
	}

	$region   = trsss_amazon_region_from_host( $host );
	$service  = 'ProductAdvertisingAPI';
	$endpoint = "https://{$host}/paapi5/searchitems";
	$target   = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';
	$payload  = array(
		'PartnerTag'  => $tag,
		'PartnerType' => 'Associates',
		'Marketplace' => $host,
		'Keywords'    => 'test',
		'SearchIndex' => 'Books',
		'ItemCount'   => 1,
		'Resources'   => array( 'ItemInfo.Title' ),
	);
	$body = wp_json_encode( $payload );

	$datetime = gmdate( 'Ymd\THis\Z' );
	$date     = substr( $datetime, 0, 8 );
	$path     = '/paapi5/searchitems';

	$headers_to_sign = array(
		'content-encoding' => 'amz-1.0',
		'content-type'     => 'application/json; charset=utf-8',
		'host'             => $host,
		'x-amz-date'       => $datetime,
		'x-amz-target'     => $target,
	);
	ksort( $headers_to_sign );

	$canonical_headers  = '';
	$signed_headers_arr = array();
	foreach ( $headers_to_sign as $k => $v ) {
		$canonical_headers   .= $k . ':' . $v . "\n";
		$signed_headers_arr[] = $k;
	}
	$signed_headers = implode( ';', $signed_headers_arr );

	$payload_hash      = hash( 'sha256', $body );
	$canonical_request = implode( "\n", array( 'POST', $path, '', $canonical_headers, $signed_headers, $payload_hash ) );
	$credential_scope  = "{$date}/{$region}/{$service}/aws4_request";
	$string_to_sign    = implode( "\n", array( 'AWS4-HMAC-SHA256', $datetime, $credential_scope, hash( 'sha256', $canonical_request ) ) );
	$signing_key       = trsss_aws_sig4_signing_key( $secret, $date, $region, $service );
	$signature         = hash_hmac( 'sha256', $string_to_sign, $signing_key );
	$auth_header       = "AWS4-HMAC-SHA256 Credential={$key}/{$credential_scope}, SignedHeaders={$signed_headers}, Signature={$signature}";

	$t_start  = microtime( true );
	$response = wp_remote_post( $endpoint, array(
		'timeout' => 12,
		'headers' => array(
			'content-encoding' => 'amz-1.0',
			'content-type'     => 'application/json; charset=utf-8',
			'host'             => $host,
			'x-amz-date'       => $datetime,
			'x-amz-target'     => $target,
			'Authorization'    => $auth_header,
		),
		'body' => $body,
	) );
	$latency = (int) round( ( microtime( true ) - $t_start ) * 1000 );

	if ( is_wp_error( $response ) ) {
		return new WP_REST_Response(
			array( 'ok' => false, 'message' => $response->get_error_message(), 'latency_ms' => $latency ),
			200
		);
	}

	$code = wp_remote_retrieve_response_code( $response );
	$raw  = json_decode( wp_remote_retrieve_body( $response ), true );

	if ( $code === 200 ) {
		$count = count( $raw['SearchResult']['Items'] ?? array() );
		return new WP_REST_Response(
			array(
				'ok'         => true,
				'latency_ms' => $latency,
				'message'    => sprintf( __( 'Connection successful — %d item(s) returned.', 'shelfsage' ), $count ),
			),
			200
		);
	}

	$err_msg = $raw['Errors'][0]['Message'] ?? $raw['Errors'][0]['Code'] ?? sprintf( __( 'HTTP %d from Amazon PA-API.', 'shelfsage' ), $code );

	// Common error codes → human-readable
	$known = array(
		'InvalidAssociate'                 => __( 'Invalid Associate Tag.', 'shelfsage' ),
		'InvalidSignature'                 => __( 'Invalid AWS signature — check your Access Key and Secret Key.', 'shelfsage' ),
		'RequestExpired'                   => __( 'Request expired — check your server clock.', 'shelfsage' ),
		'UnrecognizedClientException'      => __( 'Unrecognized client — Access Key ID may be wrong.', 'shelfsage' ),
		'AccessDeniedException'            => __( 'Access denied — account may not be approved for PA-API yet.', 'shelfsage' ),
		'TooManyRequests'                  => __( 'Rate limited by Amazon. Wait a moment and try again.', 'shelfsage' ),
	);

	$code_str = $raw['Errors'][0]['Code'] ?? '';
	if ( isset( $known[ $code_str ] ) ) {
		$err_msg = $known[ $code_str ];
	}

	return new WP_REST_Response( array( 'ok' => false, 'message' => $err_msg, 'latency_ms' => $latency ), 200 );
}
