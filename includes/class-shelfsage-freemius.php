<?php
/**
 * ShelfSage — Freemius SDK bootstrap.
 *
 * Initializes the Freemius licensing client used by trsss_is_pro() to
 * decide whether the Pro feature files load on each request.
 *
 * SETUP CHECKLIST
 * ----------------
 *   1. Sign in at https://dashboard.freemius.com/ and create a new plugin.
 *   2. Copy the Plugin ID and Public Key from Freemius → Settings → Keys.
 *   3. Paste them below into the `id` and `public_key` slots.
 *   4. Flip `is_live` to false while testing in your local Freemius sandbox.
 *
 * IMPORTANT: Until real credentials are pasted in, shelfsage_fs() returns a
 * stub object whose can_use_premium_code__premium_only() resolves to false,
 * so trsss_is_pro() defaults to false and every Pro file stays gated.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! function_exists( 'shelfsage_fs' ) ) {

	/**
	 * Lazy-init Freemius SDK and return the client (or a stub when not configured).
	 *
	 * @return Freemius|object Freemius client, or a stub exposing
	 *                        can_use_premium_code__premium_only(): bool.
	 */
	function shelfsage_fs() {
		global $shelfsage_fs;

		if ( isset( $shelfsage_fs ) ) {
			return $shelfsage_fs;
		}

		$plugin_id  = '0';                            // TODO: replace with the numeric Plugin ID from Freemius dashboard.
		$public_key = 'pk_PASTE_FREEMIUS_PUBLIC_KEY'; // TODO: replace with the public key (starts with `pk_`).

		$is_configured = ( $plugin_id !== '0' && strpos( $public_key, 'pk_PASTE' ) !== 0 );

		if ( ! $is_configured ) {
			$shelfsage_fs = new ShelfSage_Freemius_Stub();
			return $shelfsage_fs;
		}

		$sdk_start = TRSSS_PATH . 'includes/freemius/start.php';
		if ( ! file_exists( $sdk_start ) ) {
			$shelfsage_fs = new ShelfSage_Freemius_Stub();
			return $shelfsage_fs;
		}

		require_once $sdk_start;

		$shelfsage_fs = fs_dynamic_init( array(
			'id'             => $plugin_id,
			'slug'           => 'shelfsage',
			'type'           => 'plugin',
			'public_key'     => $public_key,
			'is_premium'     => false,
			'has_addons'     => false,
			'has_paid_plans' => true,
			'menu'           => array(
				'slug'    => 'shelfsage',
				'account' => true,
				'support' => false,
			),
			'is_live'        => true,
		) );

		return $shelfsage_fs;
	}
}

if ( ! class_exists( 'ShelfSage_Freemius_Stub' ) ) {

	/**
	 * Minimal stub used until real Freemius credentials are configured.
	 *
	 * Mirrors the small subset of the Freemius API that ShelfSage calls
	 * during normal request handling. Always reports the site as
	 * non-premium so Pro feature files stay gated.
	 */
	class ShelfSage_Freemius_Stub {

		/**
		 * @return bool
		 */
		public function can_use_premium_code__premium_only() {
			return false;
		}

		/**
		 * @return bool
		 */
		public function can_use_premium_code() {
			return false;
		}

		/**
		 * @return bool
		 */
		public function is_premium() {
			return false;
		}

		/**
		 * @return bool
		 */
		public function is_paying() {
			return false;
		}

		/**
		 * @return bool
		 */
		public function is_registered() {
			return false;
		}

		/**
		 * Catch-all for any other Freemius API call ShelfSage might add later
		 * before credentials are configured. Always returns false / null safely.
		 *
		 * @param string $name      Method name.
		 * @param array  $arguments Method arguments.
		 * @return mixed
		 */
		public function __call( $name, $arguments ) {
			unset( $arguments );
			if ( 0 === strpos( $name, 'is_' ) || 0 === strpos( $name, 'can_' ) || 0 === strpos( $name, 'has_' ) ) {
				return false;
			}
			return null;
		}
	}
}

shelfsage_fs();
