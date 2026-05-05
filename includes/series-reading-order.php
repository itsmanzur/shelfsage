<?php
/**
 * ShelfSage series reading order management.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const TRSSS_SERIES_ORDER_META = '_trsss_series_order';

/**
 * Add the product-side series order meta box.
 *
 * @return void
 */
function trsss_series_order_add_meta_box() {
	add_meta_box(
		'trsss_series_order',
		__( 'Series Reading Order', 'shelfsage' ),
		'trsss_series_order_render_meta_box',
		'product',
		'side',
		'default'
	);
}
add_action( 'add_meta_boxes', 'trsss_series_order_add_meta_box' );

/**
 * Render series order field.
 *
 * @param WP_Post $post Product post.
 * @return void
 */
function trsss_series_order_render_meta_box( $post ) {
	wp_nonce_field( 'trsss_save_series_order', 'trsss_series_order_nonce' );

	$order  = get_post_meta( $post->ID, TRSSS_SERIES_ORDER_META, true );
	$series = get_the_terms( $post->ID, 'rmss_series' );
	$names  = is_array( $series ) ? wp_list_pluck( $series, 'name' ) : array();

	echo '<p style="margin-top:0;color:#64748b;">' . esc_html__( 'Set where this book belongs inside its series. Decimals are allowed for novellas or side stories.', 'shelfsage' ) . '</p>';
	echo '<label for="trsss_series_order" style="display:block;font-weight:600;margin-bottom:6px;">' . esc_html__( 'Reading order', 'shelfsage' ) . '</label>';
	echo '<input type="number" step="0.01" min="0" name="trsss_series_order" id="trsss_series_order" value="' . esc_attr( $order ) . '" style="width:100%;" placeholder="1" />';

	if ( ! empty( $names ) ) {
		echo '<p style="margin:10px 0 0;color:#475569;"><strong>' . esc_html__( 'Series:', 'shelfsage' ) . '</strong> ' . esc_html( implode( ', ', $names ) ) . '</p>';
	} else {
		echo '<p style="margin:10px 0 0;color:#b45309;">' . esc_html__( 'Assign a Book Series term to use the reading order list.', 'shelfsage' ) . '</p>';
	}
}

/**
 * Save series order field.
 *
 * @param int $post_id Product ID.
 * @return void
 */
