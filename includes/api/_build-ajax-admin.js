'use strict';
const fs = require( 'fs' );
const legacyPath = __dirname + '/../api-legacy-monolith.pre-section2.php';
const legacy = fs.readFileSync( legacyPath, 'utf8' ).split( /\r?\n/ );
// Legacy lines 120–241 (amazon + AJAX fallbacks, excludes rest_api_init line 118)
const chunk = legacy.slice( 119, 241 ).join( '\n' );
const out =
	`<?php
/**
 * ShelfSage admin-ajax REST fallbacks (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

` +
	chunk +
	'\n';
fs.writeFileSync( __dirname + '/ajax-admin-fallbacks.php', out );
