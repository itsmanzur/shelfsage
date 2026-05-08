<?php
/**
 * ShelfSage Advanced SEO Schema.
 *
 * Outputs a comprehensive Schema.org Book JSON-LD block for WooCommerce product
 * single pages, including co-author, translator taxonomy, awards, bookFormat,
 * numberOfPages, inLanguage, bookEdition, and datePublished.
 *
 * Replaces the basic schema previously located in includes/frontend.php.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Map a binding / format string to a Schema.org BookFormatType URL.
 *
 * @param string $binding Raw value from _rmss_binding.
 * @return string|null Schema.org URL or null when unmappable.
 */
function trsss_schema_book_format( $binding ) {
	if ( empty( $binding ) || ! is_string( $binding ) ) {
		return null;
	}

	$binding_lower = strtolower( trim( $binding ) );

	$map = array(
		// Hardcover / cloth variants
		'hardcover'     => 'https://schema.org/Hardcover',
		'hardback'      => 'https://schema.org/Hardcover',
		'hard cover'    => 'https://schema.org/Hardcover',
		'cloth'         => 'https://schema.org/Hardcover',
		'বোর্ড বাঁধাই'  => 'https://schema.org/Hardcover',
		// Paperback variants
		'paperback'     => 'https://schema.org/Paperback',
		'paper back'    => 'https://schema.org/Paperback',
		'softcover'     => 'https://schema.org/Paperback',
		'soft cover'    => 'https://schema.org/Paperback',
		'পেপারব্যাক'    => 'https://schema.org/Paperback',
		// E-book
		'ebook'         => 'https://schema.org/EBook',
		'e-book'        => 'https://schema.org/EBook',
		'epub'          => 'https://schema.org/EBook',
		'pdf'           => 'https://schema.org/EBook',
		'digital'       => 'https://schema.org/EBook',
		'ই-বুক'         => 'https://schema.org/EBook',
		// Audiobook
		'audiobook'     => 'https://schema.org/AudiobookFormat',
		'audio book'    => 'https://schema.org/AudiobookFormat',
		'audio'         => 'https://schema.org/AudiobookFormat',
		'অডিওবুক'       => 'https://schema.org/AudiobookFormat',
	);

	// Exact match first.
	if ( isset( $map[ $binding_lower ] ) ) {
		return $map[ $binding_lower ];
	}

	// Partial / substring match (e.g. "Premium Hardcover").
	foreach ( $map as $keyword => $url ) {
		if ( strpos( $binding_lower, $keyword ) !== false ) {
			return $url;
		}
	}

	return null;
}

/**
 * Build the full Schema.org Book array for a given product post ID.
 *
 * @param int $post_id WooCommerce product post ID.
 * @return array|null Schema array, or null when product is unavailable.
 */
