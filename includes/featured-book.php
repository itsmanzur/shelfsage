<?php
/**
 * "Featured Book" / "Book of the Week" Shortcode.
 *
 * A polished hero-style card that bookstores typically want to drop on the
 * homepage to highlight a single title. Self-contained: works for both
 * WooCommerce products and ShelfSage Vault assets, no React, no extra HTTP
 * requests, inline CSS printed once per request.
 *
 * Usage:
 *   [shelfsage_featured id="123"]
 *   [shelfsage_featured id="123" label="Book of the Week" align="right"]
 *   [shelfsage_featured id="123" cta_text="Get Your Copy" show_rating="no"]
 *
 * Attributes:
 *   id                  Product or Vault asset ID (required, or fall back to
 *                       current queried object on a single page).
 *   label               Ribbon label (default "Featured Book").
 *   align               "left" | "right" — which side the cover sits on
 *                       (default left).
 *   theme               "auto" (default, uses Settings primary/accent
 *                       colour) | "light" | "dark" | "minimal".
 *   show_chips          yes | no  (default yes) — genre / publisher chips
 *   show_rating         yes | no  (default yes)
 *   show_price          yes | no  (default yes)
 *   show_excerpt        yes | no  (default yes)
 *   excerpt_words       Integer, default 32.
 *   cta_text            Override the primary CTA label.
 *   cta_url             Override the primary CTA URL (default product
 *                       permalink).
 *   secondary_text      Override the secondary CTA label
 *                       (default "More details").
 *   class               Extra CSS class on the wrapper.
 *
 * Filters:
 *   trsss_featured_book_data   (array $data, $post_id, $atts)
 *   trsss_featured_book_html   (string $html, $data, $atts)
 *   trsss_featured_book_label  (string $label, $post_id)
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Resolve the post ID from the shortcode `id` attribute, with a single-page
 * fallback so [shelfsage_featured] works inside a saved Architect block on
 * a product page itself.
 *
 * @param array $atts Shortcode attributes.
 * @return int
 */
function trsss_featured_book_resolve_id( $atts ) {
	$id = absint( $atts['id'] ?? 0 );
	if ( $id ) {
		return $id;
	}
	$current = (int) get_the_ID();
	return $current > 0 ? $current : 0;
}

/**
 * Build the data payload for a featured book card from either a WooCommerce
 * product or a ShelfSage Vault asset.
 *
 * @param int   $post_id Post ID.
 * @param array $atts    Shortcode attributes (used by filters).
 * @return array|null Data payload or null when the post is missing.
 */
