<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Taxonomy images, affiliate product tab, and related WooCommerce extensions.
 */
class TRSSS_Extended_Features {

	public function __construct() {
		// Advanced Meta Box
		add_action( 'add_meta_boxes', array( $this, 'add_advanced_meta_box' ) );

		// Taxonomy Image Uploader
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_taxonomy_media' ) );

		// Swap basic taxonomy hooks for enhanced versions bundled in this package
		add_action(
			'init',
			function () {
				remove_action( 'admin_enqueue_scripts', 'trsss_enqueue_media_uploader' );

				remove_action( 'rmss_author_add_form_fields', 'trsss_add_term_image_field_add', 10 );
				remove_action( 'rmss_publisher_add_form_fields', 'trsss_add_term_image_field_add', 10 );
				remove_action( 'rmss_series_add_form_fields', 'trsss_add_term_image_field_add', 10 );
				remove_action( 'rmss_genre_add_form_fields', 'trsss_add_term_image_field_add', 10 );

				remove_action( 'rmss_author_edit_form_fields', 'trsss_edit_term_image_field', 10 );
				remove_action( 'rmss_publisher_edit_form_fields', 'trsss_edit_term_image_field', 10 );
				remove_action( 'rmss_series_edit_form_fields', 'trsss_edit_term_image_field', 10 );
				remove_action( 'rmss_genre_edit_form_fields', 'trsss_edit_term_image_field', 10 );

				remove_action( 'created_rmss_author', 'trsss_save_term_image', 10 );
				remove_action( 'edited_rmss_author', 'trsss_save_term_image', 10 );
				remove_action( 'created_rmss_publisher', 'trsss_save_term_image', 10 );
				remove_action( 'edited_rmss_publisher', 'trsss_save_term_image', 10 );
				remove_action( 'created_rmss_series', 'trsss_save_term_image', 10 );
				remove_action( 'edited_rmss_series', 'trsss_save_term_image', 10 );
				remove_action( 'created_rmss_genre', 'trsss_save_term_image', 10 );
				remove_action( 'edited_rmss_genre', 'trsss_save_term_image', 10 );
			},
			0
		);

		// Taxonomy image hooks (enhanced)
		add_action( 'rmss_author_add_form_fields', array( $this, 'add_term_image_field_add' ), 10, 2 );
		add_action( 'rmss_publisher_add_form_fields', array( $this, 'add_term_image_field_add' ), 10, 2 );
		add_action( 'rmss_series_add_form_fields', array( $this, 'add_term_image_field_add' ), 10, 2 );
		add_action( 'rmss_genre_add_form_fields', array( $this, 'add_term_image_field_add' ), 10, 2 );

		add_action( 'rmss_author_edit_form_fields', array( $this, 'edit_term_image_field' ), 10, 2 );
		add_action( 'rmss_publisher_edit_form_fields', array( $this, 'edit_term_image_field' ), 10, 2 );
		add_action( 'rmss_series_edit_form_fields', array( $this, 'edit_term_image_field' ), 10, 2 );
		add_action( 'rmss_genre_edit_form_fields', array( $this, 'edit_term_image_field' ), 10, 2 );

		add_action( 'created_rmss_author', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'edited_rmss_author', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'created_rmss_publisher', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'edited_rmss_publisher', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'created_rmss_series', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'edited_rmss_series', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'created_rmss_genre', array( $this, 'save_term_image' ), 10, 2 );
		add_action( 'edited_rmss_genre', array( $this, 'save_term_image' ), 10, 2 );

		// Affiliate Product Tab
		add_filter( 'woocommerce_product_data_tabs', array( $this, 'add_affiliate_product_tab' ) );
		add_action( 'woocommerce_product_data_panels', array( $this, 'render_affiliate_product_tab' ) );
		add_action( 'woocommerce_process_product_meta', array( $this, 'save_affiliate_data' ) );

		// Frontend Affiliate Buttons
		add_action( 'woocommerce_after_add_to_cart_button', array( $this, 'display_affiliate_buttons' ), 15 );
	}