function trsss_build_book_schema( $post_id ) {
	if ( ! trsss_is_woocommerce_available() ) {
		return null;
	}

	$post_id = absint( $post_id );
	if ( ! $post_id ) {
		return null;
	}

	$product = wc_get_product( $post_id );
	if ( ! $product ) {
		return null;
	}

	// ── Core product data ────────────────────────────────────────────────────
	$schema = array(
		'@context' => 'https://schema.org',
		'@type'    => 'Book',
		'name'     => $product->get_name(),
	);

	// URL (canonical permalink)
	$permalink = get_permalink( $post_id );
	if ( $permalink ) {
		$schema['url'] = esc_url_raw( $permalink );
	}

	// Image
	$image_id  = $product->get_image_id();
	$image_url = $image_id ? wp_get_attachment_url( $image_id ) : '';
	if ( $image_url ) {
		$schema['image'] = esc_url_raw( $image_url );
	}

	// Description
	$description = wp_strip_all_tags( $product->get_short_description() );
	if ( '' === $description ) {
		$description = wp_strip_all_tags( $product->get_description() );
	}
	if ( $description ) {
		$schema['description'] = $description;
	}

	// ── Book meta fields ─────────────────────────────────────────────────────
	$isbn          = get_post_meta( $post_id, '_rmss_isbn', true );
	$isbn13        = get_post_meta( $post_id, '_rmss_isbn13', true );
	$edition       = get_post_meta( $post_id, '_rmss_edition', true );
	$pages         = get_post_meta( $post_id, '_rmss_pages', true );
	$language      = get_post_meta( $post_id, '_rmss_language', true );
	$binding       = get_post_meta( $post_id, '_rmss_binding', true );
	$release_date  = get_post_meta( $post_id, '_rmss_release_date', true );
	$awards_raw    = get_post_meta( $post_id, '_rmss_awards', true );
	$co_author_raw = get_post_meta( $post_id, '_rmss_co_author', true );

	// ISBN — prefer ISBN-13, fall back to ISBN-10
	$isbn_value = $isbn13 ? $isbn13 : $isbn;
	if ( $isbn_value ) {
		$schema['isbn'] = sanitize_text_field( $isbn_value );
	}

	// bookEdition
	if ( $edition ) {
		$schema['bookEdition'] = sanitize_text_field( $edition );
	}

	// numberOfPages
	$pages_int = absint( $pages );
	if ( $pages_int > 0 ) {
		$schema['numberOfPages'] = $pages_int;
	}

	// inLanguage
	if ( $language ) {
		$schema['inLanguage'] = sanitize_text_field( $language );
	}

	// bookFormat
	$book_format = trsss_schema_book_format( $binding );
	if ( $book_format ) {
		$schema['bookFormat'] = $book_format;
	}

	// datePublished (YYYY-MM-DD)
	if ( $release_date ) {
		// Validate basic date format.
		if ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', trim( $release_date ) ) ) {
			$schema['datePublished'] = sanitize_text_field( trim( $release_date ) );
		}
	}

	// award — comma-separated string → array of strings
	if ( $awards_raw ) {
		$awards = array_values(
			array_filter(
				array_map( 'trim', explode( ',', $awards_raw ) )
			)
		);
		if ( ! empty( $awards ) ) {
			// Schema.org 'award' can be a Text or array of Text.
			$schema['award'] = count( $awards ) === 1 ? sanitize_text_field( $awards[0] ) : array_map( 'sanitize_text_field', $awards );
		}
	}

	// ── Taxonomies ───────────────────────────────────────────────────────────

	// author (rmss_author taxonomy + co-author meta — combined into one author array)
	$author_nodes = array();

	$author_terms = get_the_terms( $post_id, 'rmss_author' );
	if ( $author_terms && ! is_wp_error( $author_terms ) ) {
		foreach ( $author_terms as $term ) {
			$author_url = get_term_link( $term );
			$node       = array(
				'@type' => 'Person',
				'name'  => $term->name,
			);
			if ( ! is_wp_error( $author_url ) ) {
				$node['url'] = esc_url_raw( $author_url );
			}
			$author_nodes[] = $node;
		}
	}

	// co-author (plain text meta, comma-separated) — appended even when no rmss_author terms exist.
	if ( $co_author_raw ) {
		$co_authors = array_values(
			array_filter(
				array_map( 'trim', explode( ',', $co_author_raw ) )
			)
		);
		foreach ( $co_authors as $co_name ) {
			$author_nodes[] = array(
				'@type' => 'Person',
				'name'  => sanitize_text_field( $co_name ),
			);
		}
	}

	if ( ! empty( $author_nodes ) ) {
		$schema['author'] = count( $author_nodes ) === 1 ? $author_nodes[0] : $author_nodes;
	}

	// translator (rmss_translator taxonomy)
	$translator_terms = get_the_terms( $post_id, 'rmss_translator' );
	if ( $translator_terms && ! is_wp_error( $translator_terms ) ) {
		$translator_nodes = array();
		foreach ( $translator_terms as $term ) {
			$term_url = get_term_link( $term );
			$node     = array(
				'@type' => 'Person',
				'name'  => $term->name,
			);
			if ( ! is_wp_error( $term_url ) ) {
				$node['url'] = esc_url_raw( $term_url );
			}
			$translator_nodes[] = $node;
		}
		if ( ! empty( $translator_nodes ) ) {
			$schema['translator'] = count( $translator_nodes ) === 1 ? $translator_nodes[0] : $translator_nodes;
		}
	}

	// publisher (rmss_publisher taxonomy)
	$publisher_terms = get_the_terms( $post_id, 'rmss_publisher' );
	if ( $publisher_terms && ! is_wp_error( $publisher_terms ) ) {
		$publisher_nodes = array();
		foreach ( $publisher_terms as $term ) {
			$term_url = get_term_link( $term );
			$node     = array(
				'@type' => 'Organization',
				'name'  => $term->name,
			);
			if ( ! is_wp_error( $term_url ) ) {
				$node['url'] = esc_url_raw( $term_url );
			}
			$publisher_nodes[] = $node;
		}
		if ( ! empty( $publisher_nodes ) ) {
			$schema['publisher'] = count( $publisher_nodes ) === 1 ? $publisher_nodes[0] : $publisher_nodes;
		}
	}

	// genre (rmss_genre taxonomy → genre property)
	$genre_terms = get_the_terms( $post_id, 'rmss_genre' );
	if ( $genre_terms && ! is_wp_error( $genre_terms ) ) {
		$genres = wp_list_pluck( $genre_terms, 'name' );
		if ( ! empty( $genres ) ) {
			$schema['genre'] = count( $genres ) === 1 ? $genres[0] : $genres;
		}
	}

	// series (rmss_series taxonomy → isPartOf)
	$series_terms = get_the_terms( $post_id, 'rmss_series' );
	if ( $series_terms && ! is_wp_error( $series_terms ) ) {
		$first_series = reset( $series_terms );
		$series_url   = get_term_link( $first_series );
		$series_node  = array(
			'@type' => 'BookSeries',
			'name'  => $first_series->name,
		);
		if ( ! is_wp_error( $series_url ) ) {
			$series_node['url'] = esc_url_raw( $series_url );
		}
		$schema['isPartOf'] = $series_node;
	}

	// ── Offers (WooCommerce price + stock) ───────────────────────────────────
	$price    = $product->get_price();
	$currency = get_woocommerce_currency();

	$offers = array(
		'@type'           => 'Offer',
		'url'             => esc_url_raw( $permalink ?: get_permalink( $post_id ) ),
		'priceCurrency'   => $currency,
		'availability'    => $product->is_in_stock()
			? 'https://schema.org/InStock'
			: 'https://schema.org/OutOfStock',
		'itemCondition'   => 'https://schema.org/NewCondition',
	);

	if ( '' !== $price && null !== $price ) {
		$offers['price'] = $price;
	}

	$schema['offers'] = $offers;

	/**
	 * Filter the complete Book schema array before output.
	 *
	 * @param array $schema   Schema.org Book array.
	 * @param int   $post_id  WooCommerce product post ID.
	 */
	return (array) apply_filters( 'trsss_book_schema', $schema, $post_id );
}