function trsss_featured_book_collect_data( $post_id, $atts ) {
	$post_id = absint( $post_id );
	if ( ! $post_id ) {
		return null;
	}
	$post = get_post( $post_id );
	if ( ! $post || 'publish' !== $post->post_status ) {
		return null;
	}

	$is_product = ( 'product' === $post->post_type );
	$is_vault   = ( 'ss_vault_assets' === $post->post_type );
	if ( ! $is_product && ! $is_vault ) {
		return null;
	}

	$data = array(
		'id'           => $post_id,
		'type'         => $is_product ? 'product' : 'vault',
		'title'        => get_the_title( $post_id ),
		'permalink'    => get_permalink( $post_id ),
		'cover_url'    => '',
		'author'       => '',
		'publisher'    => '',
		'genres'       => array(),
		'isbn'         => '',
		'price_html'   => '',
		'rating_value' => 0.0,
		'rating_count' => 0,
		'excerpt'      => '',
	);

	$thumb_id = (int) get_post_thumbnail_id( $post_id );
	if ( $thumb_id ) {
		$src = wp_get_attachment_image_src( $thumb_id, 'large' );
		if ( $src && ! empty( $src[0] ) ) {
			$data['cover_url'] = $src[0];
		}
	}

	if ( $is_product ) {
		if ( ! function_exists( 'wc_get_product' ) ) {
			return null;
		}
		$product = wc_get_product( $post_id );
		if ( ! $product || $product->get_status() !== 'publish' ) {
			return null;
		}

		$data['price_html']   = (string) $product->get_price_html();
		$data['rating_value'] = (float) $product->get_average_rating();
		$data['rating_count'] = (int) $product->get_review_count();
		$data['excerpt']      = wp_strip_all_tags( $product->get_short_description() ?: $product->get_description() );

		$author_terms = get_the_terms( $post_id, 'rmss_author' );
		if ( ! is_wp_error( $author_terms ) && $author_terms ) {
			$data['author'] = implode( ', ', wp_list_pluck( $author_terms, 'name' ) );
		}

		$publisher_terms = get_the_terms( $post_id, 'rmss_publisher' );
		if ( ! is_wp_error( $publisher_terms ) && $publisher_terms ) {
			$data['publisher'] = $publisher_terms[0]->name;
		}

		$genre_terms = get_the_terms( $post_id, 'rmss_genre' );
		if ( ! is_wp_error( $genre_terms ) && $genre_terms ) {
			$data['genres'] = array_slice( wp_list_pluck( $genre_terms, 'name' ), 0, 3 );
		}

		$data['isbn'] = (string) get_post_meta( $post_id, '_rmss_isbn', true );
	} else {
		// Vault asset — read flat post meta.
		$data['author']    = (string) get_post_meta( $post_id, '_ss_vault_author', true );
		$data['publisher'] = (string) get_post_meta( $post_id, '_ss_vault_publisher', true );
		$data['isbn']      = (string) get_post_meta( $post_id, '_ss_vault_isbn', true );
		$genre_text        = (string) get_post_meta( $post_id, '_ss_vault_genre', true );
		if ( '' !== $genre_text ) {
			$data['genres'] = array_slice(
				array_filter( array_map( 'trim', preg_split( '/[,;|]+/', $genre_text ) ) ),
				0,
				3
			);
		}
		$price = (string) get_post_meta( $post_id, '_ss_vault_price', true );
		if ( '' !== $price ) {
			$currency           = function_exists( 'get_woocommerce_currency_symbol' ) ? get_woocommerce_currency_symbol() : '';
			$data['price_html'] = esc_html( $currency . $price );
		}
		$rating = (float) get_post_meta( $post_id, '_ss_vault_rating', true );
		if ( $rating > 0 ) {
			$data['rating_value'] = $rating;
		}
		$data['excerpt'] = wp_strip_all_tags( $post->post_content );
	}

	/**
	 * Filter the assembled featured-book data payload before rendering.
	 *
	 * @param array $data    Data payload.
	 * @param int   $post_id Post ID.
	 * @param array $atts    Shortcode attributes.
	 */
	return (array) apply_filters( 'trsss_featured_book_data', $data, $post_id, $atts );
}

/**
 * Trim an excerpt to a word count without breaking HTML entities.
 *
 * @param string $text  Text.
 * @param int    $words Word count.
 * @return string
 */
function trsss_featured_book_trim_excerpt( $text, $words ) {
	$text = trim( wp_strip_all_tags( (string) $text ) );
	if ( '' === $text ) {
		return '';
	}
	return wp_trim_words( $text, max( 5, (int) $words ), '…' );
}

/**
 * Render a star-rating glyph row.
 *
 * @param float $value Rating 0–5.
 * @param int   $count Review count.
 * @param array $colors Color palette.
 * @return string
 */
function trsss_featured_book_stars_html( $value, $count, $colors ) {
	if ( $value <= 0 ) {
		return '';
	}
	$full  = (int) floor( $value );
	$half  = ( $value - $full ) >= 0.5 ? 1 : 0;
	$empty = max( 0, 5 - $full - $half );

	$stars  = str_repeat( '★', $full );
	$stars .= $half ? '⯨' : '';
	$stars .= str_repeat( '☆', $empty );

	$out  = '<span class="trsss-featured-book__stars" aria-hidden="true" style="color:' . esc_attr( $colors['fg_strong'] ) . ';">' . esc_html( $stars ) . '</span>';
	$out .= '<span class="trsss-featured-book__rating-value">' . esc_html( number_format_i18n( $value, 1 ) ) . '</span>';
	if ( $count > 0 ) {
		$out .= '<span class="trsss-featured-book__rating-count">(' . esc_html( number_format_i18n( $count ) ) . ' ' . esc_html__( 'reviews', 'shelfsage' ) . ')</span>';
	}
	return $out;
}

