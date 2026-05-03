'use strict';
const fs = require( 'fs' );
const legacy = fs.readFileSync( __dirname + '/../api-legacy-monolith.pre-section2.php', 'utf8' ).split( /\r?\n/ );
const chunk = legacy.slice( 325, 353 ).join( '\n' );
const out =
	`<?php
/**
 * Architect: proxy product/taxonomy lists to admin-ajax when REST is blocked (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

` +
	chunk +
	'\n';
fs.writeFileSync( __dirname + '/ajax-architect-proxy.php', out );