function trsss_series_order_save_meta( $post_id ) {
	if ( 'product' !== get_post_type( $post_id ) ) {
		return;
	}

	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
		return;
	}

	if ( ! isset( $_POST['trsss_series_order_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['trsss_series_order_nonce'] ) ), 'trsss_save_series_order' ) ) {
		return;
	}

	if ( ! current_user_can( 'edit_post', $post_id ) ) {
		return;
	}

	if ( ! isset( $_POST['trsss_series_order'] ) ) {
		return;
	}

	$value = trim( sanitize_text_field( wp_unslash( $_POST['trsss_series_order'] ) ) );
	if ( '' === $value ) {
		delete_post_meta( $post_id, TRSSS_SERIES_ORDER_META );
		return;
	}

	update_post_meta( $post_id, TRSSS_SERIES_ORDER_META, (string) (float) $value );
}
add_action( 'save_post_product', 'trsss_series_order_save_meta' );

/**
 * Add admin product column.
 *
 * @param array $columns Columns.
 * @return array
 */
function trsss_series_order_product_columns( $columns ) {
	if ( isset( $columns['trsss_series_order'] ) ) {
		return $columns;
	}

	$updated  = array();
	$inserted = false;

	foreach ( $columns as $key => $label ) {
		$updated[ $key ] = $label;

		if ( in_array( $key, array( 'name', 'title', 'product_cat' ), true ) ) {
			$updated['trsss_series_order'] = __( 'Series Order', 'shelfsage' );
			$inserted = true;
		}
	}

	if ( ! $inserted ) {
		$updated['trsss_series_order'] = __( 'Series Order', 'shelfsage' );
	}

	return $updated;
}
add_filter( 'manage_edit-product_columns', 'trsss_series_order_product_columns', 99 );
add_filter( 'manage_product_posts_columns', 'trsss_series_order_product_columns', 99 );

/**
 * Render product list column.
 *
 * @param string $column Column name.
 * @param int    $post_id Product ID.
 * @return void
 */
function trsss_series_order_product_column_content( $column, $post_id ) {
	if ( 'trsss_series_order' !== $column ) {
		return;
	}

	$order = get_post_meta( $post_id, TRSSS_SERIES_ORDER_META, true );
	echo '' !== $order ? esc_html( $order ) : '&mdash;';
}
add_action( 'manage_product_posts_custom_column', 'trsss_series_order_product_column_content', 10, 2 );

/**
 * Sort rmss_series archives by reading order.
 *
 * @param WP_Query $query Query object.
 * @return void
 */
function trsss_series_order_sort_archive( $query ) {
	if ( is_admin() || ! $query->is_main_query() || ! $query->is_tax( 'rmss_series' ) ) {
		return;
	}

	$query->set( 'posts_per_page', -1 );
	$query->set( 'trsss_series_order_archive', true );
}
add_action( 'pre_get_posts', 'trsss_series_order_sort_archive' );

/**
 * Keep unnumbered books visible while sorting numbered series books first.
 *
 * @param array    $clauses SQL clauses.
 * @param WP_Query $query   Query object.
 * @return array
 */
function trsss_series_order_archive_clauses( $clauses, $query ) {
	if ( ! $query->get( 'trsss_series_order_archive' ) ) {
		return $clauses;
	}

	global $wpdb;

	$alias = 'trsss_series_order_meta';
	if ( false === strpos( $clauses['join'], $alias ) ) {
		$clauses['join'] .= $wpdb->prepare( " LEFT JOIN {$wpdb->postmeta} AS {$alias} ON ({$wpdb->posts}.ID = {$alias}.post_id AND {$alias}.meta_key = %s) ", TRSSS_SERIES_ORDER_META );
	}

	$clauses['orderby'] = "CASE WHEN {$alias}.meta_value IS NULL OR {$alias}.meta_value = '' THEN 1 ELSE 0 END ASC, CAST({$alias}.meta_value AS DECIMAL(10,2)) ASC, {$wpdb->posts}.post_title ASC";

	return $clauses;
}
add_filter( 'posts_clauses', 'trsss_series_order_archive_clauses', 10, 2 );

/**
 * Get ordered books for the first assigned series on a product.
 *
 * @param int $product_id Product ID.
 * @return array
 */
function trsss_series_order_get_books( $product_id ) {
	$series_terms = get_the_terms( $product_id, 'rmss_series' );
	if ( ! is_array( $series_terms ) || empty( $series_terms ) ) {
		return array();
	}

	$series = reset( $series_terms );
	$posts  = get_posts(
		array(
			'post_type'      => 'product',
			'post_status'    => 'publish',
			'posts_per_page' => -1,
			'tax_query'      => array(
				array(
					'taxonomy' => 'rmss_series',
					'field'    => 'term_id',
					'terms'    => (int) $series->term_id,
				),
			),
		)
	);

	usort(
		$posts,
		function ( $a, $b ) {
			$a_order = get_post_meta( $a->ID, TRSSS_SERIES_ORDER_META, true );
			$b_order = get_post_meta( $b->ID, TRSSS_SERIES_ORDER_META, true );
			$a_sort  = '' === $a_order ? PHP_FLOAT_MAX : (float) $a_order;
			$b_sort  = '' === $b_order ? PHP_FLOAT_MAX : (float) $b_order;

			if ( $a_sort === $b_sort ) {
				return strcasecmp( $a->post_title, $b->post_title );
			}

			return $a_sort <=> $b_sort;
		}
	);

	return array(
		'series' => $series,
		'books'  => $posts,
	);
}

/**
 * Render series reading order list.
 *
 * @param int $product_id Product ID.
 * @return string
 */
function trsss_series_order_render_list( $product_id ) {
	$data = trsss_series_order_get_books( $product_id );
	if ( empty( $data['series'] ) || empty( $data['books'] ) || count( $data['books'] ) < 2 ) {
		return '';
	}

	ob_start();
	?>
	<div class="trsss-series-order">
		<div class="trsss-series-order__head">
			<span class="trsss-series-order__eyebrow"><?php esc_html_e( 'Reading Order', 'shelfsage' ); ?></span>
			<h3><?php echo esc_html( $data['series']->name ); ?></h3>
		</div>
		<ol class="trsss-series-order__list">
			<?php foreach ( $data['books'] as $book ) : ?>
				<?php
				$order      = get_post_meta( $book->ID, TRSSS_SERIES_ORDER_META, true );
				$is_current = (int) $book->ID === (int) $product_id;
				?>
				<li class="trsss-series-order__item<?php echo $is_current ? ' is-current' : ''; ?>">
					<span class="trsss-series-order__number"><?php echo '' !== $order ? esc_html( $order ) : '&ndash;'; ?></span>
					<a href="<?php echo esc_url( get_permalink( $book ) ); ?>"><?php echo esc_html( get_the_title( $book ) ); ?></a>
					<?php if ( $is_current ) : ?>
						<span class="trsss-series-order__current"><?php esc_html_e( 'Current Book', 'shelfsage' ); ?></span>
					<?php endif; ?>
				</li>
			<?php endforeach; ?>
		</ol>
	</div>
	<?php
	return ob_get_clean();
}

/**
 * Shortcode: [shelfsage_series_order product_id="123"].
 *
 * @param array $atts Shortcode attrs.
 * @return string
 */
function trsss_series_order_shortcode( $atts ) {
	$atts = shortcode_atts(
		array(
			'product_id' => get_the_ID(),
		),
		$atts,
		'shelfsage_series_order'
	);

	$product_id = absint( $atts['product_id'] );
	if ( ! $product_id || 'product' !== get_post_type( $product_id ) ) {
		return '';
	}

	return trsss_series_order_render_list( $product_id );
}
add_shortcode( 'shelfsage_series_order', 'trsss_series_order_shortcode' );

/**
 * Add WooCommerce product tab for the series order.
 *
 * @param array $tabs Product tabs.
 * @return array
 */
function trsss_series_order_product_tab( $tabs ) {
	global $product;
	if ( ! $product || ! trsss_series_order_render_list( $product->get_id() ) ) {
		return $tabs;
	}

	$tabs['trsss_series_order'] = array(
		'title'    => __( 'Series Order', 'shelfsage' ),
		'priority' => 18,
		'callback' => 'trsss_series_order_product_tab_content',
	);

	return $tabs;
}
add_filter( 'woocommerce_product_tabs', 'trsss_series_order_product_tab' );

/**
 * Render WooCommerce product tab content.
 *
 * @return void
 */
function trsss_series_order_product_tab_content() {
	global $product;
	if ( ! $product ) {
		return;
	}

	echo trsss_series_order_render_list( $product->get_id() ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
}

/**
 * Enqueue frontend styles for series order UI.
 *
 * @return void
 */
function trsss_series_order_enqueue_styles() {
	wp_register_style( 'trsss-series-order', false, array(), defined( 'TRSSS_VERSION' ) ? TRSSS_VERSION : null );
	wp_enqueue_style( 'trsss-series-order' );
	wp_add_inline_style(
		'trsss-series-order',
		'.trsss-series-order{margin:1.5rem 0;padding:1.25rem;border:1px solid rgba(148,163,184,.22);border-radius:16px;background:#fff;box-shadow:0 14px 36px rgba(15,23,42,.06)}.trsss-series-order__head{margin-bottom:1rem}.trsss-series-order__eyebrow{display:block;margin-bottom:.25rem;color:#7c3aed;font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.trsss-series-order h3{margin:0;color:#0f172a;font-size:1.15rem;font-weight:800}.trsss-series-order__list{display:flex;flex-direction:column;gap:.5rem;margin:0;padding:0;list-style:none}.trsss-series-order__item{display:grid;grid-template-columns:42px minmax(0,1fr) auto;align-items:center;gap:.75rem;padding:.7rem .8rem;border:1px solid #e5e7eb;border-radius:12px;background:#f8fafc}.trsss-series-order__item a{min-width:0;color:#111827;font-weight:700;text-decoration:none}.trsss-series-order__item a:hover{color:#6d28d9}.trsss-series-order__number{display:inline-flex;align-items:center;justify-content:center;min-width:32px;height:28px;border-radius:999px;background:#ede9fe;color:#6d28d9;font-weight:900;font-size:.82rem}.trsss-series-order__current{padding:.25rem .5rem;border-radius:999px;background:#dcfce7;color:#166534;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.trsss-series-order__item.is-current{border-color:#c4b5fd;background:#faf5ff}@media(max-width:520px){.trsss-series-order__item{grid-template-columns:36px minmax(0,1fr)}.trsss-series-order__current{grid-column:2}}'
	);
}
add_action( 'wp_enqueue_scripts', 'trsss_series_order_enqueue_styles', 20 );