/**
 * Print the inline CSS once per request.
 *
 * @return void
 */
function trsss_featured_book_print_css() {
	static $printed = false;
	if ( $printed ) {
		return;
	}
	$printed = true;

	echo '<style id="trsss-featured-book-css">'
		. '.trsss-featured-book{--ssfb-radius:18px;--ssfb-bg:#ffffff;--ssfb-fg:#0f172a;--ssfb-fg-muted:#475569;--ssfb-primary:#2563eb;--ssfb-accent:#1d4ed8;--ssfb-ring:rgba(37,99,235,.18);--ssfb-soft:rgba(37,99,235,.08);position:relative;display:flex;gap:32px;padding:28px;background:var(--ssfb-bg);border-radius:var(--ssfb-radius);box-shadow:0 12px 40px -16px rgba(15,23,42,.18),0 2px 8px -3px rgba(15,23,42,.08);font-family:inherit;color:var(--ssfb-fg);max-width:980px;margin:24px auto;overflow:hidden;border:1px solid rgba(15,23,42,.06);box-sizing:border-box}'
		. '.trsss-featured-book::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,var(--ssfb-soft),transparent 60%);pointer-events:none}'
		. '.trsss-featured-book *{box-sizing:border-box}'
		. '.trsss-featured-book--right{flex-direction:row-reverse}'
		. '.trsss-featured-book--dark{--ssfb-bg:#0f172a;--ssfb-fg:#f8fafc;--ssfb-fg-muted:#94a3b8;border-color:rgba(255,255,255,.08)}'
		. '.trsss-featured-book--minimal{box-shadow:none;border:1px solid rgba(15,23,42,.12)}'
		. '.trsss-featured-book__cover{position:relative;flex:0 0 240px;max-width:240px;align-self:flex-start}'
		. '.trsss-featured-book__cover img{width:100%;height:auto;display:block;border-radius:10px;box-shadow:0 16px 30px -10px rgba(15,23,42,.3),0 4px 8px -2px rgba(15,23,42,.15);aspect-ratio:2/3;object-fit:cover;background:#e2e8f0}'
		. '.trsss-featured-book__cover-placeholder{display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:2/3;border-radius:10px;background:linear-gradient(135deg,var(--ssfb-soft),var(--ssfb-ring));color:var(--ssfb-primary);font-size:48px;font-weight:800}'
		. '.trsss-featured-book__ribbon{position:absolute;top:14px;left:-10px;display:inline-flex;align-items:center;gap:6px;padding:6px 14px;background:var(--ssfb-primary);color:#fff;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:0 999px 999px 0;box-shadow:0 6px 14px -4px var(--ssfb-ring);z-index:2}'
		. '.trsss-featured-book__ribbon::before{content:"";position:absolute;left:0;bottom:-6px;border-top:6px solid var(--ssfb-accent);border-left:10px solid transparent}'
		. '.trsss-featured-book__content{flex:1;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:10px;position:relative;z-index:1}'
		. '.trsss-featured-book__chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:2px}'
		. '.trsss-featured-book__chip{display:inline-flex;align-items:center;padding:3px 10px;background:var(--ssfb-soft);color:var(--ssfb-primary);font-size:11px;font-weight:700;letter-spacing:.02em;border-radius:999px;text-transform:uppercase}'
		. '.trsss-featured-book__title{font-size:clamp(22px,3.4vw,32px);font-weight:800;line-height:1.2;margin:0;color:var(--ssfb-fg)}'
		. '.trsss-featured-book__title a{color:inherit;text-decoration:none}'
		. '.trsss-featured-book__title a:hover{color:var(--ssfb-primary)}'
		. '.trsss-featured-book__author{margin:0;font-size:14px;color:var(--ssfb-fg-muted)}'
		. '.trsss-featured-book__author strong{color:var(--ssfb-fg);font-weight:600}'
		. '.trsss-featured-book__rating{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ssfb-fg-muted)}'
		. '.trsss-featured-book__stars{font-size:16px;letter-spacing:1px;line-height:1}'
		. '.trsss-featured-book__rating-value{font-weight:700;color:var(--ssfb-fg)}'
		. '.trsss-featured-book__excerpt{margin:6px 0 4px;font-size:14px;line-height:1.6;color:var(--ssfb-fg-muted)}'
		. '.trsss-featured-book__meta{display:flex;flex-wrap:wrap;align-items:baseline;gap:14px;margin-top:4px}'
		. '.trsss-featured-book__price{font-size:22px;font-weight:800;color:var(--ssfb-fg);line-height:1}'
		. '.trsss-featured-book__price del{color:var(--ssfb-fg-muted);font-weight:500;font-size:16px;margin-right:6px}'
		. '.trsss-featured-book__isbn{font-size:11px;color:var(--ssfb-fg-muted);font-family:ui-monospace,SFMono-Regular,monospace}'
		. '.trsss-featured-book__cta{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}'
		. '.trsss-featured-book__btn{display:inline-flex;align-items:center;gap:8px;padding:12px 22px;font-size:14px;font-weight:700;border-radius:10px;text-decoration:none;transition:transform .15s ease,box-shadow .15s ease;border:1px solid transparent;line-height:1}'
		. '.trsss-featured-book__btn--primary{background:var(--ssfb-primary);color:#fff;box-shadow:0 8px 18px -6px var(--ssfb-ring)}'
		. '.trsss-featured-book__btn--primary:hover{transform:translateY(-1px);box-shadow:0 12px 22px -6px var(--ssfb-ring);color:#fff}'
		. '.trsss-featured-book__btn--secondary{background:transparent;color:var(--ssfb-fg);border-color:rgba(15,23,42,.18)}'
		. '.trsss-featured-book__btn--secondary:hover{background:var(--ssfb-soft);color:var(--ssfb-primary);border-color:var(--ssfb-primary)}'
		. '.trsss-featured-book--dark .trsss-featured-book__btn--secondary{color:#f8fafc;border-color:rgba(255,255,255,.2)}'
		. '@media(max-width:640px){.trsss-featured-book{flex-direction:column!important;gap:20px;padding:20px;text-align:center}.trsss-featured-book__cover{max-width:180px;margin:0 auto;flex-basis:auto}.trsss-featured-book__chips,.trsss-featured-book__rating,.trsss-featured-book__meta,.trsss-featured-book__cta{justify-content:center}}'
		. '</style>';
}