	// --- TAXONOMY IMAGE UPLOADER ---

	public function enqueue_taxonomy_media( $hook ) {
		if ( $hook !== 'edit-tags.php' && $hook !== 'term.php' ) {
			return;
		}

		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || empty( $screen->taxonomy ) ) {
			return;
		}

		$allowed = array( 'rmss_author', 'rmss_publisher', 'rmss_series', 'rmss_genre' );
		if ( ! in_array( $screen->taxonomy, $allowed, true ) ) {
			return;
		}

		wp_enqueue_media();
		wp_enqueue_script( 'shelfsage-term-media', TRSSS_URL . 'includes/admin-term-media.js', array( 'jquery' ), '1.0.0', true );
	}

	public function add_term_image_field_add( $taxonomy ) {
		?>
		<div class="form-field term-group">
			<?php wp_nonce_field( 'rmss_term_image', 'rmss_term_image_nonce' ); ?>
			<label for="rmss_term_image_id"><?php esc_html_e( 'Profile Image / Logo', 'shelfsage' ); ?></label>
			<input type="hidden" id="rmss_term_image_id" name="rmss_term_image_id" value="">
			<div id="rmss_term_image_wrapper" style="margin-bottom:10px;"></div>
			<p>
				<input type="button" class="button button-secondary rmss_media_button" value="<?php esc_attr_e( 'Add Image', 'shelfsage' ); ?>" />
				<input type="button" class="button button-secondary rmss_media_remove" value="<?php esc_attr_e( 'Remove Image', 'shelfsage' ); ?>" style="display:none;" />
			</p>
		</div>
		<?php
	}

	public function edit_term_image_field( $term, $taxonomy ) {
		$image_id  = get_term_meta( $term->term_id, 'rmss_image_id', true );
		$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'medium' ) : '';
		?>
		<tr class="form-field term-group-wrap">
			<th scope="row"><label for="rmss_term_image_id"><?php esc_html_e( 'Profile Image / Logo', 'shelfsage' ); ?></label></th>
			<td>
				<?php wp_nonce_field( 'rmss_term_image', 'rmss_term_image_nonce' ); ?>
				<input type="hidden" id="rmss_term_image_id" name="rmss_term_image_id" value="<?php echo esc_attr( $image_id ); ?>">
				<div id="rmss_term_image_wrapper">
					<?php if ( $image_url ) : ?>
						<img src="<?php echo esc_url( $image_url ); ?>" style="max-width:150px;border:1px solid #ccc;padding:2px;" />
					<?php endif; ?>
				</div>
				<p style="margin-top:10px;">
					<input type="button" class="button button-secondary rmss_media_button_edit" value="<?php esc_attr_e( 'Add Image', 'shelfsage' ); ?>" />
					<input type="button" class="button button-secondary rmss_media_remove_edit" value="<?php esc_attr_e( 'Remove Image', 'shelfsage' ); ?>" style="<?php echo $image_id ? '' : 'display:none;'; ?>" />
				</p>
			</td>
		</tr>
		<?php
	}

	public function save_term_image( $term_id ) {
		if ( ! isset( $_POST['rmss_term_image_nonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rmss_term_image_nonce'] ) ), 'rmss_term_image' ) ) {
			return;
		}
		if ( isset( $_POST['rmss_term_image_id'] ) ) {
			update_term_meta( $term_id, 'rmss_image_id', sanitize_text_field( wp_unslash( $_POST['rmss_term_image_id'] ) ) );
		}
	}

	// --- AFFILIATE PRODUCT TAB ---

	public function add_affiliate_product_tab( $tabs ) {
		$tabs['rmss_affiliates'] = array(
			'label'    => __( 'ShelfSage Affiliates', 'shelfsage' ),
			'target'   => 'rmss_affiliate_options',
			'class'    => array( 'show_if_simple', 'show_if_variable' ),
			'priority' => 21,
		);
		return $tabs;
	}

	public function render_affiliate_product_tab() {
		echo '<div id="rmss_affiliate_options" class="panel woocommerce_options_panel">';
		echo '<div class="options_group">';
		echo '<h3>' . esc_html__( 'Affiliate Links', 'shelfsage' ) . '</h3>';
		echo '<p>' . esc_html__( 'Add external buy links (e.g. Amazon, eBay) to show below the cart button.', 'shelfsage' ) . '</p>';

		for ( $i = 1; $i <= 5; $i++ ) {
			woocommerce_wp_text_input(
				array(
					'id'          => '_rmss_affiliate_name_' . $i,
					'label'       => sprintf( esc_html__( 'Button %d Text', 'shelfsage' ), $i ),
					'placeholder' => 'e.g. Buy on Amazon',
					'desc_tip'    => 'true',
					'description' => esc_html__( 'Text for the button', 'shelfsage' ),
				)
			);
			woocommerce_wp_text_input(
				array(
					'id'          => '_rmss_affiliate_url_' . $i,
					'label'       => sprintf( esc_html__( 'Button %d URL', 'shelfsage' ), $i ),
					'placeholder' => 'https://...',
					'desc_tip'    => 'true',
					'description' => esc_html__( 'External link URL', 'shelfsage' ),
				)
			);
			echo '<hr style="margin: 20px 0; border: 0; border-top: 1px solid #eee;">';
		}

		echo '</div>';
		echo '</div>';
	}

	public function save_affiliate_data( $post_id ) {
		if (
			! isset( $_POST['woocommerce_meta_nonce'] ) ||
			! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['woocommerce_meta_nonce'] ) ), 'woocommerce_save_data' )
		) {
			return;
		}

		for ( $i = 1; $i <= 5; $i++ ) {
			$name_key = '_rmss_affiliate_name_' . $i;
			$url_key  = '_rmss_affiliate_url_' . $i;

			if ( isset( $_POST[ $name_key ] ) ) {
				update_post_meta( $post_id, $name_key, sanitize_text_field( wp_unslash( $_POST[ $name_key ] ) ) );
			}
			if ( isset( $_POST[ $url_key ] ) ) {
				update_post_meta( $post_id, $url_key, esc_url_raw( wp_unslash( $_POST[ $url_key ] ) ) );
			}
		}
	}

	// --- FRONTEND AFFILIATE BUTTONS ---

	public function display_affiliate_buttons() {
		global $post;
		echo '<div class="rmss-affiliate-buttons" style="margin-top: 15px;">';
		for ( $i = 1; $i <= 5; $i++ ) {
			$name = get_post_meta( $post->ID, '_rmss_affiliate_name_' . $i, true );
			$url  = get_post_meta( $post->ID, '_rmss_affiliate_url_' . $i, true );
			if ( $name && $url ) {
				echo '<a href="' . esc_url( $url ) . '" class="button alt" target="_blank" style="margin-right: 5px; margin-bottom: 5px;">' . esc_html( $name ) . '</a>';
			}
		}
		echo '</div>';
	}

	// --- ADVANCED META BOX ---

	public function add_advanced_meta_box() {
		add_meta_box(
			'rmss_advanced_meta',
			__( 'ShelfSage Advanced Meta', 'shelfsage' ),
			array( $this, 'render_advanced_meta' ),
			'product',
			'side',
			'low'
		);
	}

	public function render_advanced_meta( $post ) {
		echo '<p>' . esc_html__( 'Extra SEO Data & Rich Snippets enabled.', 'shelfsage' ) . '</p>';
		echo '<p style="color: #666; font-size: 12px;">' . esc_html__( 'Advanced metadata features are active for this product.', 'shelfsage' ) . '</p>';
	}
}

new TRSSS_Extended_Features();
