<?php
/**
 * ShelfSage audiobook preview player.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Get the audiobook/sample URL for a product.
 *
 * @param int $product_id Product ID.
 * @return string
 */
function trsss_audio_preview_get_url( $product_id ) {
	$url = get_post_meta( $product_id, '_rmss_audio_url', true );
	return $url ? esc_url_raw( $url ) : '';
}

/**
 * Render audiobook preview player markup.
 *
 * @param int $product_id Product ID.
 * @return string
 */
function trsss_audio_preview_render( $product_id ) {
	$product_id = absint( $product_id );
	if ( ! $product_id || 'product' !== get_post_type( $product_id ) ) {
		return '';
	}

	$audio_url = trsss_audio_preview_get_url( $product_id );
	if ( '' === $audio_url ) {
		return '';
	}

	$title = get_the_title( $product_id );
	$label = apply_filters( 'trsss_audio_preview_label', __( 'Audiobook Preview', 'shelfsage' ), $product_id );

	ob_start();
	?>
	<div class="trsss-audio-preview" data-product-id="<?php echo esc_attr( $product_id ); ?>">
		<div class="trsss-audio-preview__head">
			<span class="trsss-audio-preview__icon" aria-hidden="true">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
			</span>
			<div>
				<p class="trsss-audio-preview__label"><?php echo esc_html( $label ); ?></p>
				<p class="trsss-audio-preview__title"><?php echo esc_html( $title ); ?></p>
			</div>
		</div>
		<audio class="trsss-audio-preview__player" controls preload="none" src="<?php echo esc_url( $audio_url ); ?>">
			<a href="<?php echo esc_url( $audio_url ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Open audio preview', 'shelfsage' ); ?></a>
		</audio>
		<a class="trsss-audio-preview__fallback" href="<?php echo esc_url( $audio_url ); ?>" target="_blank" rel="noopener noreferrer"><?php esc_html_e( 'Open audio in new tab', 'shelfsage' ); ?></a>
	</div>
	<?php
	return ob_get_clean();
}

/**
 * Print player after the cart button on product pages.
 *
 * @return void
 */
function trsss_audio_preview_after_cart_button() {
	$product_id = get_the_ID();
	echo trsss_audio_preview_render( $product_id ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}
add_action( 'woocommerce_after_add_to_cart_button', 'trsss_audio_preview_after_cart_button', 19 );

/**
 * Shortcode: [shelfsage_audiobook_preview product_id="123"].
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function trsss_audio_preview_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'product_id' => get_the_ID(),
		),
		$atts,
		'shelfsage_audiobook_preview'
	);

	return trsss_audio_preview_render( absint( $atts['product_id'] ) );
}
add_shortcode( 'shelfsage_audiobook_preview', 'trsss_audio_preview_shortcode' );

/**
 * Player styles.
 *
 * @return void
 */
function trsss_audio_preview_styles() {
	if ( ! is_singular( 'product' ) && ! is_singular() ) {
		return;
	}

	wp_register_style( 'trsss-audio-preview', false, array(), defined( 'TRSSS_VERSION' ) ? TRSSS_VERSION : null );
	wp_enqueue_style( 'trsss-audio-preview' );
	wp_add_inline_style(
		'trsss-audio-preview',
		'.trsss-audio-preview{width:100%;margin:14px 0 0;padding:14px;border:1px solid rgba(99,102,241,.18);border-radius:16px;background:linear-gradient(135deg,#fff,#f8fafc);box-shadow:0 12px 28px rgba(15,23,42,.06)}.trsss-audio-preview__head{display:flex;align-items:center;gap:10px;margin-bottom:10px}.trsss-audio-preview__icon{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:12px;background:#eef2ff;color:#4f46e5;flex-shrink:0}.trsss-audio-preview__label{margin:0;color:#4f46e5;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.08em}.trsss-audio-preview__title{margin:2px 0 0;color:#0f172a;font-size:13px;font-weight:800;line-height:1.25}.trsss-audio-preview__player{display:block;width:100%;height:40px}.trsss-audio-preview__fallback{display:inline-flex;margin-top:8px;color:#64748b;font-size:12px;font-weight:700;text-decoration:none}.trsss-audio-preview__fallback:hover{color:#4f46e5;text-decoration:underline}'
	);
}
add_action( 'wp_enqueue_scripts', 'trsss_audio_preview_styles', 20 );