<?php
/**
 * Public search/filters/related + admin product/taxonomy REST (split from legacy api.php).
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}


/**
 * Taxonomies whose GET /filters response is cached separately (Section 3).
 *
 * @return array
 */
function trsss_filters_cached_taxonomies() {
	return apply_filters(
		'trsss_filters_cached_taxonomies',
		array( 'rmss_author', 'rmss_publisher', 'rmss_genre', 'rmss_collection' )
	);
}

/**
 * Transient (and object cache) key for one taxonomy slice of GET /filters.
 *
 * @param string $taxonomy Taxonomy slug (e.g. rmss_author).
 * @return string
 */
function trsss_filters_transient_key_for_taxonomy( $taxonomy ) {
	return 'trsss_filters_tax_' . $taxonomy;
}

/**
 * Flush per-taxonomy filter caches and the legacy single-blob transient.
 */
function trsss_delete_filters_tax_transients() {
	foreach ( trsss_filters_cached_taxonomies() as $t ) {
		$key = trsss_filters_transient_key_for_taxonomy( $t );
		delete_transient( $key );
		wp_cache_delete( $key, 'shelfsage_filters' );
	}
	delete_transient( 'trsss_filters_data' );
}

/**
 * Build one taxonomy branch for REST /filters.
 *
 * @param string $taxonomy Taxonomy slug.
 * @return array
 */
function trsss_build_filters_term_payload( $taxonomy ) {
	$terms = get_terms(
		array(
			'taxonomy'   => $taxonomy,
			'hide_empty' => true,
		)
	);
	$out = array();
	if ( is_wp_error( $terms ) || empty( $terms ) ) {
		return $out;
	}

	foreach ( $terms as $term ) {
		$row = array(
			'id'    => $term->term_id,
			'name'  => $term->name,
			'slug'  => $term->slug,
			'count' => $term->count,
		);

		if ( in_array( $taxonomy, array( 'rmss_author', 'rmss_publisher' ), true ) ) {
			$img_id  = get_term_meta( $term->term_id, 'rmss_image_id', true );
			$img_url = $img_id ? wp_get_attachment_image_url( (int) $img_id, 'thumbnail' ) : null;
			if ( ! $img_url ) {
				$old_url = get_term_meta( $term->term_id, 'rmss_image', true );
				if ( $old_url ) {
					$img_url = $old_url;
				}
			}
			$row['image'] = $img_url;
		}

		$out[] = $row;
	}

	return $out;
}