/**
 * Output the JSON-LD script tag in <head> for single product pages.
 *
 * @return void
 */
function trsss_output_schema() {
	if ( ! trsss_is_woocommerce_available() ) {
		return;
	}

	if ( ! is_singular( 'product' ) ) {
		return;
	}

	$settings = trsss_get_shelfsage_settings_array();

	// Respect the global "Enable Schema" toggle.
	if ( isset( $settings['enable_schema'] ) && ! $settings['enable_schema'] ) {
		return;
	}

	// Respect the "Enable Advanced Schema" toggle (defaults on).
	$advanced_on = ! isset( $settings['enable_advanced_schema'] ) || $settings['enable_advanced_schema'];

	global $post;
	if ( ! isset( $post->ID ) ) {
		return;
	}

	if ( $advanced_on ) {
		$schema = trsss_build_book_schema( $post->ID );
	} else {
		// Minimal legacy schema (backward-compatible).
		$product    = wc_get_product( $post->ID );
		$isbn       = get_post_meta( $post->ID, '_rmss_isbn', true );
		$authors    = get_the_terms( $post->ID, 'rmss_author' );
		$publishers = get_the_terms( $post->ID, 'rmss_publisher' );

		$schema = array(
			'@context' => 'https://schema.org',
			'@type'    => 'Book',
			'name'     => $product ? $product->get_name() : get_the_title( $post->ID ),
			'image'    => $product ? wp_get_attachment_url( $product->get_image_id() ) : '',
			'description' => $product ? wp_strip_all_tags( $product->get_short_description() ) : '',
			'isbn'     => $isbn,
			'offers'   => array(
				'@type'        => 'Offer',
				'price'        => $product ? $product->get_price() : '',
				'priceCurrency' => get_woocommerce_currency(),
				'availability' => $product && $product->is_in_stock()
					? 'https://schema.org/InStock'
					: 'https://schema.org/OutOfStock',
			),
		);
		if ( $authors && ! is_wp_error( $authors ) ) {
			$schema['author'] = array();
			foreach ( $authors as $a ) {
				$schema['author'][] = array( '@type' => 'Person', 'name' => $a->name );
			}
		}
		if ( $publishers && ! is_wp_error( $publishers ) ) {
			$schema['publisher'] = array();
			foreach ( $publishers as $p ) {
				$schema['publisher'][] = array( '@type' => 'Organization', 'name' => $p->name );
			}
		}
	}

	if ( empty( $schema ) ) {
		return;
	}

	echo '<script type="application/ld+json">'
		. wp_json_encode( $schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES )
		. '</script>' . "\n";
}
add_action( 'wp_head', 'trsss_output_schema' );