/**
 * Render the featured book card.
 *
 * @param int   $post_id Post ID.
 * @param array $atts    Shortcode attributes.
 * @return string HTML or empty string.
 */
function trsss_render_featured_book( $post_id, $atts ) {
	$data = trsss_featured_book_collect_data( $post_id, $atts );
	if ( ! $data ) {
		return '';
	}

	$settings = function_exists( 'trsss_get_shelfsage_settings_array' )
		? trsss_get_shelfsage_settings_array()
		: array();
	$primary  = function_exists( 'trsss_sanitize_theme_hex' )
		? trsss_sanitize_theme_hex( $settings['primary_color'] ?? '', '#2563eb' )
		: '#2563eb';
	$accent   = function_exists( 'trsss_sanitize_theme_hex' )
		? trsss_sanitize_theme_hex( $settings['accent_color'] ?? '', '#1d4ed8' )
		: '#1d4ed8';

	$colors = array(
		'fg_strong' => $primary,
	);

	$align = in_array( $atts['align'] ?? 'left', array( 'left', 'right' ), true ) ? $atts['align'] : 'left';
	$theme = in_array( $atts['theme'] ?? 'auto', array( 'auto', 'light', 'dark', 'minimal' ), true ) ? $atts['theme'] : 'auto';

	$wrapper_classes = array( 'trsss-featured-book' );
	if ( 'right' === $align ) {
		$wrapper_classes[] = 'trsss-featured-book--right';
	}
	if ( 'dark' === $theme ) {
		$wrapper_classes[] = 'trsss-featured-book--dark';
	} elseif ( 'minimal' === $theme ) {
		$wrapper_classes[] = 'trsss-featured-book--minimal';
	}
	$extra_class = sanitize_html_class( $atts['class'] ?? '' );
	if ( $extra_class ) {
		$wrapper_classes[] = $extra_class;
	}

	$label = (string) ( $atts['label'] ?? __( 'Featured Book', 'shelfsage' ) );
	$label = (string) apply_filters( 'trsss_featured_book_label', $label, $data['id'] );

	$cta_text = '' !== ( $atts['cta_text'] ?? '' ) ? (string) $atts['cta_text'] : (
		'product' === $data['type']
			? __( 'Buy Now', 'shelfsage' )
			: __( 'View Book', 'shelfsage' )
	);
	$cta_url  = '' !== ( $atts['cta_url'] ?? '' ) ? esc_url_raw( $atts['cta_url'] ) : $data['permalink'];

	$secondary_text = (string) ( $atts['secondary_text'] ?? __( 'More details', 'shelfsage' ) );

	$show_chips   = ! in_array( strtolower( (string) ( $atts['show_chips'] ?? 'yes' ) ), array( 'no', '0', 'false', 'off' ), true );
	$show_rating  = ! in_array( strtolower( (string) ( $atts['show_rating'] ?? 'yes' ) ), array( 'no', '0', 'false', 'off' ), true );
	$show_price   = ! in_array( strtolower( (string) ( $atts['show_price'] ?? 'yes' ) ), array( 'no', '0', 'false', 'off' ), true );
	$show_excerpt = ! in_array( strtolower( (string) ( $atts['show_excerpt'] ?? 'yes' ) ), array( 'no', '0', 'false', 'off' ), true );
	$excerpt_len  = max( 5, (int) ( $atts['excerpt_words'] ?? 32 ) );

	$style_vars = sprintf( '--ssfb-primary:%s;--ssfb-accent:%s;--ssfb-ring:%s33;--ssfb-soft:%s14;', esc_attr( $primary ), esc_attr( $accent ), esc_attr( $primary ), esc_attr( $primary ) );

	trsss_featured_book_print_css();

	ob_start();
	?>
	<div class="<?php echo esc_attr( implode( ' ', $wrapper_classes ) ); ?>" style="<?php echo esc_attr( $style_vars ); ?>">
		<div class="trsss-featured-book__cover">
			<span class="trsss-featured-book__ribbon">★ <?php echo esc_html( $label ); ?></span>
			<?php if ( '' !== $data['cover_url'] ) : ?>
				<a href="<?php echo esc_url( $data['permalink'] ); ?>"><img src="<?php echo esc_url( $data['cover_url'] ); ?>" alt="<?php echo esc_attr( $data['title'] ); ?>" loading="lazy" /></a>
			<?php else : ?>
				<a href="<?php echo esc_url( $data['permalink'] ); ?>" class="trsss-featured-book__cover-placeholder" aria-label="<?php echo esc_attr( $data['title'] ); ?>"><?php echo esc_html( mb_substr( $data['title'], 0, 1 ) ); ?></a>
			<?php endif; ?>
		</div>

		<div class="trsss-featured-book__content">
			<?php if ( $show_chips && ( ! empty( $data['genres'] ) || '' !== $data['publisher'] ) ) : ?>
				<div class="trsss-featured-book__chips">
					<?php foreach ( (array) $data['genres'] as $genre ) : ?>
						<span class="trsss-featured-book__chip"><?php echo esc_html( $genre ); ?></span>
					<?php endforeach; ?>
					<?php if ( '' !== $data['publisher'] ) : ?>
						<span class="trsss-featured-book__chip" style="background:transparent;border:1px dashed currentColor;"><?php echo esc_html( $data['publisher'] ); ?></span>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<h2 class="trsss-featured-book__title"><a href="<?php echo esc_url( $data['permalink'] ); ?>"><?php echo esc_html( $data['title'] ); ?></a></h2>

			<?php if ( '' !== $data['author'] ) : ?>
				<p class="trsss-featured-book__author"><?php esc_html_e( 'by', 'shelfsage' ); ?> <strong><?php echo esc_html( $data['author'] ); ?></strong></p>
			<?php endif; ?>

			<?php if ( $show_rating && $data['rating_value'] > 0 ) : ?>
				<div class="trsss-featured-book__rating">
					<?php echo trsss_featured_book_stars_html( $data['rating_value'], $data['rating_count'], $colors ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside helper. ?>
				</div>
			<?php endif; ?>

			<?php if ( $show_excerpt && '' !== $data['excerpt'] ) : ?>
				<p class="trsss-featured-book__excerpt"><?php echo esc_html( trsss_featured_book_trim_excerpt( $data['excerpt'], $excerpt_len ) ); ?></p>
			<?php endif; ?>

			<?php if ( ( $show_price && '' !== $data['price_html'] ) || '' !== $data['isbn'] ) : ?>
				<div class="trsss-featured-book__meta">
					<?php if ( $show_price && '' !== $data['price_html'] ) : ?>
						<span class="trsss-featured-book__price"><?php echo wp_kses_post( $data['price_html'] ); ?></span>
					<?php endif; ?>
					<?php if ( '' !== $data['isbn'] ) : ?>
						<span class="trsss-featured-book__isbn">ISBN <?php echo esc_html( $data['isbn'] ); ?></span>
					<?php endif; ?>
				</div>
			<?php endif; ?>

			<div class="trsss-featured-book__cta">
				<a class="trsss-featured-book__btn trsss-featured-book__btn--primary" href="<?php echo esc_url( $cta_url ); ?>"><?php echo esc_html( $cta_text ); ?>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" width="14" height="14" aria-hidden="true"><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></svg>
				</a>
				<a class="trsss-featured-book__btn trsss-featured-book__btn--secondary" href="<?php echo esc_url( $data['permalink'] ); ?>"><?php echo esc_html( $secondary_text ); ?></a>
			</div>
		</div>
	</div>
	<?php
	$html = (string) ob_get_clean();

	/**
	 * Filter the final featured-book HTML.
	 *
	 * @param string $html Rendered HTML.
	 * @param array  $data Data payload.
	 * @param array  $atts Shortcode attributes.
	 */
	return (string) apply_filters( 'trsss_featured_book_html', $html, $data, $atts );
}

/**
 * Shortcode handler.
 *
 * @param array $atts Shortcode attributes.
 * @return string
 */
function trsss_featured_book_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'id'             => 0,
			'label'          => __( 'Featured Book', 'shelfsage' ),
			'align'          => 'left',
			'theme'          => 'auto',
			'show_chips'     => 'yes',
			'show_rating'    => 'yes',
			'show_price'     => 'yes',
			'show_excerpt'   => 'yes',
			'excerpt_words'  => 32,
			'cta_text'       => '',
			'cta_url'        => '',
			'secondary_text' => '',
			'class'          => '',
		),
		$atts,
		'shelfsage_featured'
	);

	$post_id = trsss_featured_book_resolve_id( $atts );
	if ( ! $post_id ) {
		return '';
	}

	return trsss_render_featured_book( $post_id, $atts );
}
add_shortcode( 'shelfsage_featured', 'trsss_featured_book_shortcode' );
