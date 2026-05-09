<?php
/**
 * ShelfSage REST routes, public search, Amazon/Google helpers, and admin-ajax fallbacks.
 * Split into includes/api/* (Section 2 architecture — see shelfsage-audit-report.md).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

require_once __DIR__ . '/api/rest-cors-rate.php';
require_once __DIR__ . '/api/shortcodes-cpt-crud.php';
require_once __DIR__ . '/api-book-api-cache.php';
require_once __DIR__ . '/api/amazon-google-clear.php';
require_once __DIR__ . '/api/test-api-connection.php';
require_once __DIR__ . '/api/onboarding-demo-legacy.php';
require_once __DIR__ . '/api/search-filters-related-products-tax.php';
require_once __DIR__ . '/api/products-create-stock.php';
require_once __DIR__ . '/api/ajax-search-invalidate.php';
require_once __DIR__ . '/api/ajax-admin-fallbacks.php';
require_once __DIR__ . '/api/ajax-architect-proxy.php';
require_once __DIR__ . '/api/pdf-proxy.php';

// Pro REST routes — gated by Freemius license. Free users get a 403 from
// the Pro-only callbacks because the routes themselves are not registered.
if ( function_exists( 'trsss_is_pro' ) && trsss_is_pro() ) {
	require_once __DIR__ . '/api/import-books.php';
	require_once __DIR__ . '/api/reading-lists.php';
}

require_once __DIR__ . '/api/register-rest-routes.php';