function trsss_handle_search( $request ) {
    $rl = trsss_public_rest_rate_limit_check( 'search' );
    if ( is_wp_error( $rl ) ) {
        return $rl;
    }

    $params = $request->get_params();
    $skip_cache = ! empty( $params['no_cache'] );

    // Caching Key (v8 — deterministic wp_json_encode); skip cache when no_cache=1 (e.g. admin preview)
    if ( ! $skip_cache ) {
        $cache_key = 'trsss_search_v8_' . md5( trsss_search_cache_param_payload( $params ) );
        $cached = get_transient( $cache_key );
        if ( $cached !== false ) {
            return $cached;
        }
    }

    $term = isset( $params['term'] ) ? sanitize_text_field( $params['term'] ) : '';
    $type = isset( $params['type'] ) ? sanitize_text_field( $params['type'] ) : 'latest'; // latest, featured, onsale, bestsellers
    $authors = isset( $params['author'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['author'] ) ) ) : array();
    $publishers = isset( $params['publisher'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['publisher'] ) ) ) : array();
    $genres = isset( $params['genre'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['genre'] ) ) ) : array();
    $collections = isset( $params['collection'] ) ? array_map( 'sanitize_title', array_map( 'trim', explode( ',', $params['collection'] ) ) ) : array();
    $raw_limit = isset( $params['limit'] ) ? intval( $params['limit'] ) : 12;
    $limit = ( $raw_limit === -1 ) ? 100 : max( 1, $raw_limit ); // -1 means "show all" (capped at 100)

    $include = isset( $params['include'] ) ? array_filter( array_map( 'absint', explode( ',', $params['include'] ) ) ) : array();
    $category = isset( $params['category'] ) ? sanitize_text_field( $params['category'] ) : '';

    // Sort params
    $sort_by    = isset( $params['sort_by'] ) ? sanitize_text_field( $params['sort_by'] ) : 'date';
    $sort_order = isset( $params['sort_order'] ) ? strtoupper( sanitize_text_field( $params['sort_order'] ) ) : 'DESC';
    $sort_order = ( 'ASC' === $sort_order ) ? 'ASC' : 'DESC';
    $valid_sort_by = array( 'date', 'title', 'modified', 'price', 'rating', 'rand' );
    if ( ! in_array( $sort_by, $valid_sort_by, true ) ) {
        $sort_by = 'date';
    }

    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => $limit,
        'post_status'    => 'publish',
        'order'          => 'DESC',
        'orderby'        => 'date',
    );

    // Query Types
    switch ( $type ) {
        case 'featured':
            $args['tax_query'][] = array(
                'taxonomy' => 'product_visibility',
                'field'    => 'name',
                'terms'    => 'featured',
            );
            break;
        case 'onsale':
            $args['post__in'] = wc_get_product_ids_on_sale();
            break;
        case 'bestsellers':
            $args['meta_key'] = 'total_sales';
            $args['orderby']  = 'meta_value_num';
            break;
        case 'latest':
        default:
            $args['orderby'] = 'date';
            break;
    }

    // Apply custom sort (skip for bestsellers — they're sorted by total_sales; skip for post__in/relevance)
    if ( 'bestsellers' !== $type ) {
        if ( 'price' === $sort_by ) {
            $args['meta_key'] = '_price';
            $args['orderby']  = 'meta_value_num';
            $args['order']    = $sort_order;
        } elseif ( 'rating' === $sort_by ) {
            $args['meta_key'] = '_wc_average_rating';
            $args['orderby']  = 'meta_value_num';
            $args['order']    = $sort_order;
        } elseif ( 'rand' === $sort_by ) {
            $args['orderby'] = 'rand';
        } elseif ( in_array( $sort_by, array( 'date', 'title', 'modified' ), true ) ) {
            $args['orderby'] = $sort_by;
            $args['order']   = $sort_order;
        }
    }

    // Specific Products overrides type
    if ( ! empty( $include ) ) {
        $args['post__in'] = $include;
        $args['orderby'] = 'post__in'; // Preserve order
    }

    // Text Search
    if ( ! empty( $term ) ) {
        $args['s'] = $term;
        $args['orderby'] = 'relevance'; // Search results irrelevant of type usually
    }

    // Taxonomy Filters
    $tax_query = isset( $args['tax_query'] ) ? $args['tax_query'] : array();
    
    if ( ! empty( $category ) ) {
        $tax_query[] = array(
            'taxonomy' => 'product_cat',
            'field'    => 'slug',
            'terms'    => $category,
        );
    }
    
    if ( ! empty( $authors ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_author',
            'field'    => 'slug',
            'terms'    => $authors,
        );
    }
    
    if ( ! empty( $publishers ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_publisher',
            'field'    => 'slug',
            'terms'    => $publishers,
        );
    }

    if ( ! empty( $genres ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_genre',
            'field'    => 'slug',
            'terms'    => $genres,
        );
    }

    if ( ! empty( $collections ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_collection',
            'field'    => 'slug',
            'terms'    => $collections,
        );
    }

    if ( ! empty( $tax_query ) ) {
        if ( count( $tax_query ) > 1 ) {
            $tax_query['relation'] = 'AND';
        }
        $args['tax_query'] = $tax_query;
    }

    $product_posts = get_posts( $args );
    $ids = array_map( 'intval', wp_list_pluck( $product_posts, 'ID' ) );

    // When search term looks like ISBN, also find by meta _rmss_isbn and merge
    if ( ! empty( $term ) && preg_match( '/^[\d\-]{9,17}$/', preg_replace( '/\s/', '', $term ) ) ) {
        $isbn_ids = get_posts( array(
            'post_type'      => 'product',
            'posts_per_page' => $limit,
            'post_status'    => 'publish',
            'fields'         => 'ids',
            'meta_query'     => array(
                array( 'key' => '_rmss_isbn', 'value' => sanitize_text_field( $term ), 'compare' => 'LIKE' ),
            ),
        ) );
        $ids = array_unique( array_merge( $ids, (array) $isbn_ids ) );
    }

    if ( ! empty( $ids ) ) {
        $ids = array_values( array_unique( array_map( 'intval', $ids ) ) );
        if ( function_exists( 'prime_post_caches' ) ) {
            prime_post_caches( $ids, true );
        } else {
            _prime_post_caches( $ids, true, true );
        }
        update_object_term_cache( $ids, 'product' );
    }

    $results = array();
    foreach ( $ids as $id ) {
        $product = wc_get_product( $id );
        if ( ! $product ) continue;

        // Authors
        $author_terms = get_the_terms( $id, 'rmss_author' );
        $author_names = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'name' ) : array();

        // Check for newness (e.g. added in last 30 days)
        $is_new = ( time() - strtotime( $product->get_date_created() ) ) < ( 30 * DAY_IN_SECONDS );
        
        $regular_price = $product->get_regular_price();
        $sale_price    = $product->get_sale_price();
        $thumb_url = get_the_post_thumbnail_url( $id, 'woocommerce_thumbnail' ) ?: '';
        $image_url = get_the_post_thumbnail_url( $id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $id, 'large' ) ?: $thumb_url;
        $results[] = array(
            'id'             => $id,
            'title'          => $product->get_title(),
            'thumbnail'      => $thumb_url,
            'image'          => $image_url,
            'authors'        => implode( ', ', $author_names ),
            'price'          => wp_kses_post( $product->get_price_html() ), // WC HTML, kses-sanitized
            'price_plain'    => $product->get_price() 
                ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) . number_format( (float) $product->get_price(), 2 )
                : __( 'Free', 'shelfsage' ), // Plain text version
            'regular_price'  => $regular_price !== '' ? (float) $regular_price : null,
            'sale_price'     => $sale_price !== '' ? (float) $sale_price : null,
            'permalink'      => get_permalink( $id ),
            'isbn'        => get_post_meta( $id, '_rmss_isbn', true ),
            'pages'       => get_post_meta( $id, '_rmss_pages', true ),
            'badge'       => get_post_meta( $id, '_rmss_product_badge', true ), // Add Badge
            'rating'      => (float) $product->get_average_rating(),
            'rating_html' => wp_kses_post( wc_get_rating_html( $product->get_average_rating(), $product->get_review_count() ) ),
            'review_count' => (int) $product->get_review_count(),
            'is_on_sale'  => $product->is_on_sale(),
            'is_new'      => $is_new,
            'category'    => wc_get_product_category_list( $id ),
            'summary'        => wp_trim_words( $product->get_short_description(), 15 ),
            'look_inside_url' => get_post_meta( $id, '_rmss_look_inside_url', true ) ?: '',
        );
    }

    // Cache for 1 hour (skip when no_cache=1 e.g. admin preview)
    if ( ! $skip_cache ) {
        $cache_key = 'trsss_search_v8_' . md5( trsss_search_cache_param_payload( $params ) );
        set_transient( $cache_key, $results, HOUR_IN_SECONDS );
    }

    return $results;
}

