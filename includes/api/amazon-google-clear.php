<?php
/**
 * Clear API cache, Amazon PA-API, Google Books helpers (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Clear all ShelfSage API transients (Google Books, Amazon).
 */
function trsss_clear_api_cache() {
    global $wpdb;

    // Delete all transients with our plugin prefix using prepared statements.
    $wpdb->query(
        $wpdb->prepare(
            "DELETE FROM {$wpdb->options}
             WHERE option_name LIKE %s
                OR option_name LIKE %s
                OR option_name LIKE %s
                OR option_name LIKE %s",
            $wpdb->esc_like( '_transient_trsss_' ) . '%',
            $wpdb->esc_like( '_transient_timeout_trsss_' ) . '%',
            $wpdb->esc_like( '_transient_rmss_' ) . '%',
            $wpdb->esc_like( '_transient_timeout_rmss_' ) . '%'
        )
    );

    if ( function_exists( 'wp_cache_flush_group' ) && function_exists( 'trsss_book_api_cache_group' ) ) {
        wp_cache_flush_group( trsss_book_api_cache_group() );
    }

    return rest_ensure_response( array( 'success' => true, 'message' => 'API cache cleared.' ) );
}


/**
 * Amazon PA-API v5 Proxy with AWS Signature v4
 * Body: { query: string, search_type: 'asin'|'keywords' }
 */
