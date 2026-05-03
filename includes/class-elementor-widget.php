<?php
if (!defined('ABSPATH')) {
	exit;
}

/**
 * Elementor ShelfSage Books Widget
 */
class ShelfSage_Elementor_Widget extends \Elementor\Widget_Base {

	public function get_name() {
		return 'shelfsage_books';
	}

	public function get_title() {
		return __('ShelfSage Books', 'shelfsage');
	}

	public function get_icon() {
		return 'eicon-posts-grid';
	}

	public function get_categories() {
		return array('general', 'theme');
	}

	public function get_keywords() {
		return array('shelfsage', 'books', 'book grid', 'woocommerce', 'shortcode');
	}

	public function get_script_depends() {
		return array('trsss-app-js');
	}

	public function get_style_depends() {
		return array('trsss-app-css');
	}

	protected function register_controls() {
		$shortcodes = get_posts(array(
			'post_type' => 'rmss_shortcode',
			'post_status' => 'publish',
			'posts_per_page' => 100,
			'orderby' => 'modified',
			'order' => 'DESC',
		));

		$options = array('' => __('— Select Design —', 'shelfsage'));
		foreach ($shortcodes as $post) {
			$options[(string) $post->ID] = $post->post_title . ' (#' . $post->ID . ')';
		}

		$this->start_controls_section('content_section', array(
			'label' => __('ShelfSage Settings', 'shelfsage'),
			'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
		));

		$this->add_control('shortcode_id', array(
			'label' => __('Select Design', 'shelfsage'),
			'type' => \Elementor\Controls_Manager::SELECT,
			'options' => $options,
			'default' => '',
			'description' => __('Choose a saved shortcode design from ShelfSage → Shortcode Architect.', 'shelfsage'),
		));

		$this->end_controls_section();
	}

	protected function render() {
		$settings = $this->get_settings_for_display();
		$id = !empty($settings['shortcode_id']) ? absint($settings['shortcode_id']) : 0;
		if ($id) {
			echo trsss_render_books_shortcode(array('id' => (string) $id));
		} else {
			echo '<p class="elementor-alert elementor-alert-warning">' . esc_html__('Please select a ShelfSage design.', 'shelfsage') . '</p>';
		}
	}
}

/**
 * Register Elementor Widgets (called from shelfsage.php only when Elementor is active)
 */
function trsss_register_elementor_widgets($widgets_manager) {
	$widgets_manager->register(new ShelfSage_Elementor_Widget());
}