/**
 * Handle Filters Request (Authors, Publishers, Genres)
 */
function trsss_handle_filters( $request ) {
    $rl = trsss_public_rest_rate_limit_check( 'filters' );
    if ( is_wp_error( $rl ) ) {
        return $rl;
    }

    $ttl = (int) apply_filters( 'trsss_filters_tax_transient_ttl', 12 * HOUR_IN_SECONDS );
    if ( $ttl < 60 ) {
        $ttl = 60;
    }

    $map = array(
        'authors'     => 'rmss_author',
        'publishers'  => 'rmss_publisher',
        'genres'      => 'rmss_genre',
        'collections' => 'rmss_collection',
    );

    $data = array();
    foreach ( $map as $key => $taxonomy ) {
        $ck = trsss_filters_transient_key_for_taxonomy( $taxonomy );

        if ( apply_filters( 'trsss_filters_use_wp_object_cache_first', true ) ) {
            $cached = wp_cache_get( $ck, 'shelfsage_filters' );
            if ( false === $cached ) {
                $cached = get_transient( $ck );
                if ( false !== $cached && is_array( $cached ) ) {
                    wp_cache_set( $ck, $cached, 'shelfsage_filters', $ttl );
                }
            }
        } else {
            $cached = get_transient( $ck );
        }

        if ( false !== $cached && is_array( $cached ) ) {
            $data[ $key ] = $cached;
            continue;
        }

        $built = trsss_build_filters_term_payload( $taxonomy );
        set_transient( $ck, $built, $ttl );
        wp_cache_set( $ck, $built, 'shelfsage_filters', $ttl );
        $data[ $key ] = $built;
    }

    return $data;
}

