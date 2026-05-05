<?php
/**
 * ShelfSage book review enhancements.
 *
 * @package ShelfSage
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

if ( ! class_exists( 'TRSSS_Book_Reviews' ) ) {
	/**
	 * Allows guest product reviews and adds verified purchase badges.
	 */
	class TRSSS_Book_Reviews {
		const VERIFIED_META_KEY = '_trsss_verified_purchase';

		/**
		 * Product context while rendering the reviews shortcode.
		 *
		 * @var int
		 */
		private $shortcode_product_id = 0;

		/**
		 * Register hooks.
		 */
		public function __construct() {
			add_filter( 'pre_option_woocommerce_review_rating_verification_required', array( $this, 'allow_guest_reviews' ) );
			add_filter( 'pre_option_comment_registration', array( $this, 'allow_guest_comments' ) );
			add_filter( 'woocommerce_product_review_comment_form_args', array( $this, 'customize_review_form' ) );
			add_action( 'comment_post', array( $this, 'store_verified_purchase_meta' ), 10, 3 );
			add_action( 'edit_comment', array( $this, 'refresh_verified_purchase_meta' ) );
			add_action( 'woocommerce_review_before_comment_text', array( $this, 'render_verified_purchase_badge' ), 5 );
			add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_styles' ), 20 );
			add_shortcode( 'shelfsage_book_reviews', array( $this, 'render_shortcode' ) );
		}

		public function allow_guest_reviews( $value ) {
			return $this->is_product_review_context() ? 'no' : $value;
		}

		public function allow_guest_comments( $value ) {
			return $this->is_product_review_context() ? 0 : $value;
		}

		public function customize_review_form( $args ) {
			if ( ! $this->is_product_review_context() ) {
				return $args;
			}

			$args['title_reply'] = __( 'Write a Book Review', 'shelfsage' );
			$args['comment_notes_before'] = '<p class="trsss-review-note">' . esc_html__( 'Guest reviews are welcome. Verified purchase badges appear automatically for customers with matching orders.', 'shelfsage' ) . '</p>';

			return $args;
		}

		public function render_shortcode( $atts ) {
			$atts = shortcode_atts(
				array(
					'product_id' => get_the_ID(),
				),
				$atts,
				'shelfsage_book_reviews'
			);

			$product_id = absint( $atts['product_id'] );
			if ( ! $this->is_product( $product_id ) ) {
				return '';
			}

			$product_post = get_post( $product_id );
			if ( ! $product_post ) {
				return '';
			}

			global $post;

			$previous_post              = $post;
			$this->shortcode_product_id = $product_id;
			$post                       = $product_post;

			setup_postdata( $post );
			$this->enqueue_styles();

			ob_start();
			echo '<div class="trsss-book-reviews-shortcode">';
			comments_template();
			echo '</div>';
			$output = ob_get_clean();

			wp_reset_postdata();
			$post                       = $previous_post;
			$this->shortcode_product_id = 0;

			return $output;
		}

		public function store_verified_purchase_meta( $comment_id, $approved, $commentdata ) {
			unset( $approved, $commentdata );

			$comment = get_comment( $comment_id );
			if ( ! $comment || ! $this->is_product_review( $comment ) ) {
				return;
			}

			$this->update_verified_purchase_meta( $comment );
		}

		public function refresh_verified_purchase_meta( $comment_id ) {
			$comment = get_comment( $comment_id );
			if ( ! $comment || ! $this->is_product_review( $comment ) ) {
				return;
			}

			$this->update_verified_purchase_meta( $comment );
		}

		public function render_verified_purchase_badge( $comment ) {
			if ( ! $comment instanceof WP_Comment || ! $this->is_product_review( $comment ) ) {
				return;
			}

			$is_verified = get_comment_meta( $comment->comment_ID, self::VERIFIED_META_KEY, true );
			if ( '' === $is_verified ) {
				$is_verified = $this->is_verified_purchase( $comment ) ? 'yes' : 'no';
			}

			if ( 'yes' !== $is_verified ) {
				return;
			}

			echo '<span class="trsss-verified-purchase-badge" aria-label="' . esc_attr__( 'Verified purchase review', 'shelfsage' ) . '">' . esc_html__( 'Verified Purchase', 'shelfsage' ) . '</span>';
		}

		public function enqueue_styles() {
			if ( ! $this->is_product_review_context() && ! $this->page_has_reviews_shortcode() ) {
				return;
			}

			wp_register_style( 'trsss-book-reviews', false, array(), defined( 'TRSSS_VERSION' ) ? TRSSS_VERSION : null );
			wp_enqueue_style( 'trsss-book-reviews' );
			wp_add_inline_style(
				'trsss-book-reviews',
				'.trsss-review-note{margin:0 0 14px;color:#475569;font-size:14px;line-height:1.55}.trsss-verified-purchase-badge{display:inline-flex;align-items:center;width:max-content;margin:8px 0 10px;padding:4px 9px;border:1px solid rgba(22,163,74,.25);border-radius:999px;background:#ecfdf5;color:#166534;font-size:12px;font-weight:700;line-height:1.2;text-transform:uppercase;letter-spacing:.03em}.comment-text .trsss-verified-purchase-badge,.description .trsss-verified-purchase-badge{clear:both}.trsss-book-reviews-shortcode{width:100%;max-width:920px;margin:0 auto}'
			);
		}

		private function update_verified_purchase_meta( $comment ) {
			update_comment_meta( $comment->comment_ID, self::VERIFIED_META_KEY, $this->is_verified_purchase( $comment ) ? 'yes' : 'no' );
		}

		private function is_verified_purchase( $comment ) {
			if ( ! function_exists( 'wc_customer_bought_product' ) ) {
				return false;
			}

			$email = sanitize_email( $comment->comment_author_email );
			if ( empty( $email ) && empty( $comment->user_id ) ) {
				return false;
			}

			return wc_customer_bought_product( $email, (int) $comment->user_id, (int) $comment->comment_post_ID );
		}

		private function is_product_review_context() {
			if ( $this->shortcode_product_id && $this->is_product( $this->shortcode_product_id ) ) {
				return true;
			}

			$post_id = $this->get_request_product_id();
			if ( $post_id && $this->is_product( $post_id ) ) {
				return true;
			}

			return function_exists( 'is_product' ) && is_product();
		}

		private function page_has_reviews_shortcode() {
			if ( ! is_singular() ) {
				return false;
			}

			$post = get_post();
			return $post && has_shortcode( $post->post_content, 'shelfsage_book_reviews' );
		}

		private function get_request_product_id() {
			if ( isset( $_POST['comment_post_ID'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
				return absint( wp_unslash( $_POST['comment_post_ID'] ) ); // phpcs:ignore WordPress.Security.NonceVerification.Missing
			}

			return get_queried_object_id();
		}

		private function is_product( $post_id ) {
			return $post_id && 'product' === get_post_type( $post_id );
		}

		private function is_product_review( $comment ) {
			return 'review' === $comment->comment_type && $this->is_product( (int) $comment->comment_post_ID );
		}
	}

	new TRSSS_Book_Reviews();
}