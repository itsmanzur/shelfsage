<?php
/**
 * ShelfSage — non-intrusive Pro upgrade prompts.
 *
 * Loaded BEFORE any Pro feature file so the helpers are always available
 * (free admin screens use trsss_pro_badge() to render a small "PRO" pill
 * next to gated controls without breaking layout for licensed users).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'trsss_pro_upgrade_url' ) ) {

	/**
	 * Build the canonical upgrade URL with a UTM campaign tag.
	 *
	 * @param string $campaign UTM campaign tag (e.g. 'analytics', 'reading_list').
	 * @return string
	 */
	function trsss_pro_upgrade_url( $campaign = 'generic' ) {
		$campaign = sanitize_key( (string) $campaign );
		if ( $campaign === '' ) {
			$campaign = 'generic';
		}

		return 'https://shelfsage.com/pro?utm_source=plugin&utm_campaign=' . rawurlencode( $campaign );
	}
}

if ( ! function_exists( 'trsss_pro_badge' ) ) {

	/**
	 * Echo a small "PRO" badge linking to the upgrade page.
	 *
	 * Silently no-ops for licensed sites (trsss_is_pro() === true) so the
	 * admin UI is clean once the user upgrades.
	 *
	 * @param string $feature Optional UTM campaign / feature slug.
	 * @return void
	 */
	function trsss_pro_badge( $feature = '' ) {
		if ( function_exists( 'trsss_is_pro' ) && trsss_is_pro() ) {
			return;
		}

		printf(
			'<a href="%s" target="_blank" rel="noopener noreferrer" class="trsss-pro-badge" title="%s">%s</a>',
			esc_url( trsss_pro_upgrade_url( $feature ) ),
			esc_attr__( 'Available in ShelfSage Pro', 'shelfsage' ),
			esc_html__( 'PRO', 'shelfsage' )
		);
	}
}

if ( ! function_exists( 'trsss_pro_badge_styles' ) ) {

	/**
	 * Print minimal inline CSS for .trsss-pro-badge once per admin request.
	 * Hook fires on `admin_head` so the badge looks polished wherever
	 * trsss_pro_badge() is rendered (Settings, meta boxes, list-table rows).
	 *
	 * @return void
	 */
	function trsss_pro_badge_styles() {
		static $printed = false;
		if ( $printed ) {
			return;
		}
		$printed = true;
		?>
<style id="trsss-pro-badge-css">
.trsss-pro-badge{display:inline-block;padding:2px 8px;margin-left:6px;font-size:10px;font-weight:700;line-height:1.4;letter-spacing:0.04em;text-transform:uppercase;color:#fff;background:linear-gradient(135deg,#7c3aed 0%,#ec4899 100%);border-radius:9999px;text-decoration:none!important;vertical-align:middle;box-shadow:0 1px 2px rgba(124,58,237,0.25)}
.trsss-pro-badge:hover{transform:translateY(-1px);box-shadow:0 2px 6px rgba(124,58,237,0.35);color:#fff}
.trsss-pro-badge:focus{outline:2px solid #7c3aed;outline-offset:2px;color:#fff}
</style>
		<?php
	}
	add_action( 'admin_head', 'trsss_pro_badge_styles' );
}
