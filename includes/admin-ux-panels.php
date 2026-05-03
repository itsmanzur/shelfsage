<?php
/**
 * Section 6 style UX helpers: WP-rendered dashboard health + Settings maintenance tools
 * (no React rebuild required).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * One row inside the ShelfSage dashboard health snapshot.
 *
 * @param string $label       Label text.
 * @param bool   $ok          Pass/fail.
 * @param string $detail_html Optional detail HTML (typically run through wp_kses_post by caller).
 */
function trsss_admin_health_row( $label, $ok, $detail_html = '' ) {
	echo '<div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin:8px 0;padding:8px 0;border-bottom:1px solid #e5e7eb;">';
	echo '<span style="font-weight:600;">' . esc_html( $label ) . '</span>';
	echo '<span style="color:' . ( $ok ? '#047857' : '#b45309' ) . ';font-weight:600;">'
		. esc_html( $ok ? __( 'OK', 'shelfsage' ) : __( 'Attention', 'shelfsage' ) ) . '</span>';
	echo '</div>';
	if ( '' !== $detail_html ) {
		echo '<div class="description" style="margin:-4px 0 8px;padding-left:0;">' . wp_kses_post( $detail_html ) . '</div>';
	}
}

/**
 * Dashboard banner: WooCommerce, transients, Google/Amazon readiness.
 *
 * add_filter( 'trsss_show_dashboard_health_banner', '__return_false' ) to hide.
 */
function trsss_render_dashboard_health_banner() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( ! apply_filters( 'trsss_show_dashboard_health_banner', true ) ) {
		return;
	}

	$wc_ok = class_exists( 'WooCommerce', false );

	$ping_key = 'trsss_health_ping_' . wp_generate_password( 8, false, false );
	$ping_ok  = false;
	set_transient( $ping_key, '1', 30 );
	if ( get_transient( $ping_key ) === '1' ) {
		$ping_ok = true;
	}
	delete_transient( $ping_key );

	if ( function_exists( 'trsss_get_shelfsage_settings_array' ) ) {
		$settings = trsss_get_shelfsage_settings_array();
	} else {
		$settings = array();
	}

	$google_ok = ! empty( trim( (string) ( $settings['google_books_api_key'] ?? '' ) ) );
	$amazon_ok = ! empty( trim( (string) ( $settings['amazon_access_key'] ?? '' ) ) )
		&& ! empty( trim( (string) ( $settings['amazon_secret_key'] ?? '' ) ) )
		&& ! empty( trim( (string) ( $settings['amazon_associate_tag'] ?? '' ) ) );

	$rest_base = esc_url_raw( untrailingslashit( rest_url( 'shelfsage/v1' ) ) );
	$rest_link = sprintf(
		'<a href="%1$s">%2$s</a>',
		esc_url( $rest_base ),
		esc_html( $rest_base )
	);

	$integrations_intro = wp_kses_post(
		sprintf(
			/* translators: 1 ShelfSage REST base URL (markup) */
			__( 'ShelfSage REST base: %s', 'shelfsage' ),
			$rest_link
		)
	);
	$integrations_detail = $integrations_intro . '<br/>' . esc_html(
		sprintf(
			__(
				'Google Books key: %1$s · Amazon PA (access + secret + Associate tag): %2$s',
				'shelfsage'
			),
			$google_ok ? __( 'configured', 'shelfsage' ) : __( 'missing', 'shelfsage' ),
			$amazon_ok ? __( 'configured', 'shelfsage' ) : __( 'incomplete or missing', 'shelfsage' )
		)
	);

	echo '<div class="postbox" style="max-width:none;margin:0 0 16px 0;"><div class="inside" style="padding:12px 16px;margin:0;">';
	echo '<p style="margin:0 0 12px;"><strong>' . esc_html__( 'ShelfSage · Site health snapshot', 'shelfsage' ) . '</strong></p>';

	trsss_admin_health_row( __( 'WooCommerce active', 'shelfsage' ), $wc_ok );
	trsss_admin_health_row( __( 'Database transients writable', 'shelfsage' ), $ping_ok );
	trsss_admin_health_row( __( 'API integrations', 'shelfsage' ), ( $google_ok || $amazon_ok ), $integrations_detail );

	echo '</div></div>';
}

/**
 * Maintenance tools on Settings (matches shelfsage.php bulk repair action + nonce).
 *
 * add_filter( 'trsss_show_settings_maintenance_tools', '__return_false' ) to hide.
 */
function trsss_render_settings_maintenance_tools() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	if ( ! apply_filters( 'trsss_show_settings_maintenance_tools', true ) ) {
		return;
	}

	$repair_action = 'trsss_repair_product_slugs';
	$repair_url    = wp_nonce_url(
		add_query_arg( 'action', $repair_action, admin_url() ),
		$repair_action
	);

	/**
	 * Nonce/action must mirror trsss_bulk_repair_product_slugs() (shelfsage.php).
	 */
	// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON string for JS only.
	$confirm_js = wp_json_encode(
		__(
			'Run bulk slug and title repair for all WooCommerce products? This cannot be automatically undone.',
			'shelfsage'
		)
	);

	?>
	<div class="postbox" style="max-width:none;margin-top:28px;">
		<div class="postbox-header"><h2 class="hndle"><?php esc_html_e( 'Maintenance tools', 'shelfsage' ); ?></h2></div>
		<div class="inside">
			<p><?php esc_html_e( 'These actions update WooCommerce product posts in bulk. Only continue if you intend to mutate live data.', 'shelfsage' ); ?></p>
			<p>
				<strong><?php esc_html_e( 'Repair book slugs & titles', 'shelfsage' ); ?></strong><br/>
				<span class="description"><?php esc_html_e( 'Fix mojibake titles and rebuild Unicode-safe slugs for published/draft products.', 'shelfsage' ); ?></span>
			</p>
			<p style="margin-top:12px;">
				<a
					class="button button-secondary"
					href="<?php echo esc_url( $repair_url ); ?>"
					onclick='return confirm( <?php echo $confirm_js; ?> );'
				>
					<?php esc_html_e( 'Run product slug & title repair…', 'shelfsage' ); ?>
				</a>
			</p>
		</div>
	</div>
	<?php
}