function trsss_handle_related_books( $request ) {
    $rl = trsss_public_rest_rate_limit_check( 'related' );
    if ( is_wp_error( $rl ) ) {
        return $rl;
    }

    $product_id = (int) $request['product_id'];
    $limit      = (int) $request['limit'];
    if ( $limit < 1 || $limit > 20 ) {
        $limit = 6;
    }

    $product = wc_get_product( $product_id );
    if ( ! $product ) {
        return rest_ensure_response( array() );
    }

    $author_terms    = get_the_terms( $product_id, 'rmss_author' );
    $genre_terms     = get_the_terms( $product_id, 'rmss_genre' );
    $publisher_terms = get_the_terms( $product_id, 'rmss_publisher' );

    $author_ids    = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'term_id' ) : array();
    $genre_ids     = $genre_terms && ! is_wp_error( $genre_terms ) ? wp_list_pluck( $genre_terms, 'term_id' ) : array();
    $publisher_ids = $publisher_terms && ! is_wp_error( $publisher_terms ) ? wp_list_pluck( $publisher_terms, 'term_id' ) : array();

    if ( empty( $author_ids ) && empty( $genre_ids ) && empty( $publisher_ids ) ) {
        return rest_ensure_response( array() );
    }

    $tax_query = array( 'relation' => 'OR' );
    if ( ! empty( $author_ids ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_author',
            'field'    => 'term_id',
            'terms'    => array_map( 'intval', $author_ids ),
        );
    }
    if ( ! empty( $genre_ids ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_genre',
            'field'    => 'term_id',
            'terms'    => array_map( 'intval', $genre_ids ),
        );
    }
    if ( ! empty( $publisher_ids ) ) {
        $tax_query[] = array(
            'taxonomy' => 'rmss_publisher',
            'field'    => 'term_id',
            'terms'    => array_map( 'intval', $publisher_ids ),
        );
    }

    $fetch_cap = max( min( $limit * 15, 90 ), $limit + 10 );

    $q = new WP_Query(
        array(
            'post_type'      => 'product',
            'posts_per_page' => $fetch_cap,
            'post_status'    => 'publish',
            'post__not_in'   => array( $product_id ),
            'fields'         => 'ids',
            'tax_query'      => $tax_query,
            'orderby'        => 'date',
            'order'          => 'DESC',
            'no_found_rows'  => true,
        )
    );

    if ( ! $q->have_posts() ) {
        return rest_ensure_response( array() );
    }

    $candidates = array_map( 'intval', $q->posts );
    if ( function_exists( 'prime_post_caches' ) ) {
        prime_post_caches( $candidates, true );
    } else {
        _prime_post_caches( $candidates, true, true );
    }
    update_object_term_cache( $candidates, 'product' );

    $author_set    = array_fill_keys( array_map( 'intval', $author_ids ), true );
    $genre_set     = array_fill_keys( array_map( 'intval', $genre_ids ), true );
    $publisher_set = array_fill_keys( array_map( 'intval', $publisher_ids ), true );

    $scored = array();
    foreach ( $candidates as $cid ) {
        $score = 0;
        $t_a   = get_the_terms( $cid, 'rmss_author' );
        if ( $t_a && ! is_wp_error( $t_a ) ) {
            foreach ( $t_a as $t ) {
                if ( isset( $author_set[ $t->term_id ] ) ) {
                    $score += 100;
                    break;
                }
            }
        }
        $t_g = get_the_terms( $cid, 'rmss_genre' );
        if ( $t_g && ! is_wp_error( $t_g ) ) {
            foreach ( $t_g as $t ) {
                if ( isset( $genre_set[ $t->term_id ] ) ) {
                    $score += 10;
                    break;
                }
            }
        }
        $t_p = get_the_terms( $cid, 'rmss_publisher' );
        if ( $t_p && ! is_wp_error( $t_p ) ) {
            foreach ( $t_p as $t ) {
                if ( isset( $publisher_set[ $t->term_id ] ) ) {
                    $score += 1;
                    break;
                }
            }
        }
        $scored[] = array(
            'id'    => $cid,
            'score' => $score,
            'ts'    => (int) get_post_modified_time( 'U', true, $cid ),
        );
    }

    usort(
        $scored,
        static function ( $a, $b ) {
            if ( $a['score'] !== $b['score'] ) {
                return $b['score'] - $a['score'];
            }
            return $b['ts'] - $a['ts'];
        }
    );

    $sorted_ids = array();
    foreach ( $scored as $row ) {
        if ( $row['score'] < 1 ) {
            continue;
        }
        $sorted_ids[] = $row['id'];
        if ( count( $sorted_ids ) >= $limit ) {
            break;
        }
    }

    $results = array();
    foreach ( $sorted_ids as $id ) {
        $p = wc_get_product( $id );
        if ( ! $p ) {
            continue;
        }
        $author_terms_i = get_the_terms( $id, 'rmss_author' );
        $author_names = $author_terms_i && ! is_wp_error( $author_terms_i ) ? wp_list_pluck( $author_terms_i, 'name' ) : array();
        $is_new       = ( time() - strtotime( $p->get_date_created() ) ) < ( 30 * DAY_IN_SECONDS );
        $reg          = $p->get_regular_price();
        $sale         = $p->get_sale_price();
        $thumb_url = get_the_post_thumbnail_url( $id, 'woocommerce_thumbnail' ) ?: '';
        $image_url = get_the_post_thumbnail_url( $id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $id, 'large' ) ?: $thumb_url;
        $results[] = array(
            'id'             => $id,
            'title'          => $p->get_title(),
            'thumbnail'      => $thumb_url,
            'image'          => $image_url,
            'authors'        => implode( ', ', $author_names ),
            'price'          => wp_kses_post( $p->get_price_html() ),
            'price_plain'    => $p->get_price()
                ? html_entity_decode( get_woocommerce_currency_symbol(), ENT_QUOTES | ENT_HTML5, 'UTF-8' )
                    . number_format( (float) $p->get_price(), 2 )
                : __( 'Free', 'shelfsage' ),
            'regular_price'  => $reg !== '' ? (float) $reg : null,
            'sale_price'     => $sale !== '' ? (float) $sale : null,
            'permalink'      => get_permalink( $id ),
            'isbn'           => get_post_meta( $id, '_rmss_isbn', true ),
            'pages'          => get_post_meta( $id, '_rmss_pages', true ),
            'badge'          => get_post_meta( $id, '_rmss_product_badge', true ),
            'rating'         => (float) $p->get_average_rating(),
            'rating_html'    => wp_kses_post( wc_get_rating_html( $p->get_average_rating(), $p->get_review_count() ) ),
            'review_count'   => (int) $p->get_review_count(),
            'is_on_sale'     => $p->is_on_sale(),
            'is_new'         => $is_new,
            'category'       => wc_get_product_category_list( $id ),
            'summary'        => wp_trim_words( $p->get_short_description(), 15 ),
            'look_inside_url' => get_post_meta( $id, '_rmss_look_inside_url', true ) ?: '',
        );
    }

    return rest_ensure_response( $results );
}

