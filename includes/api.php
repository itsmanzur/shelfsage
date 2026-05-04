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
require_once __DIR__ . '/api/register-rest-routes.php';