function trsss_amazon_search( WP_REST_Request $request ) {
    $saved    = trsss_get_shelfsage_settings_array();
    $key      = isset( $saved['amazon_access_key'] ) ? trsss_decrypt_setting_secret( $saved['amazon_access_key'] ) : '';
    $secret   = isset( $saved['amazon_secret_key'] ) ? trsss_decrypt_setting_secret( $saved['amazon_secret_key'] ) : '';
    $tag      = $saved['amazon_associate_tag'] ?? '';
    $host     = $saved['amazon_marketplace']   ?? 'www.amazon.com';

    if ( ! $key || ! $secret || ! $tag ) {
        return new WP_Error( 'amazon_not_configured',
            'Amazon PA-API credentials are not configured in Settings → Affiliates.',
            array( 'status' => 400 ) );
    }

    $params      = $request->get_json_params();
    $query       = sanitize_text_field( $params['query'] ?? '' );
    $search_type = sanitize_text_field( $params['search_type'] ?? 'keywords' );

    if ( empty( $query ) ) {
        return new WP_Error( 'missing_query', 'Search query is required.', array( 'status' => 422 ) );
    }

    // ── Build PA-API v5 payload ──────────────────────────────────────────────
    $region   = trsss_amazon_region_from_host( $host );
    $service  = 'ProductAdvertisingAPI';
    $endpoint = "https://{$host}/paapi5/searchitems";
    $target   = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems';
    $payload  = array(
        'PartnerTag'  => $tag,
        'PartnerType' => 'Associates',
        'Marketplace' => $host,
        'Resources'   => array(
            'Images.Primary.Large',
            'ItemInfo.Title',
            'ItemInfo.ByLineInfo',
            'ItemInfo.ContentInfo',
            'ItemInfo.ExternalIds',
            'ItemInfo.Features',
            'Offers.Listings.Price',
        ),
    );

    if ( $search_type === 'asin' ) {
        $endpoint = "https://{$host}/paapi5/getitems";
        $target   = 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.GetItems';
        $payload['ItemIds']    = array_map( 'trim', explode( ',', $query ) );
        $payload['IdType']     = 'ASIN';
    } else {
        $payload['Keywords']    = $query;
        $payload['SearchIndex'] = 'Books';
        $payload['ItemCount']   = 10;
    }

    $body = wp_json_encode( $payload );

    // ── AWS Signature v4 ──────────────────────────────────────────────────────
    $datetime  = gmdate( 'Ymd\THis\Z' );
    $date      = substr( $datetime, 0, 8 );
    $path      = ( $search_type === 'asin' ) ? '/paapi5/getitems' : '/paapi5/searchitems';

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

    $payload_hash = hash( 'sha256', $body );
    $canonical_request = implode( "\n", array(
        'POST',
        $path,
        '',                        // query string
        $canonical_headers,
        $signed_headers,
        $payload_hash,
    ) );

    $credential_scope = "{$date}/{$region}/{$service}/aws4_request";
    $string_to_sign   = implode( "\n", array(
        'AWS4-HMAC-SHA256',
        $datetime,
        $credential_scope,
        hash( 'sha256', $canonical_request ),
    ) );

    $signing_key  = trsss_aws_sig4_signing_key( $secret, $date, $region, $service );
    $signature    = hash_hmac( 'sha256', $string_to_sign, $signing_key );
    $auth_header  = "AWS4-HMAC-SHA256 "
                  . "Credential={$key}/{$credential_scope}, "
                  . "SignedHeaders={$signed_headers}, "
                  . "Signature={$signature}";

    // ── Send request ──────────────────────────────────────────────────────────
    $response = wp_remote_post( $endpoint, array(
        'timeout' => 15,
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

    if ( is_wp_error( $response ) ) {
        return new WP_Error( 'amazon_api_error', $response->get_error_message(), array( 'status' => 502 ) );
    }

    $code = wp_remote_retrieve_response_code( $response );
    $raw  = json_decode( wp_remote_retrieve_body( $response ), true );

    if ( $code !== 200 ) {
        $msg = $raw['Errors'][0]['Message'] ?? 'Amazon API error.';
        return new WP_Error( 'amazon_api_error', $msg, array( 'status' => $code ) );
    }

    $force_refresh = ! empty( $params['force_refresh'] );

    // ── Normalise response ────────────────────────────────────────────────────
    $items_raw = ( $search_type === 'asin' )
        ? ( $raw['ItemsResult']['Items'] ?? array() )
        : ( $raw['SearchResult']['Items'] ?? array() );

    $results = array();
    foreach ( $items_raw as $item ) {
        $results[] = trsss_fetch_book_metadata_with_fallback( $item, $tag, $host, $force_refresh );
    }

    return rest_ensure_response( $results );
}

/**
 * Build AWS Signature v4 signing key
 */
function trsss_aws_sig4_signing_key( string $secret, string $date, string $region, string $service ): string {
    $k_date    = hash_hmac( 'sha256', $date,            'AWS4' . $secret, true );
    $k_region  = hash_hmac( 'sha256', $region,          $k_date,          true );
    $k_service = hash_hmac( 'sha256', $service,         $k_region,        true );
    return       hash_hmac( 'sha256', 'aws4_request',   $k_service,       true );
}

/**
 * Map Amazon host to AWS region
 */
function trsss_amazon_region_from_host( string $host ): string {
    $map = array(
        'www.amazon.co.jp'  => 'us-east-1', // Japan PA-API is still us-east-1
        'www.amazon.co.uk'  => 'eu-west-1',
        'www.amazon.de'     => 'eu-west-1',
        'www.amazon.fr'     => 'eu-west-1',
        'www.amazon.it'     => 'eu-west-1',
        'www.amazon.es'     => 'eu-west-1',
        'www.amazon.com.au' => 'us-west-2',
        'www.amazon.in'     => 'us-east-1',
        'www.amazon.com.br' => 'us-east-1',
        'www.amazon.ca'     => 'us-east-1',
        'www.amazon.com.mx' => 'us-east-1',
    );
    return $map[ $host ] ?? 'us-east-1';
}

/**
 * Merge Amazon + Google Books data for a single PA-API item.
 *
 * - Checks a 24-hour merged transient first (trsss_merged_{asin}).
 * - If smart_fallback_enabled is ON and Amazon is missing image/description,
 *   hits Google Books by ISBN and fills the gaps.
 * - Marks enriched items with enriched_by = 'google_books'.
 *
 * @param array  $item Amazon PA-API item array.
 * @param string $tag  Associate tag (for affiliate URLs).
 * @param string $host Amazon marketplace host.
 * @return array Normalised book data.
 */
function trsss_fetch_book_metadata_with_fallback( array $item, string $tag, string $host, bool $force_refresh = false ): array {
    $asin        = $item['ASIN'] ?? '';
    $cache_key   = 'trsss_merged_' . md5( $asin . $tag );

    if ( $force_refresh ) {
        trsss_book_api_cache_delete( $cache_key );
    }

    // ── 1. Return cached merged result if available ───────────────────────────
    $cached = trsss_book_api_cache_get( $cache_key );
    if ( false !== $cached ) {
        return $cached;
    }

    // ── 2. Extract Amazon fields ─────────────────────────────────────────────
    $title      = $item['ItemInfo']['Title']['DisplayValue'] ?? '';
    $authors    = implode( ', ', array_column(
        array_filter(
            $item['ItemInfo']['ByLineInfo']['Contributors'] ?? array(),
            fn( $c ) => ( $c['RoleType'] ?? '' ) === 'author'
        ),
        'Name'
    ) );
    $image      = $item['Images']['Primary']['Large']['URL'] ?? '';
    $price_raw  = $item['Offers']['Listings'][0]['Price']['Amount'] ?? null;
    $currency   = $item['Offers']['Listings'][0]['Price']['Currency'] ?? 'USD';
    $price      = $price_raw !== null ? number_format( (float) $price_raw, 2 ) . ' ' . $currency : '';
    $affiliate_url = "https://{$host}/dp/{$asin}?tag={$tag}";
    $description = implode( ' ', $item['ItemInfo']['Features']['DisplayValues'] ?? array() );

    // Pull ISBN-13 from PA-API ExternalIds (if available)
    $isbns       = $item['ItemInfo']['ExternalIds']['ISBNs']['DisplayValues'] ?? array();
    $isbn        = '';
    foreach ( $isbns as $candidate ) {
        if ( strlen( $candidate ) === 13 ) {
            $isbn = $candidate;
            break;
        }
    }
    // Fall back to ISBN-10 if no ISBN-13 found
    if ( empty( $isbn ) && ! empty( $isbns ) ) {
        $isbn = $isbns[0];
    }

    $enriched_by = '';

    // ── 3. Smart Fallback ─────────────────────────────────────────────────────
    $saved_settings      = trsss_get_shelfsage_settings_array();
    $fallback_enabled    = ! empty( $saved_settings['smart_fallback_enabled'] );
    $needs_image         = empty( $image );
    $needs_description   = empty( $description );

    if ( $fallback_enabled && ( $needs_image || $needs_description ) && ( ! empty( $isbn ) || ! empty( $title ) ) ) {
        // Use ISBN for lookup if available, otherwise fall back to title
        $gb = ! empty( $isbn )
            ? trsss_fetch_google_books_by_isbn( $isbn )
            : trsss_fetch_google_books_by_title( $title );

        if ( $gb['found'] ) {
            if ( $needs_image && ! empty( $gb['image'] ) ) {
                $image       = $gb['image'];
                $enriched_by = 'google_books';
            }
            if ( $needs_description && ! empty( $gb['description'] ) ) {
                $description = $gb['description'];
                $enriched_by = 'google_books';
            }
        }
    }

    $result = array(
        'asin'        => $asin,
        'title'       => $title,
        'author'      => $authors,
        'image'       => $image,
        'price'       => $price,
        'affiliate_url' => $affiliate_url,
        'summary'     => $description,
        'source'      => 'amazon',
        'enriched_by' => $enriched_by,
    );

    // ── 4. Cache the merged result for 24 hours ───────────────────────────────
    trsss_book_api_cache_set( $cache_key, $result, 24 * HOUR_IN_SECONDS );

    return $result;
}

/**
 * Fetch Google Books volume info by ISBN.
 * Caches result in a 12-hour transient (trsss_gb_{isbn}).
 *
 * @param string $isbn ISBN-10 or ISBN-13.
 * @return array { description, image, pages, found }
 */
function trsss_fetch_google_books_by_isbn( string $isbn ): array {
    $cache_key = 'trsss_gb_' . md5( $isbn );
    $cached    = trsss_book_api_cache_get( $cache_key );
    if ( false !== $cached ) {
        return $cached;
    }

    $saved    = trsss_get_shelfsage_settings_array();
    $api_key  = $saved['google_books_api_key'] ?? '';
    $url      = 'https://www.googleapis.com/books/v1/volumes?q=isbn:' . urlencode( $isbn ) . '&maxResults=1';
    if ( $api_key ) {
        $url .= '&key=' . urlencode( $api_key );
    }

    $response = wp_remote_get( $url, array( 'timeout' => 8 ) );
    $empty    = array( 'description' => '', 'image' => '', 'pages' => 0, 'found' => false );

    if ( is_wp_error( $response ) ) {
        return $empty;
    }

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    $info = $data['items'][0]['volumeInfo'] ?? null;

    if ( ! $info ) {
        trsss_book_api_cache_set( $cache_key, $empty, 12 * HOUR_IN_SECONDS );
        return $empty;
    }

    // Prefer the largest available thumbnail
    $image_links = $info['imageLinks'] ?? array();
    $image = $image_links['extraLarge']
          ?? $image_links['large']
          ?? $image_links['medium']
          ?? $image_links['thumbnail']
          ?? '';
    // Force HTTPS
    $image = $image ? preg_replace( '/^http:\/\//i', 'https://', $image ) : '';

    $result = array(
        'description' => $info['description'] ?? '',
        'image'       => $image,
        'pages'       => (int) ( $info['pageCount'] ?? 0 ),
        'found'       => true,
    );

    trsss_book_api_cache_set( $cache_key, $result, 12 * HOUR_IN_SECONDS );
    return $result;
}

/**
 * Fetch Google Books volume info by title (less precise — used when no ISBN available).
 * Thin wrapper around the ISBN function's shape, without caching by title (results vary).
 *
 * @param string $title Book title.
 * @return array { description, image, pages, found }
 */
function trsss_fetch_google_books_by_title( string $title ): array {
    if ( empty( $title ) ) {
        return array( 'description' => '', 'image' => '', 'pages' => 0, 'found' => false );
    }

    $saved   = trsss_get_shelfsage_settings_array();
    $api_key = $saved['google_books_api_key'] ?? '';
    $url     = 'https://www.googleapis.com/books/v1/volumes?q=' . urlencode( $title ) . '&maxResults=1';
    if ( $api_key ) {
        $url .= '&key=' . urlencode( $api_key );
    }

    $response = wp_remote_get( $url, array( 'timeout' => 8 ) );
    $empty    = array( 'description' => '', 'image' => '', 'pages' => 0, 'found' => false );

    if ( is_wp_error( $response ) ) return $empty;

    $data = json_decode( wp_remote_retrieve_body( $response ), true );
    $info = $data['items'][0]['volumeInfo'] ?? null;
    if ( ! $info ) return $empty;

    $image_links = $info['imageLinks'] ?? array();
    $image = $image_links['extraLarge'] ?? $image_links['large'] ?? $image_links['medium'] ?? $image_links['thumbnail'] ?? '';
    $image = $image ? preg_replace( '/^http:\/\//i', 'https://', $image ) : '';

    return array(
        'description' => $info['description'] ?? '',
        'image'       => $image,
        'pages'       => (int) ( $info['pageCount'] ?? 0 ),
        'found'       => true,
    );
}

/**
 * Backward-compat wrapper (still used if called directly from old code).
 *
 * @deprecated Use trsss_fetch_google_books_by_title() instead.
 */
function trsss_google_books_description( string $title ): string {
    return trsss_fetch_google_books_by_title( $title )['description'];
}
