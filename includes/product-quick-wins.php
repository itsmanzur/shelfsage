<?php
/**
 * Section 4 quick wins: copy ISBN + social share on single product (WooCommerce hook).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Primary ISBN string for clipboard (prefers ISBN-13 when set).
 *
 * @param int $product_id Product ID.
 * @return string
 */
function trsss_get_product_quick_wins_primary_isbn( $product_id ) {
	$product_id = (int) $product_id;
	$i13        = $product_id ? get_post_meta( $product_id, '_rmss_isbn13', true ) : '';
	$i10        = $product_id ? get_post_meta( $product_id, '_rmss_isbn', true ) : '';
	$primary    = trim( is_string( $i13 ) ? $i13 : '' );
	if ( '' === $primary ) {
		$primary = trim( is_string( $i10 ) ? $i10 : '' );
	}
	return $primary;
}

/**
 * Social share + copy ISBN row (printed after the add-to-cart button via WC hook).
 */
function trsss_print_quick_wins_after_cart_button() {
	if ( ! trsss_is_woocommerce_available() ) {
		return;
	}
	if ( ! apply_filters( 'trsss_enable_product_quick_wins', true ) ) {
		return;
	}
	global $product;
	if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
		return;
	}

	$product_id = $product->get_id();
	$show_copy  = (bool) apply_filters( 'trsss_show_copy_isbn_on_product', true, $product_id );
	$show_share = (bool) apply_filters( 'trsss_show_social_share_on_product', true, $product_id );

	$isbn = $show_copy ? trsss_get_product_quick_wins_primary_isbn( $product_id ) : '';
	$url  = get_permalink( $product_id );
	$title = wp_strip_all_tags( $product->get_name() );

	if ( '' === $isbn && ! $show_share ) {
		return;
	}

	$label_copy  = esc_attr__( 'Copy ISBN', 'shelfsage' );
	$label_share = esc_html__( 'Share', 'shelfsage' );

	$fb = esc_url( 'https://www.facebook.com/sharer/sharer.php?' . http_build_query( array( 'u' => $url ), '', '&', PHP_QUERY_RFC3986 ) );
	$tw = esc_url( 'https://twitter.com/intent/tweet?' . http_build_query( array( 'text' => $title, 'url' => $url ), '', '&', PHP_QUERY_RFC3986 ) );
	$wa = esc_url( 'https://wa.me/?' . http_build_query( array( 'text' => $title . ' ' . $url ), '', '&', PHP_QUERY_RFC3986 ) );
	$mailto_href = 'mailto:?subject=' . rawurlencode( $title ) . '&body=' . rawurlencode( __( 'Check out this book:', 'shelfsage' ) . ' ' . $url );
	$mail       = esc_url( $mailto_href );

	echo '<div class="rmss-quick-wins flex flex-wrap items-center gap-2 mt-3 w-full">';
	if ( '' !== $isbn ) {
		echo '<button type="button" class="rmss-copy-isbn-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 shadow-sm transition-colors" ';
		echo 'data-isbn="' . esc_attr( $isbn ) . '" data-label="' . esc_attr__( 'Copy ISBN', 'shelfsage' ) . '" data-label-done="' . esc_attr__( 'Copied!', 'shelfsage' ) . '" ';
		echo 'aria-label="' . $label_copy . '">';
		echo '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>';
		echo '<span>' . esc_html__( 'Copy ISBN', 'shelfsage' ) . '</span>';
		echo '</button>';
	}

	if ( $show_share ) {
		echo '<span class="text-xs font-bold text-gray-400 uppercase tracking-wide mx-1 hidden sm:inline">' . esc_html( $label_share ) . '</span>';
		echo '<a href="' . $fb . '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-colors" aria-label="' . esc_attr__( 'Share on Facebook', 'shelfsage' ) . '">';
		echo '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg></a>';
		echo '<a href="' . $tw . '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-sky-50 text-sky-500 hover:bg-sky-500 hover:text-white transition-colors" aria-label="' . esc_attr__( 'Share on X', 'shelfsage' ) . '">';
		echo '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"/></svg></a>';
		echo '<a href="' . $wa . '" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-green-50 text-green-600 hover:bg-green-600 hover:text-white transition-colors" aria-label="' . esc_attr__( 'Share on WhatsApp', 'shelfsage' ) . '">';
		echo '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.884 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>';
		echo '<a href="' . $mail . '" class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-600 hover:text-white transition-colors" aria-label="' . esc_attr__( 'Share by email', 'shelfsage' ) . '">';
		echo '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></a>';
	}
	echo '</div>';
}

add_action( 'woocommerce_after_add_to_cart_button', 'trsss_print_quick_wins_after_cart_button', 40 );

/**
 * Clipboard handler for `.rmss-copy-isbn-btn` (delegated click).
 */
function trsss_enqueue_product_quick_wins_script() {
	if ( ! trsss_is_woocommerce_available() || ! function_exists( 'is_product' ) || ! is_product() || ! apply_filters( 'trsss_enable_product_quick_wins', true ) ) {
		return;
	}

	wp_register_script( 'rmss-product-quick-wins', false, array(), defined( 'TRSSS_VERSION' ) ? TRSSS_VERSION : '1.5.1', true );
	wp_enqueue_script( 'rmss-product-quick-wins' );

	$js = <<<JS
(function(){document.addEventListener('click',function(e){var b=e.target&&e.target.closest&&e.target.closest('.rmss-copy-isbn-btn');if(!b||!b.getAttribute)return;var v=(b.getAttribute('data-isbn')||'').trim();if(!v)return;e.preventDefault();var lbl=b.getAttribute('data-label')||'';var done=b.getAttribute('data-label-done')||'Copied!';var span=b.querySelector('span');function setTxt(t){if(span){span.textContent=t;}else{b.textContent=t;}}function ok(){setTxt(done);setTimeout(function(){setTxt(lbl);},1600);}if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(v).then(ok).catch(fb);}else{fb();}function fb(){var ta=document.createElement('textarea');ta.value=v;ta.setAttribute('readonly','');document.body.appendChild(ta);ta.select();try{document.execCommand('copy');}catch(err){}document.body.removeChild(ta);ok();}});})();
JS;

	wp_add_inline_script( 'rmss-product-quick-wins', $js, 'after' );
}
add_action( 'wp_enqueue_scripts', 'trsss_enqueue_product_quick_wins_script', 35 );
