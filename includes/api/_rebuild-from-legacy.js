'use strict';
const fs = require( 'fs' );
const path = require( 'path' );
const legacyPath = path.join( __dirname, '..', 'api-legacy-monolith.pre-section2.php' );
const lines = fs.readFileSync( legacyPath, 'utf8' ).split( /\r?\n/ );

/**
 * @param {number} firstLine 1-based inclusive
 * @param {number} lastLine 1-based inclusive
 */
function sliceLines( firstLine, lastLine ) {
	return lines.slice( firstLine - 1, lastLine ).join( '\n' );
}

function writeModule( file, firstLine, lastLine, desc ) {
	const chunk = sliceLines( firstLine, lastLine );
	const out =
		`<?php
/**
 * ${ desc }
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

` +
		chunk +
		'\n';
	fs.writeFileSync( path.join( __dirname, file ), out );
}

writeModule( 'shortcodes-cpt-crud.php', 355, 520, 'Shortcode CPT + REST CRUD (split from legacy api.php).' );
writeModule( 'amazon-google-clear.php', 523, 929, 'Clear API cache, Amazon PA-API, Google Books helpers (split from legacy api.php).' );
writeModule( 'onboarding-demo-legacy.php', 933, 1108, 'Onboarding, demo import, legacy shortcode helpers (split from legacy api.php).' );
writeModule( 'search-filters-related-products-tax.php', 1112, 1618, 'Public search/filters/related + admin product/taxonomy REST (split from legacy api.php).' );
writeModule( 'products-create-stock.php', 1704, 1821, 'Create product from ISBN + stock update (split from legacy api.php).' );
writeModule( 'ajax-search-invalidate.php', 1623, 1702, 'Admin product search AJAX + filters cache invalidation (split from legacy api.php).' );
writeModule( 'register-rest-routes.php', 9, 118, 'REST route registration (split from legacy api.php).' );