function trsss_get_products_rest( $request ) {
    $params = $request->get_params();
    $search = isset( $params['search'] ) ? sanitize_text_field( $params['search'] ) : '';
    
    // Query Args - Reuse logic from AJAX endpoint
    $args = array(
        'post_type'      => 'product',
        'posts_per_page' => 50, // Increased limit for admin
        'post_status'    => 'publish',
        'orderby'        => 'date',
        'order'          => 'DESC'
    );

    // If search term provided
    if ( ! empty( $search ) ) {
        $args['s'] = $search;
        $args['orderby'] = 'relevance';
    }

    $query = new WP_Query( $args );
    $results = array();

    if ( $query->have_posts() ) {
        while ( $query->have_posts() ) {
            $query->the_post();
            $product_id = get_the_ID();
            $product = wc_get_product( $product_id );
            
            if ( ! $product ) continue;

            $author_terms = get_the_terms( $product_id, 'rmss_author' );
            $author_names = $author_terms && ! is_wp_error( $author_terms ) ? wp_list_pluck( $author_terms, 'name' ) : array();

            $thumb_url = get_the_post_thumbnail_url( $product_id, 'woocommerce_thumbnail' ) ?: '';
            $image_url = get_the_post_thumbnail_url( $product_id, 'woocommerce_single' ) ?: get_the_post_thumbnail_url( $product_id, 'large' ) ?: $thumb_url;
            $results[] = array(
                'id'             => $product_id,
                'title'          => $product->get_title(),
                'author'         => implode( ', ', $author_names ),
                'price'          => $product->get_price() ? '$' . number_format( (float) $product->get_price(), 2 ) : 'N/A',
                'thumbnail'      => $thumb_url,
                'image'          => $image_url,
                'isbn'           => get_post_meta( $product_id, '_rmss_isbn', true ),
                'stock_quantity' => $product->get_stock_quantity(),
                'stock_status'   => $product->get_stock_status(),
            );
        }
        wp_reset_postdata();
    }

    return rest_ensure_response( $results );
}

/**
 * Get Taxonomy Terms for Shortcode Architect (REST API)
 */
function trsss_get_taxonomy_terms_rest( $request ) {
    $taxonomy = $request['taxonomy'];
    
    // Validate taxonomy
    $allowed_taxonomies = array( 'rmss_genre', 'rmss_author', 'rmss_publisher', 'product_cat' );
    if ( ! in_array( $taxonomy, $allowed_taxonomies ) ) {
        return new WP_Error( 'invalid_taxonomy', 'Invalid taxonomy', array( 'status' => 400 ) );
    }

    $terms = get_terms( array( 
        'taxonomy'   => $taxonomy, 
        'hide_empty' => false // Show all terms for admin
    ) );

    if ( is_wp_error( $terms ) ) {
        return new WP_Error( 'taxonomy_error', $terms->get_error_message(), array( 'status' => 500 ) );
    }

    $results = array();
    foreach ( $terms as $term ) {
        $results[] = array(
            'id'    => $term->term_id,
            'name'  => $term->name,
            'slug'  => $term->slug,
            'count' => $term->count,
        );
    }

    return rest_ensure_response( $results );
}
