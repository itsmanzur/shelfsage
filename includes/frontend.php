<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Safe hex for CSS variables (falls back when option is invalid).
 *
 * @param mixed  $maybe_hex Value from settings.
 * @param string $fallback  Default #rrggbb.
 * @return string
 */
function trsss_sanitize_theme_hex($maybe_hex, $fallback)
{
    $c = is_string($maybe_hex) ? sanitize_hex_color($maybe_hex) : '';
    return $c ? $c : $fallback;
}

// Register Shortcodes
function trsss_register_app_shortcode()
{
    add_shortcode('shelfsage_app', 'trsss_render_app');
    add_shortcode('rmss_app', 'trsss_render_app');
    add_shortcode('shelfsage', 'trsss_render_books_shortcode'); // Primary shortcode
    add_shortcode('trs_shelfsage', 'trsss_render_books_shortcode'); // New ID-based shortcode
    add_shortcode('shelfsage_books', 'trsss_render_books_shortcode');
    add_shortcode('shelfsage_authors', 'trsss_render_taxonomy_list_shortcode');
    add_shortcode('shelfsage_publishers', 'trsss_render_taxonomy_list_shortcode');
    add_shortcode('shelfsage_series', 'trsss_render_taxonomy_list_shortcode');
    add_shortcode('shelfsage_genres', 'trsss_render_taxonomy_list_shortcode');
    add_shortcode('shelfsage_filter', 'trsss_render_filter_shortcode');
}
add_action('init', 'trsss_register_app_shortcode');

// Register ShelfSage app assets — runs on frontend, Gutenberg editor, and Elementor editor
function trsss_register_app_assets() {
    if (!defined('TRSSS_URL')) {
        return;
    }
    // Skip if already registered to avoid duplicate registration across hooks
    if (wp_script_is('trsss-app-js', 'registered')) {
        return;
    }
    $ver = '1.5.0';
    wp_register_script('trsss-app-js', TRSSS_URL . 'assets/shelfsage-app.js', array('wp-element'), $ver, true);
    wp_register_style('trsss-app-css', TRSSS_URL . 'assets/index.css', array(), $ver);
}
add_action('wp_enqueue_scripts',             'trsss_register_app_assets', 5);
add_action('enqueue_block_assets',           'trsss_register_app_assets', 5);
add_action('elementor/editor/before_enqueue_scripts', 'trsss_register_app_assets', 5);

// Shared localized data for frontend and Elementor preview
function trsss_get_rmss_localize_data() {
    $settings = trsss_get_shelfsage_settings_array();
    $label_defaults = array(
        'author' => __('Author', 'shelfsage'),
        'publisher' => __('Publisher', 'shelfsage'),
        'translator' => __('Translator', 'shelfsage'),
        'series' => __('Series', 'shelfsage'),
        'add_to_cart' => __('Add to Cart', 'shelfsage'),
        'view_cart' => __('View Cart', 'shelfsage'),
        'look_inside' => __('Look Inside', 'shelfsage'),
        'custom_button' => __('View Details', 'shelfsage'),
        'view_details' => __('View Details', 'shelfsage'),
        'isbn' => 'ISBN',
        'pages' => 'Pages',
        'edition' => 'Edition',
        'binding' => 'Binding',
        'related_books' => 'Related Books',
        'more_from_author' => 'More from this Author',
        'also_available' => 'Also available at:',
    );
    $saved_labels = (isset($settings['labels']) && is_array($settings['labels'])) ? $settings['labels'] : array();
    $labels = array_merge($label_defaults, array_filter($saved_labels, function ($v) { return $v !== null && $v !== ''; }));
    $product_id = is_singular('product') ? get_the_ID() : 0;
    $author_terms = $product_id ? get_the_terms($product_id, 'rmss_author') : array();
    $author_slugs = $author_terms && !is_wp_error($author_terms) ? wp_list_pluck($author_terms, 'slug') : array();
    $publisher_terms = $product_id ? get_the_terms($product_id, 'rmss_publisher') : array();
    $publisher_slugs = $publisher_terms && !is_wp_error($publisher_terms) ? wp_list_pluck($publisher_terms, 'slug') : array();
    return array(
        'apiUrl' => esc_url_raw(rest_url('shelfsage/v1')),
        'wpRestUrl' => esc_url_raw(rest_url('wp/v2')),
        'nonce' => wp_create_nonce('wp_rest'),
        'currentProductId' => $product_id,
        'currentAuthorIds' => $author_slugs,
        'currentPublisherIds' => $publisher_slugs,
        'labels' => $labels,
        'enable_custom_button' => !empty($settings['enable_custom_button']),
        'hide_add_to_cart' => !empty($settings['hide_add_to_cart']),
        'enable_affiliate' => !isset($settings['enable_affiliate']) || $settings['enable_affiliate'],
        'enable_schema' => !isset($settings['enable_schema']) || $settings['enable_schema'],
        'isPro' => true,
        'enable_look_inside' => !isset($settings['enable_look_inside']) || $settings['enable_look_inside'],
        'pdf_reader_style' => isset($settings['pdf_reader_style']) ? $settings['pdf_reader_style'] : 'style-1',
        'look_inside_btn_position' => isset($settings['look_inside_btn_position']) ? $settings['look_inside_btn_position'] : 'bottom-left',
        'look_inside_btn_width' => isset($settings['look_inside_btn_width']) ? $settings['look_inside_btn_width'] : 'full',
        'look_inside_btn_align' => isset($settings['look_inside_btn_align']) ? $settings['look_inside_btn_align'] : 'center',
        'default_book_image' => isset($settings['default_book_image']) ? esc_url_raw($settings['default_book_image']) : '',
    );
}

// Elementor preview iframe: load app script/style and localize so books grid renders in editor
function trsss_elementor_preview_enqueue() {
    // Ensure assets are registered (is_admin() = true inside preview iframe; we register unconditionally now)
    trsss_register_app_assets();
    wp_enqueue_script('trsss-app-js');
    wp_enqueue_style('trsss-app-css');
    wp_localize_script('trsss-app-js', 'rmssSettings', trsss_get_rmss_localize_data());
    $settings = trsss_get_shelfsage_settings_array();
    $primary = trsss_sanitize_theme_hex(isset($settings['primary_color']) ? $settings['primary_color'] : '', '#2563eb');
    $accent = trsss_sanitize_theme_hex(isset($settings['accent_color']) ? $settings['accent_color'] : '', '#1d4ed8');
    $custom_css = ":root{--rmss-primary:{$primary};--rmss-accent:{$accent};--rmss-font-sans:'Inter',system-ui,sans-serif;--rmss-font-serif:'Lora',Georgia,serif;}";
    wp_add_inline_style('trsss-app-css', $custom_css);
}
add_action('elementor/preview/enqueue_scripts', 'trsss_elementor_preview_enqueue');

// Gutenberg block editor (edit screen): enqueue assets so server-rendered blocks show a real preview
// NOTE: Elementor editor এ লোড হবে না — Elementor-এর নিজস্ব preview hook আলাদা আছে
function trsss_enqueue_block_editor_assets() {
    if (!defined('TRSSS_URL') || !is_admin()) {
        return;
    }
    // Elementor editor context-এ skip করো (conflict এড়াতে)
    $trsss_el_act = isset($_GET['action']) ? sanitize_key(wp_unslash($_GET['action'])) : '';
    if (defined('ELEMENTOR_VERSION') && $trsss_el_act === 'elementor') {
        return;
    }
    if (defined('ELEMENTOR_VERSION') && isset($_GET['elementor-preview'])) {
        return;
    }
    trsss_register_app_assets();
    wp_enqueue_script('trsss-app-js');
    wp_enqueue_style('trsss-app-css');
    wp_localize_script('trsss-app-js', 'rmssSettings', trsss_get_rmss_localize_data());
    $settings = trsss_get_shelfsage_settings_array();
    $primary = trsss_sanitize_theme_hex(isset($settings['primary_color']) ? $settings['primary_color'] : '', '#2563eb');
    $accent = trsss_sanitize_theme_hex(isset($settings['accent_color']) ? $settings['accent_color'] : '', '#1d4ed8');
    $custom_css = ":root{--rmss-primary:{$primary};--rmss-accent:{$accent};--rmss-font-sans:'Inter',system-ui,sans-serif;--rmss-font-serif:'Lora',Georgia,serif;}";
    wp_add_inline_style('trsss-app-css', $custom_css);
}
add_action('enqueue_block_assets', 'trsss_enqueue_block_editor_assets');

function trsss_render_filter_shortcode($atts)
{
    return '<div id="rmss-filter-app"></div>';
}

function trsss_render_taxonomy_list_shortcode($atts, $content, $tag)
{
    $taxonomy = 'rmss_author'; // default
    $title = __('All Authors', 'shelfsage');

    switch ($tag) {
        case 'shelfsage_publishers':
            $taxonomy = 'rmss_publisher';
            $title = __('All Publishers', 'shelfsage');
            break;
        case 'shelfsage_series':
            $taxonomy = 'rmss_series';
            $title = __('Book Series', 'shelfsage');
            break;
        case 'shelfsage_genres':
            $taxonomy = 'rmss_genre';
            $title = __('Book Genres', 'shelfsage');
            break;
    }

    $terms = get_terms(array(
        'taxonomy' => $taxonomy,
        'hide_empty' => true,
    ));

    if (empty($terms) || is_wp_error($terms)) {
        return '<p>' . __('No items found.', 'shelfsage') . '</p>';
    }

    ob_start();
?>
    <div class="rmss-container max-w-7xl mx-auto px-4 py-12">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-10 text-center rmss-animate-fade-in"><?php echo esc_html($title); ?></h1>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <?php
    $count = 0;
    foreach ($terms as $term):
        $count++;
        $delay_class = 'rmss-stagger-' . ($count % 5 + 1); // 1 to 5
        $image_id = get_term_meta($term->term_id, 'rmss_image_id', true);
        $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'medium') : '';
        $first_letter = esc_html(strtoupper(mb_substr($term->name, 0, 1)));
?>
                <a href="<?php echo esc_url(get_term_link($term)); ?>" class="group block bg-white rounded-xl border border-gray-200 p-6 shadow-sm rmss-card-hover text-center rmss-animate-slide-up <?php echo esc_attr($delay_class); ?>">
                    <div class="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4 shadow-md group-hover:scale-110 transition-transform duration-300 ring-4 ring-gray-50">
                        <?php if ($image_url): ?>
                            <img src="<?php echo esc_url($image_url); ?>" alt="<?php echo esc_attr($term->name); ?>" class="w-full h-full object-cover">
                        <?php
        else: ?>
                            <div class="w-full h-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-blue-600 text-3xl font-bold">
                                <?php echo $first_letter; ?>
                            </div>
                        <?php
        endif; ?>
                    </div>
                    <h3 class="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                        <?php echo esc_html($term->name); ?>
                    </h3>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <?php echo sprintf(_n('%s Book', '%s Books', $term->count, 'shelfsage'), number_format_i18n($term->count)); ?>
                    </span>
                </a>
            <?php
    endforeach; ?>
        </div>
    </div>
    <?php
    return ob_get_clean();
}

function trsss_enqueue_scripts()
{
    global $post;
    $post = $post ?? null;

    // Determine if we should enqueue assets
    $should_enqueue = false;
    $is_product = is_singular('product');

    // Elementor preview iframe: enqueue so the same design renders in editor as on frontend
    if (!is_admin() && !empty($_GET['elementor-preview'])) {
        $should_enqueue = true;
    }
    elseif ($is_product) {
        $should_enqueue = true;
    }
    elseif (is_tax(array('rmss_author', 'rmss_publisher', 'rmss_translator', 'rmss_series', 'rmss_genre'))) {
        $should_enqueue = true;
    }
    elseif (is_a($post, 'WP_Post')) {
        $content = $post->post_content ?? '';
        $has_shortcode = has_shortcode($content, 'shelfsage_app') || has_shortcode($content, 'rmss_app')
            || has_shortcode($content, 'shelfsage') || has_shortcode($content, 'trs_shelfsage')
            || has_shortcode($content, 'shelfsage_books')
            || has_shortcode($content, 'shelfsage_authors') || has_shortcode($content, 'shelfsage_publishers')
            || has_shortcode($content, 'shelfsage_series') || has_shortcode($content, 'shelfsage_genres')
            || has_shortcode($content, 'shelfsage_filter');
        if ($has_shortcode) {
            $should_enqueue = true;
        }
        // Block editor stores shortcodes/blocks in markup; check raw content
        elseif (strpos($content, '[shelfsage') !== false || strpos($content, '[trs_shelfsage') !== false || strpos($content, '[rmss_app') !== false) {
            $should_enqueue = true;
        }
        // Gutenberg: shelfsage/books block
        elseif (strpos($content, 'wp-block-shelfsage-books') !== false || strpos($content, 'shelfsage/books') !== false) {
            $should_enqueue = true;
        }
        // Elementor: shortcode/widget may be in meta
        elseif (function_exists('get_post_meta') && get_post_meta($post->ID, '_elementor_edit_mode', true)) {
            $el_data = get_post_meta($post->ID, '_elementor_data', true);
            if (is_string($el_data) && (strpos($el_data, 'shelfsage') !== false || strpos($el_data, 'rmss_app') !== false || strpos($el_data, 'trs_shelfsage') !== false)) {
                $should_enqueue = true;
            }
        }
        // Divi: builder content may be in meta
        elseif (function_exists('get_post_meta') && get_post_meta($post->ID, '_et_pb_use_builder', true) === 'on') {
            $et_data = get_post_meta($post->ID, '_et_pb_old_content', true);
            if (is_string($et_data) && (strpos($et_data, 'shelfsage') !== false || strpos($et_data, 'trs_shelfsage') !== false)) {
                $should_enqueue = true;
            }
        }
        // Beaver Builder, WPBakery, Oxygen, etc.: shortcode may be in builder meta
        elseif (function_exists('get_post_meta')) {
            $builder_keys = array('_fl_builder_data', '_wpb_post_custom_css', 'ct_builder_shortcodes');
            foreach ($builder_keys as $mk) {
                $v = get_post_meta($post->ID, $mk, true);
                if (is_string($v) && (strpos($v, 'shelfsage') !== false || strpos($v, 'trs_shelfsage') !== false)) {
                    $should_enqueue = true;
                    break;
                }
            }
        }
    }

    $should_enqueue = apply_filters('trsss_should_enqueue_scripts', $should_enqueue, $post ?? null);

    if ($should_enqueue) {
        wp_enqueue_script('trsss-app-js');
        wp_enqueue_style('trsss-app-css');
        wp_localize_script('trsss-app-js', 'rmssSettings', trsss_get_rmss_localize_data());

        // Enqueue standard Woo styles
        wp_enqueue_style('woocommerce-general');
        wp_enqueue_style('woocommerce-layout');
        wp_enqueue_style('woocommerce-smallscreen');

        wp_enqueue_style('trsss-google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap', array(), null);

        $settings = trsss_get_shelfsage_settings_array();
        $primary = trsss_sanitize_theme_hex(isset($settings['primary_color']) ? $settings['primary_color'] : '', '#2563eb');
        $accent = trsss_sanitize_theme_hex(isset($settings['accent_color']) ? $settings['accent_color'] : '', '#1d4ed8');

        $custom_css = "
            :root {
                --rmss-primary: {$primary};
                --rmss-accent: {$accent};
                --rmss-font-sans: 'Inter', system-ui, -apple-system, sans-serif;
                --rmss-font-serif: 'Lora', Georgia, serif;
            }
            .rmss-btn-primary { background-color: var(--rmss-primary) !important; }
            .rmss-text-primary { color: var(--rmss-primary) !important; }
            .rmss-btn-accent { background-color: var(--rmss-accent) !important; }
            
            /* Global Typography Overrides */
            .rmss-container, .rmss-books-container, #rmss-app-root, #rmss-welcome-root {
                font-family: var(--rmss-font-sans);
            }
            
            /* Heading Typography Overrides */
            .rmss-container h1, .rmss-container h2, .rmss-container h3,
            .rmss-book-title, 
            .product_title,
            .rmss-author-name {
                font-family: var(--rmss-font-serif) !important;
            }

            /* Look Inside Button — default styles (Designer can override per shortcode) */
            .ss-look-inside-btn {
                display: inline-flex !important;
                align-items: center !important;
                gap: 4px !important;
                font-size: 12px !important;
                font-weight: 700 !important;
                line-height: 1.2 !important;
                color: #2563eb !important;
                background-color: rgba(255,255,255,0.92) !important;
                padding: 8px 8px !important;
                border-radius: 9999px !important;
                border: 1px solid rgba(37,99,235,0.3) !important;
                cursor: pointer !important;
                white-space: nowrap !important;
                backdrop-filter: blur(4px);
                transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease !important;
            }
            .ss-look-inside-btn svg {
                width: 12px !important;
                height: 12px !important;
                flex-shrink: 0;
            }
            .ss-look-inside-btn:hover {
                color: #ffffff !important;
                background-color: #eff6ff !important;
            }
            .ss-look-inside-btn.w-full { width: 100%; justify-content: center; }
        ";
        wp_add_inline_style('trsss-app-css', $custom_css);
    }
}
add_action('wp_enqueue_scripts', 'trsss_enqueue_scripts', 20); // Increased priority to 20 to run after theme scripts

// Apply custom "Add to Cart" label to default WooCommerce single product button
function trsss_woocommerce_add_to_cart_button_text($text) {
    $settings = trsss_get_shelfsage_settings_array();
    $labels = isset($settings['labels']) && is_array($settings['labels']) ? $settings['labels'] : array();
    return !empty($labels['add_to_cart']) ? $labels['add_to_cart'] : $text;
}
add_filter('woocommerce_product_single_add_to_cart_text', 'trsss_woocommerce_add_to_cart_button_text', 10, 1);

// Remove default hooks when using custom template
function trsss_remove_default_hooks()
{
    if (is_singular('product')) {
        $obj_id = get_queried_object_id();
        if (!$obj_id)
            return;

        if (has_term('', 'rmss_author', $obj_id) || has_term('', 'rmss_genre', $obj_id) || has_term('', 'rmss_publisher', $obj_id) || has_term('', 'rmss_series', $obj_id) || has_term('', 'rmss_translator', $obj_id)) {
            // Remove Affiliate Buttons
            remove_action('woocommerce_after_add_to_cart_button', 'rmss_display_affiliate_buttons', 15);

            // Remove Related Books & Shelf Talker hooks
            remove_action('woocommerce_after_single_product_summary', 'trsss_render_related_books_container', 25);
            remove_action('woocommerce_product_meta_end', 'trsss_render_shelf_talker_container', 20);

            // Remove sidebar if theme adds it via hook (common in some themes)
            remove_action('woocommerce_sidebar', 'woocommerce_get_sidebar', 10);

        // We removed the aggressive remove_all_actions calls here. 
        // Theme elements should be hidden via CSS or specific remove_action calls if they conflict, 
        // rather than wiping out all hooks, which breaks payment gateways, schema, and reviews.
        }
    }
}
add_action('template_redirect', 'trsss_remove_default_hooks', 1); // Priority 1 to run before theme setup if possible, but template_redirect is late enough // Changed from 'wp' to 'template_redirect' for better timing

function trsss_render_app()
{
    return '<div id="rmss-app-root"></div>';
}

/**
 * Convert margin setting (array or number) to CSS value "Tpx Rpx Bpx Lpx".
 *
 * @param mixed $m margin_title, margin_author, etc. (array with top/right/bottom/left/sameForAll or number)
 * @param array $legacy_fallback optional [t,r,b,l] for legacy designs (e.g. title => [0,0,4,0])
 * @return string
 */
function trsss_margin_to_css($m, $legacy_fallback = null)
{
    if ($legacy_fallback !== null && ($m === null || (is_array($m) && !isset($m['top']) && !isset($m['bottom'])))) {
        return $legacy_fallback[0] . 'px ' . $legacy_fallback[1] . 'px ' . $legacy_fallback[2] . 'px ' . $legacy_fallback[3] . 'px';
    }
    if ($m === null || $m === '') {
        return '0 0 0 0';
    }
    if (is_numeric($m)) {
        $v = (int) $m;
        return "{$v}px {$v}px {$v}px {$v}px";
    }
    if (!is_array($m)) {
        return '0 0 0 0';
    }
    $same = !isset($m['sameForAll']) || (bool) $m['sameForAll'];
    $t = isset($m['top']) ? (int) $m['top'] : 0;
    $r = isset($m['right']) ? (int) $m['right'] : 0;
    $b = isset($m['bottom']) ? (int) $m['bottom'] : 0;
    $l = isset($m['left']) ? (int) $m['left'] : 0;
    if ($same) {
        return "{$t}px {$t}px {$t}px {$t}px";
    }
    return "{$t}px {$r}px {$b}px {$l}px";
}

/**
 * Generate design-specific CSS for saved shortcode (Look Inside button, etc.).
 * Mirrors ShortcodeArchitect generateDynamicCSS for .ss-look-inside-btn.
 *
 * @param array $settings Saved _rmss_settings (design config)
 * @param string $scope CSS selector prefix (e.g. '.rmss-design-123 ') for scoping
 * @return string CSS block
 */
function trsss_generate_design_css($settings, $scope = '')
{
    if (empty($settings) || !is_array($settings)) {
        return '';
    }
    // Content alignment (Designer one-click: left | center | right) — force so frontend matches panel
    $card_align_raw = isset($settings['card_alignment']) ? $settings['card_alignment'] : 'center';
    $card_align = is_string($card_align_raw) ? strtolower(trim($card_align_raw)) : 'center';
    if (!in_array($card_align, array('left', 'right', 'center'), true)) {
        $card_align = 'center';
    }
    $align_text = $card_align === 'left' ? 'left' : ($card_align === 'right' ? 'right' : 'center');
    $align_items = $card_align === 'left' ? 'flex-start' : ($card_align === 'right' ? 'flex-end' : 'center');
    $align_justify = $card_align === 'left' ? 'flex-start' : ($card_align === 'right' ? 'flex-end' : 'center');
    $content_sel = $scope . '.ss-card-content';
    $css_alignment = "
/* ShelfSage design: Content alignment */
{$content_sel} {
    text-align: {$align_text} !important;
    align-items: {$align_items} !important;
}
{$content_sel} .ss-card-footer-row { justify-content: {$align_justify} !important; }
{$content_sel} .ss-card-actions { justify-content: {$align_justify} !important; }
";
    // When Designer "Show Badge" is off, hide all badges via CSS (works even if JS is cached)
    $show_badge_val = isset($settings['show_badge']) ? $settings['show_badge'] : true;
    $show_badge_on = ($show_badge_val === true || $show_badge_val === 'true' || $show_badge_val === 1 || $show_badge_val === '1' || $show_badge_val === 'yes');
    if (!$show_badge_on) {
        $css_alignment .= "\n/* ShelfSage design: Hide discount badge when Show Discount Badge is off */\n" . $scope . ".ss-discount-badge { display: none !important; }\n";
    }
    // Hide ribbon badge when Show Ribbon Badge is off
    $show_ribbon = isset($settings['show_ribbon_badge']) ? $settings['show_ribbon_badge'] : true;
    $show_ribbon_on = ($show_ribbon === true || $show_ribbon === 'true' || $show_ribbon === 1 || $show_ribbon === '1' || $show_ribbon === 'yes');
    if (!$show_ribbon_on) {
        $css_alignment .= "\n/* ShelfSage design: Hide ribbon badge when Show Ribbon Badge is off */\n" . $scope . ".ss-ribbon-badge { display: none !important; }\n";
    }
    // Ribbon badge typo & colors (Designer Ribbon Badge section)
    $typo_r = isset($settings['typo_ribbon']) && is_array($settings['typo_ribbon']) ? $settings['typo_ribbon'] : array();
    $color_r = isset($settings['color_ribbon']) && is_array($settings['color_ribbon']) ? $settings['color_ribbon'] : array();
    $ribbon_font = isset($typo_r['font']) ? esc_attr($typo_r['font']) : '';
    $ribbon_font_rule = $ribbon_font ? "font-family: '" . $ribbon_font . "', sans-serif;" : '';
    $ribbon_size = isset($typo_r['size']) ? (int) $typo_r['size'] : 12;
    $ribbon_text = isset($color_r['text']) ? esc_attr($color_r['text']) : '#ffffff';
    $ribbon_hover = isset($color_r['hoverText']) ? esc_attr($color_r['hoverText']) : '#ffffff';
    $ribbon_bg = isset($color_r['bg']) ? esc_attr($color_r['bg']) : '#dc2626';
    $ribbon_bg_hover = isset($color_r['hoverBg']) ? esc_attr($color_r['hoverBg']) : '#b91c1c';
    $rb = isset($settings['ribbon_border']) && is_array($settings['ribbon_border']) ? $settings['ribbon_border'] : array();
    $rb_top = isset($rb['top']) ? (int) $rb['top'] : (isset($rb['width']) ? (int) $rb['width'] : 0);
    $rb_unit = isset($rb['unit']) ? esc_attr($rb['unit']) : 'px';
    $rb_color = isset($rb['color']) ? esc_attr($rb['color']) : 'transparent';
    $rr = isset($settings['ribbon_radius']) ? $settings['ribbon_radius'] : 8;
    if (is_array($rr)) {
        $rr_tl = isset($rr['topLeft']) ? (int) $rr['topLeft'] : 8;
        $rr_tr = isset($rr['topRight']) ? (int) $rr['topRight'] : 8;
        $rr_br = isset($rr['bottomRight']) ? (int) $rr['bottomRight'] : 8;
        $rr_bl = isset($rr['bottomLeft']) ? (int) $rr['bottomLeft'] : 8;
        $rr_css = "border-radius: {$rr_tl}px {$rr_tr}px {$rr_br}px {$rr_bl}px !important;";
    } else {
        $rr_val = (int) $rr;
        $rr_css = "border-radius: {$rr_val}px !important;";
    }
    $ribbon_border_css = ($rb_top > 0) ? "border: {$rb_top}{$rb_unit} solid {$rb_color} !important;" : '';
    $ribbon_sel = $scope . '.ss-ribbon-badge';
    $css_alignment .= "
/* ShelfSage design: Ribbon badge (New/custom) */
{$ribbon_sel} {
    {$ribbon_font_rule}
    font-size: {$ribbon_size}px !important;
    color: {$ribbon_text} !important;
    background-color: {$ribbon_bg} !important;
    {$rr_css}
    {$ribbon_border_css}
    transition: color 0.2s ease, background-color 0.2s ease !important;
}
{$ribbon_sel}:hover {
    color: {$ribbon_hover} !important;
    background-color: {$ribbon_bg_hover} !important;
}
";

    $typo = isset($settings['typo_look_inside']) && is_array($settings['typo_look_inside']) ? $settings['typo_look_inside'] : array();
    $color = isset($settings['color_look_inside']) && is_array($settings['color_look_inside']) ? $settings['color_look_inside'] : array();
    $pad = isset($settings['look_inside_padding']) ? $settings['look_inside_padding'] : null;
    $rad = isset($settings['look_inside_radius']) ? $settings['look_inside_radius'] : null;
    $border = isset($settings['look_inside_border']) && is_array($settings['look_inside_border']) ? $settings['look_inside_border'] : array();

    $font = isset($typo['font']) ? esc_attr($typo['font']) : '';
    $font_rule = $font ? "font-family: '" . $font . "', sans-serif;" : '';
    $size = isset($typo['size']) ? (int) $typo['size'] : 12;
    $allowed_weights = array('100', '200', '300', '400', '500', '600', '700', '800', '900', 'normal', 'bold');
    $weight_raw = isset($typo['weight']) ? $typo['weight'] : '700';
    $weight = in_array((string) $weight_raw, $allowed_weights, true) ? (string) $weight_raw : '700';
    $line_height = isset($typo['lineHeight']) ? (float) $typo['lineHeight'] : 1.2;
    $allowed_transforms = array('none', 'capitalize', 'uppercase', 'lowercase');
    $transform_raw = isset($typo['textTransform']) ? $typo['textTransform'] : 'none';
    $text_transform = in_array((string) $transform_raw, $allowed_transforms, true) ? (string) $transform_raw : 'none';

    $text_color = isset($color['text']) ? esc_attr($color['text']) : '#2563eb';
    $hover_text = isset($color['hoverText']) ? esc_attr($color['hoverText']) : '#ffffff';
    $bg = isset($color['bg']) ? esc_attr($color['bg']) : 'rgba(255,255,255,0.92)';
    $hover_bg = isset($color['hoverBg']) ? esc_attr($color['hoverBg']) : '#eff6ff';

    $pt = $pr = $pb = $pl = 8;
    if (is_numeric($pad)) {
        $pt = $pr = $pb = $pl = (int) $pad;
    } elseif (is_array($pad)) {
        $pt = isset($pad['top']) ? (int) $pad['top'] : 8;
        $pr = isset($pad['right']) ? (int) $pad['right'] : 8;
        $pb = isset($pad['bottom']) ? (int) $pad['bottom'] : 8;
        $pl = isset($pad['left']) ? (int) $pad['left'] : 8;
    }
    $padding = "{$pt}px {$pr}px {$pb}px {$pl}px";

    $radius_same = true;
    $rtl = $rtr = $rbr = $rbl = 9999;
    if (is_numeric($rad)) {
        $rtl = $rtr = $rbr = $rbl = (int) $rad;
    } elseif (is_array($rad)) {
        $rtl = isset($rad['topLeft']) ? (int) $rad['topLeft'] : 9999;
        $rtr = isset($rad['topRight']) ? (int) $rad['topRight'] : 9999;
        $rbr = isset($rad['bottomRight']) ? (int) $rad['bottomRight'] : 9999;
        $rbl = isset($rad['bottomLeft']) ? (int) $rad['bottomLeft'] : 9999;
        $radius_same = isset($rad['sameForAll']) ? (bool) $rad['sameForAll'] : true;
    }
    $border_radius = $radius_same ? ($rtl . 'px') : "{$rtl}px {$rtr}px {$rbr}px {$rbl}px";

    $allowed_units = array('px', 'em', 'rem', '%');
    $unit_raw = isset($border['unit']) ? $border['unit'] : 'px';
    $unit = in_array((string) $unit_raw, $allowed_units, true) ? (string) $unit_raw : 'px';
    $bt = isset($border['top']) ? (int) $border['top'] : (isset($border['width']) ? (int) $border['width'] : 1);
    $br = isset($border['right']) ? (int) $border['right'] : (isset($border['width']) ? (int) $border['width'] : 1);
    $bb = isset($border['bottom']) ? (int) $border['bottom'] : (isset($border['width']) ? (int) $border['width'] : 1);
    $bl = isset($border['left']) ? (int) $border['left'] : (isset($border['width']) ? (int) $border['width'] : 1);
    $bcolor = isset($border['color']) ? esc_attr($border['color']) : 'rgba(37,99,235,0.3)';
    $border_css = ($bt === 0 && $br === 0 && $bb === 0 && $bl === 0)
        ? ''
        : "border-style: solid !important; border-color: {$bcolor} !important; border-width: {$bt}{$unit} {$br}{$unit} {$bb}{$unit} {$bl}{$unit} !important;";

    $icon_size = isset($settings['look_inside_icon_size']) ? (int) $settings['look_inside_icon_size'] : 12;
    $icon_gap = isset($settings['look_inside_icon_gap']) ? (int) $settings['look_inside_icon_gap'] : 4;
    $icon_color = isset($settings['look_inside_icon_color']) && is_array($settings['look_inside_icon_color']) ? $settings['look_inside_icon_color'] : array();
    $icon_text = !empty($icon_color['text']) ? esc_attr($icon_color['text']) : 'currentColor';
    $icon_hover = !empty($icon_color['hoverText']) ? esc_attr($icon_color['hoverText']) : 'currentColor';

    $allowed_btn_align = array('left', 'center', 'right');
    $btn_align_raw = isset($settings['look_inside_btn_align']) ? $settings['look_inside_btn_align'] : 'center';
    $btn_align = in_array((string) $btn_align_raw, $allowed_btn_align, true) ? (string) $btn_align_raw : 'center';
    $justify = ( $btn_align === 'left' ) ? 'flex-start' : ( ( $btn_align === 'right' ) ? 'flex-end' : 'center' );
    $sel = $scope . '.ss-look-inside-btn';
    $css_look_inside = "
/* ShelfSage design: Look Inside button */
{$sel} {
    {$font_rule}
    font-size: {$size}px !important;
    font-weight: {$weight} !important;
    line-height: {$line_height} !important;
    text-transform: {$text_transform} !important;
    color: {$text_color} !important;
    background-color: {$bg} !important;
    padding: {$padding} !important;
    border-radius: {$border_radius} !important;
    {$border_css}
    display: inline-flex !important;
    align-items: center !important;
    justify-content: {$justify} !important;
    gap: {$icon_gap}px !important;
    cursor: pointer !important;
    white-space: nowrap !important;
    backdrop-filter: blur(4px);
    transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease !important;
}
{$sel} svg {
    width: {$icon_size}px !important;
    height: {$icon_size}px !important;
    flex-shrink: 0;
    color: {$icon_text} !important;
    transition: color 0.2s ease !important;
}
{$sel}:hover {
    color: {$hover_text} !important;
    background-color: {$hover_bg} !important;
}
{$sel}:hover svg {
    color: {$icon_hover} !important;
}";
    // Author typography & color (Designer tab)
    $typo_author = isset($settings['typo_author']) && is_array($settings['typo_author']) ? $settings['typo_author'] : array();
    $color_author = isset($settings['color_author']) && is_array($settings['color_author']) ? $settings['color_author'] : array();
    $author_font = isset($typo_author['font']) ? esc_attr($typo_author['font']) : '';
    $author_font_rule = $author_font ? "font-family: '" . $author_font . "', sans-serif;" : '';
    $author_size = isset($typo_author['size']) ? (int) $typo_author['size'] : 12;
    $author_weight = isset($typo_author['weight']) ? esc_attr($typo_author['weight']) : '400';
    $author_lh = isset($typo_author['lineHeight']) ? (float) $typo_author['lineHeight'] : 1.4;
    $author_transform = isset($typo_author['textTransform']) ? esc_attr($typo_author['textTransform']) : 'none';
    $author_text = isset($color_author['text']) ? esc_attr($color_author['text']) : '#6b7280';
    $author_hover = isset($color_author['hoverText']) ? esc_attr($color_author['hoverText']) : '#7c3aed';
    $author_bg = isset($color_author['bg']) ? esc_attr($color_author['bg']) : 'transparent';
    $author_hover_bg = isset($color_author['hoverBg']) ? esc_attr($color_author['hoverBg']) : 'transparent';
    $author_sel = $scope . '.ss-card-author';
    $css_author = "
/* ShelfSage design: Author */
{$author_sel} {
    {$author_font_rule}
    font-size: {$author_size}px !important;
    font-weight: {$author_weight} !important;
    line-height: {$author_lh} !important;
    text-transform: {$author_transform} !important;
    color: {$author_text} !important;
    background-color: {$author_bg};
    transition: color 0.3s ease, background-color 0.3s ease;
}
{$author_sel}:hover {
    color: {$author_hover} !important;
    background-color: {$author_hover_bg};
}";

    // Title typography & color (Designer tab)
    $typo_title = isset($settings['typo_title']) && is_array($settings['typo_title']) ? $settings['typo_title'] : array();
    $color_title = isset($settings['color_title']) && is_array($settings['color_title']) ? $settings['color_title'] : array();
    $title_font = isset($typo_title['font']) ? esc_attr($typo_title['font']) : '';
    $title_font_rule = $title_font ? "font-family: '" . $title_font . "', sans-serif;" : '';
    $title_size = isset($typo_title['size']) ? (int) $typo_title['size'] : 16;
    $title_weight = isset($typo_title['weight']) ? esc_attr($typo_title['weight']) : '700';
    $title_lh = isset($typo_title['lineHeight']) ? (float) $typo_title['lineHeight'] : 1.3;
    $title_transform = isset($typo_title['textTransform']) ? esc_attr($typo_title['textTransform']) : 'none';
    $title_text = isset($color_title['text']) ? esc_attr($color_title['text']) : '#111827';
    $title_hover = isset($color_title['hoverText']) ? esc_attr($color_title['hoverText']) : '#7c3aed';
    $title_bg = isset($color_title['bg']) ? esc_attr($color_title['bg']) : 'transparent';
    $title_hover_bg = isset($color_title['hoverBg']) ? esc_attr($color_title['hoverBg']) : 'transparent';
    $title_sel = $scope . '.ss-card-title';
    $css_title = "
/* ShelfSage design: Title */
{$title_sel} {
    {$title_font_rule}
    font-size: {$title_size}px !important;
    font-weight: {$title_weight} !important;
    line-height: {$title_lh} !important;
    text-transform: {$title_transform} !important;
    color: {$title_text} !important;
    background-color: {$title_bg};
    transition: color 0.3s ease, background-color 0.3s ease;
}
{$title_sel}:hover, {$title_sel} a:hover {
    color: {$title_hover} !important;
    background-color: {$title_hover_bg};
}";

    // Price typography & color
    $typo_price = isset($settings['typo_price']) && is_array($settings['typo_price']) ? $settings['typo_price'] : array();
    $color_price = isset($settings['color_price']) && is_array($settings['color_price']) ? $settings['color_price'] : array();
    $price_font = isset($typo_price['font']) ? esc_attr($typo_price['font']) : '';
    $price_font_rule = $price_font ? "font-family: '" . $price_font . "', sans-serif;" : '';
    $price_size = isset($typo_price['size']) ? (int) $typo_price['size'] : 15;
    $price_weight = isset($typo_price['weight']) ? esc_attr($typo_price['weight']) : '700';
    $price_lh = isset($typo_price['lineHeight']) ? (float) $typo_price['lineHeight'] : 1.2;
    $price_transform = isset($typo_price['textTransform']) ? esc_attr($typo_price['textTransform']) : 'none';
    $price_text = isset($color_price['text']) ? esc_attr($color_price['text']) : '#7c3aed';
    $price_old = isset($color_price['oldText']) ? esc_attr($color_price['oldText']) : '#9ca3af';
    $price_hover = isset($color_price['hoverText']) ? esc_attr($color_price['hoverText']) : '#ffffff';
    $price_bg = isset($color_price['bg']) ? esc_attr($color_price['bg']) : 'transparent';
    $price_hover_bg = isset($color_price['hoverBg']) ? esc_attr($color_price['hoverBg']) : '#7c3aed';
    $price_sel = $scope . '.ss-card-price';
    $css_price = "
/* ShelfSage design: Price */
{$price_sel} {
    {$price_font_rule}
    font-size: {$price_size}px !important;
    font-weight: {$price_weight} !important;
    line-height: {$price_lh} !important;
    text-transform: {$price_transform} !important;
    color: {$price_text} !important;
    background-color: {$price_bg};
    transition: color 0.3s ease, background-color 0.3s ease;
}
{$price_sel} del, {$price_sel} del * {
    color: {$price_old} !important;
    text-decoration: line-through !important;
}
{$price_sel}:hover {
    color: {$price_hover} !important;
    background-color: {$price_hover_bg};
}";

    // Cart button typography & color
    $typo_btn = isset($settings['typo_button']) && is_array($settings['typo_button']) ? $settings['typo_button'] : array();
    $color_btn = isset($settings['color_button']) && is_array($settings['color_button']) ? $settings['color_button'] : array();
    $btn_font = isset($typo_btn['font']) ? esc_attr($typo_btn['font']) : '';
    $btn_font_rule = $btn_font ? "font-family: '" . $btn_font . "', sans-serif;" : '';
    $btn_size = isset($typo_btn['size']) ? (int) $typo_btn['size'] : 13;
    $btn_weight = isset($typo_btn['weight']) ? esc_attr($typo_btn['weight']) : '700';
    $btn_transform = isset($typo_btn['textTransform']) ? esc_attr($typo_btn['textTransform']) : 'none';
    $btn_text = isset($color_btn['text']) ? esc_attr($color_btn['text']) : '#ffffff';
    $btn_hover_text = isset($color_btn['hoverText']) ? esc_attr($color_btn['hoverText']) : '#ffffff';
    $btn_bg = isset($color_btn['bg']) ? esc_attr($color_btn['bg']) : '#2563eb';
    $btn_hover_bg = isset($color_btn['hoverBg']) ? esc_attr($color_btn['hoverBg']) : '#1d4ed8';
    $btn_sel = $scope . '.ss-cart-button';
    $btn_radius = isset($settings['button_radius']) ? $settings['button_radius'] : 12;
    if (is_array($btn_radius)) {
        $br_tl = isset($btn_radius['topLeft']) ? (int) $btn_radius['topLeft'] : 12;
        $br_tr = isset($btn_radius['topRight']) ? (int) $btn_radius['topRight'] : 12;
        $br_br = isset($btn_radius['bottomRight']) ? (int) $btn_radius['bottomRight'] : 12;
        $br_bl = isset($btn_radius['bottomLeft']) ? (int) $btn_radius['bottomLeft'] : 12;
        $btn_radius_css = "border-radius: {$br_tl}px {$br_tr}px {$br_br}px {$br_bl}px !important;";
    } else {
        $r = (int) $btn_radius;
        $btn_radius_css = "border-radius: {$r}px !important;";
    }
    $css_button = "
/* ShelfSage design: Cart button */
{$btn_sel} {
    {$btn_font_rule}
    font-size: {$btn_size}px !important;
    font-weight: {$btn_weight} !important;
    text-transform: {$btn_transform} !important;
    color: {$btn_text} !important;
    background-color: {$btn_bg} !important;
    {$btn_radius_css}
    transition: color 0.2s ease, background-color 0.2s ease !important;
}
{$btn_sel}:hover {
    color: {$btn_hover_text} !important;
    background-color: {$btn_hover_bg} !important;
}";

    // Element margins (legacy: title gets 0 0 4px 0 if not set)
    $margin_map = array(
        'margin_title'       => array($scope . '.ss-card-title', array(0, 0, 4, 0)),
        'margin_author'      => array($scope . '.ss-card-author', null),
        'margin_price'       => array($scope . '.ss-card-price', null),
        'margin_rating'      => array($scope . '.ss-card-rating', null),
        'margin_image'       => array($scope . '.ss-card-image', null),
        'margin_cart'        => array($scope . '.ss-cart-button', null),
        'margin_look_inside' => array($scope . '.ss-look-inside-btn', null),
        'margin_badge'       => array($scope . '.ss-card-badge, ' . $scope . '.ss-badge', null),
        'margin_summary'     => array($scope . '.ss-card-summary', null),
    );
    $css_margins = "\n/* ShelfSage design: Element margins */\n";
    foreach ($margin_map as $key => $pair) {
        list($selector, $legacy) = $pair;
        $m = isset($settings[$key]) ? $settings[$key] : null;
        $val = trsss_margin_to_css($m, $legacy);
        $css_margins .= "{$selector} { margin: {$val} !important; }\n";
    }
    return $css_alignment . $css_title . $css_price . $css_button . $css_look_inside . $css_author . $css_margins;
}

/**
 * Print design CSS queued by shortcode(s) — in footer so Elementor/builders don't strip it.
 */
function trsss_print_queued_design_css() {
    if (empty($GLOBALS['trsss_design_css_queue']) || !is_array($GLOBALS['trsss_design_css_queue'])) {
        return;
    }
    foreach ($GLOBALS['trsss_design_css_queue'] as $id => $css) {
        if ($css !== '') {
            echo '<style id="rmss-design-' . esc_attr($id) . '-css" type="text/css">' . $css . '</style>';
        }
    }
}

function trsss_render_books_shortcode($atts, $content = '', $tag = 'shelfsage')
{
    // Render the same output as frontend so Elementor editor preview shows the real design
    $atts = shortcode_atts(array(
        'id' => '',
        'mode' => 'grid', // React uses 'mode' synonymously with 'layout'
        'layout' => 'grid',
        'design' => 'design-1',
        'style' => 'style-1',
        'limit' => 12,
        'query' => 'latest',
        'genre' => '',
        'author' => '',
        'publisher' => '',
        'category' => '',
        'ids' => '',
        'source' => '',
        'data_source' => '',
        'vault_ids' => '',
        'vault_author' => '',
        'vault_publisher' => '',
        'vault_category' => '',
        'vault_genre' => '',
        'col' => 4,
        'col_tablet' => 3,
        'col_mobile' => 1,
        'radius' => 12,
        'gap' => 24,
        'img_height' => 320,
        'image_height' => '', // from saved design; overrides img_height when id present
        'image_height_unit' => '%', // % = fill available space (no gap), px = fixed height
        'show_image' => 'yes',
        'image' => 'yes', // Synonym
        'show_title' => 'yes',
        'title' => 'yes', // Synonym
        'show_price' => 'yes',
        'price' => 'yes', // Synonym
        'show_cart' => 'yes',
        'cart' => 'yes', // Synonym
        'show_author' => 'no',
        'show_author_badge' => 'no', // Synonym
        'author_badge' => 'no', // Synonym
        'show_author_prefix' => 'yes',
        'author_prefix_text' => 'By ',
        'show_genre' => 'no',
        'show_rating' => 'no',
        'rating' => 'no', // Synonym
        'show_summary' => 'no',
        'summary' => 'no', // Synonym
        'affiliate' => 'no',
        'sort_by' => 'date', // date | title | modified | price | rating | rand
        'sort_order' => 'desc', // asc | desc
        'alignment' => 'center', // left | center | right — card content alignment (Designer)
        'card_alignment' => '', // from saved design; overrides alignment when id present
        'show_look_inside' => 'yes', // Visual Elements: show/hide Look Inside button
        'look_inside_btn_position' => '', // overrides global setting if provided
        'badge_show' => 'yes',
        'badge_design' => 'scalloped',
        'badge_position' => 'top-right',
        'badge_bg_color' => '#dc2626',
        'badge_text_color' => '#ffffff',
        'show_ribbon_badge' => 'yes',
        'ribbon_position' => 'top-left',
    ), $atts, $tag);

    // If ID is present, fetch saved settings and merge/override
    if (!empty($atts['id'])) {
        $saved_settings = get_post_meta($atts['id'], '_rmss_settings', true);
        // API stores as JSON string; admin-menu may store as array — decode if string
        if (is_string($saved_settings)) {
            $decoded = json_decode($saved_settings, true);
            $saved_settings = is_array($decoded) ? $decoded : array();
        }
        if (!empty($saved_settings) && is_array($saved_settings)) {
            // Map Shortcode Architect keys to shortcode atts (col_desktop -> col, layout/mode)
            if (isset($saved_settings['col_desktop']) && !isset($saved_settings['col'])) {
                $saved_settings['col'] = $saved_settings['col_desktop'];
            }
            if (isset($saved_settings['layout']) && !isset($saved_settings['mode'])) {
                $saved_settings['mode'] = $saved_settings['layout'];
            }
            if (isset($saved_settings['query_type'])) {
                if (in_array($saved_settings['query_type'], array('latest', 'featured', 'onsale', 'bestsellers'), true)) {
                    $saved_settings['query'] = $saved_settings['query_type'];
                } elseif (in_array($saved_settings['query_type'], array('category', 'genre', 'author', 'publisher'), true) && !empty($saved_settings['term_slug'])) {
                    $saved_settings[$saved_settings['query_type']] = $saved_settings['term_slug'];
                }
            }
            // Convert 'true'/'false' strings to 'yes'/'no' if needed, or just merge.
            foreach ($saved_settings as $key => $val) {
                // Map boolean saved values to yes/no for consistency with shortcode string format
                if ($val === true || $val === 'true' || $val === 1 || $val === '1')
                    $val = 'yes';
                if ($val === false || $val === 'false' || $val === 0 || $val === '0')
                    $val = 'no';
                $atts[$key] = $val;
            }
            // Explicitly ensure Visual Elements (show/hide) are applied — frontend must receive these
            $visual_keys = array('show_image', 'show_title', 'show_price', 'show_cart', 'show_rating', 'show_author_badge', 'show_summary', 'show_look_inside', 'show_author_prefix');
            foreach ($visual_keys as $vk) {
                if (array_key_exists($vk, $saved_settings)) {
                    $v = $saved_settings[$vk];
                    $atts[$vk] = ($v === true || $v === 'true' || $v === 1 || $v === '1' || $v === 'yes') ? 'yes' : 'no';
                }
            }
            if (array_key_exists('author_prefix_text', $saved_settings)) {
                $atts['author_prefix_text'] = $saved_settings['author_prefix_text'];
            }
            // Content alignment: saved card_alignment must override default alignment on frontend (lowercase)
            if (array_key_exists('card_alignment', $saved_settings)) {
                $al = is_string($saved_settings['card_alignment']) ? strtolower(trim($saved_settings['card_alignment'])) : '';
                if (in_array($al, array('left', 'right', 'center'), true)) {
                    $atts['alignment'] = $al;
                }
            }
            // Badge: sync show_badge (Designer) -> badge_show (shortcode att) so frontend receives it
            if (array_key_exists('show_badge', $saved_settings)) {
                $sb = $saved_settings['show_badge'];
                $atts['badge_show'] = ($sb === true || $sb === 'true' || $sb === 1 || $sb === '1' || $sb === 'yes') ? 'yes' : 'no';
            }
            // Ribbon badge: sync so frontend can show/hide and position independently
            if (array_key_exists('show_ribbon_badge', $saved_settings)) {
                $srb = $saved_settings['show_ribbon_badge'];
                $atts['show_ribbon_badge'] = ($srb === true || $srb === 'true' || $srb === 1 || $srb === '1' || $srb === 'yes') ? 'yes' : 'no';
            }
            if (array_key_exists('ribbon_position', $saved_settings) && is_string($saved_settings['ribbon_position'])) {
                $atts['ribbon_position'] = $saved_settings['ribbon_position'];
            }
            // Columns: force col / col_desktop / col_tablet / col_mobile from saved design so frontend matches panel
            if (array_key_exists('col_desktop', $saved_settings)) {
                $c = absint( $saved_settings['col_desktop'] );
                if ( $c >= 1 ) {
                    $atts['col'] = $c;
                    $atts['col_desktop'] = $c;
                }
            }
            if (array_key_exists('col_tablet', $saved_settings)) {
                $c = absint( $saved_settings['col_tablet'] );
                if ( $c >= 1 ) {
                    $atts['col_tablet'] = $c;
                }
            }
            if (array_key_exists('col_mobile', $saved_settings)) {
                $c = absint( $saved_settings['col_mobile'] );
                if ( $c >= 1 ) {
                    $atts['col_mobile'] = $c;
                }
            }
            // Sync synonyms so BooksShortcode receives correct values (image/title/price/rating/summary)
            if (isset($atts['show_image'])) { $atts['image'] = $atts['show_image']; }
            if (isset($atts['show_title'])) { $atts['title'] = $atts['show_title']; }
            if (isset($atts['show_price'])) { $atts['price'] = $atts['show_price']; }
            if (isset($atts['show_rating'])) { $atts['rating'] = $atts['show_rating']; }
            if (isset($atts['show_summary'])) { $atts['summary'] = $atts['show_summary']; }
            if (isset($atts['show_cart'])) { $atts['cart'] = $atts['show_cart']; }
            if (isset($atts['show_author_badge'])) { $atts['author_badge'] = $atts['show_author_badge']; $atts['show_author'] = $atts['show_author_badge']; }
            // Map data_source -> source for frontend; vaultSelectedIds -> vault_ids
            if (!empty($atts['data_source']) && empty($atts['source'])) {
                $atts['source'] = $atts['data_source'];
            }
            if (isset($saved_settings['vaultSelectedIds']) && is_array($saved_settings['vaultSelectedIds'])) {
                $atts['vault_ids'] = implode(',', array_map('intval', $saved_settings['vaultSelectedIds']));
            }
            if (!empty($saved_settings['vault_query_author'])) $atts['vault_author'] = $saved_settings['vault_query_author'];
            if (!empty($saved_settings['vault_query_publisher'])) $atts['vault_publisher'] = $saved_settings['vault_query_publisher'];
            if (!empty($saved_settings['vault_query_category'])) $atts['vault_category'] = $saved_settings['vault_query_category'];
            if (!empty($saved_settings['vault_query_genre'])) $atts['vault_genre'] = $saved_settings['vault_query_genre'];
        }
    }

    // Convert attributes to data-attributes string (skip arrays)
    $data_attrs = '';
    foreach ($atts as $key => $value) {
        if (is_array($value)) continue;
        $data_attrs .= ' data-' . esc_attr($key) . '="' . esc_attr($value) . '"';
    }

    // When using saved design (id), force alignment and show_look_inside from saved settings
    // so the frontend React app always receives them (fixes alignment + Look Inside show/hide)
    if (!empty($atts['id'])) {
        $raw_saved = get_post_meta($atts['id'], '_rmss_settings', true);
        if (is_string($raw_saved)) {
            $raw_saved = json_decode($raw_saved, true);
        }
        if (!empty($raw_saved) && is_array($raw_saved)) {
            if (array_key_exists('card_alignment', $raw_saved)) {
                $al = is_string($raw_saved['card_alignment']) ? strtolower(trim($raw_saved['card_alignment'])) : '';
                if (in_array($al, array('left', 'right', 'center'), true)) {
                    $data_attrs .= ' data-alignment="' . esc_attr($al) . '"';
                }
            }
            if (array_key_exists('show_look_inside', $raw_saved)) {
                $show_li = $raw_saved['show_look_inside'];
                $data_attrs .= ' data-show_look_inside="' . (($show_li === true || $show_li === 'true' || $show_li === 1 || $show_li === 'yes') ? 'yes' : 'no') . '"';
            }
        }
    }

    // Scoped class and design CSS when using saved design (id)
    $container_class = 'rmss-books-container';
    $design_css = '';
    $scope = '';
    $design_updated_attr = '';
    $design_json_attr = '';
    if (!empty($atts['id'])) {
        $design_post_id = (int) $atts['id'];
        $container_class .= ' rmss-design-' . esc_attr($atts['id']);
        $saved_for_css = get_post_meta($design_post_id, '_rmss_settings', true);
        if (is_string($saved_for_css)) {
            $saved_for_css = json_decode($saved_for_css, true);
        }
        if (!empty($saved_for_css) && is_array($saved_for_css)) {
            $scope = '.rmss-design-' . esc_attr($atts['id']) . ' ';
            $design_css = trsss_generate_design_css($saved_for_css, $scope);
            // Pass nested design settings to frontend (3D shelf hover box: color_container, box_padding, shelf_hover_box_opacity)
            $design_subset = array();
            if (isset($saved_for_css['color_container']) && is_array($saved_for_css['color_container'])) {
                $design_subset['color_container'] = $saved_for_css['color_container'];
            }
            if (isset($saved_for_css['box_padding'])) {
                $design_subset['box_padding'] = $saved_for_css['box_padding'];
            }
            if (array_key_exists('shelf_hover_box_opacity', $saved_for_css)) {
                $design_subset['shelf_hover_box_opacity'] = $saved_for_css['shelf_hover_box_opacity'];
            }
            if (!empty($design_subset)) {
                $design_json_attr = ' data-design-json="' . esc_attr(wp_json_encode($design_subset)) . '"';
            }
        }
        // Debug: so you can confirm in View Source that the shortcode output is fresh after saving
        $design_post = get_post($design_post_id);
        if ($design_post && $design_post->post_type === 'rmss_shortcode') {
            $design_updated_attr = ' data-design-updated="' . esc_attr($design_post->post_modified) . '"';
        }
    }

    // Queue design CSS to print in footer — avoids builders (Elementor etc.) stripping <style> from shortcode output
    if ($design_css && !empty($atts['id'])) {
        if (!has_action('wp_footer', 'trsss_print_queued_design_css')) {
            add_action('wp_footer', 'trsss_print_queued_design_css', 5);
        }
        if (!isset($GLOBALS['trsss_design_css_queue'])) {
            $GLOBALS['trsss_design_css_queue'] = array();
        }
        $GLOBALS['trsss_design_css_queue'][(string) $atts['id']] = $design_css;
    }

    // Override Elementor (and other themes) .elementor img { height: auto } so ShelfSage card images fill container (once per page)
    static $rmss_image_override_printed = false;
    $image_override_css = '';
    if (!$rmss_image_override_printed) {
        $rmss_image_override_printed = true;
        $image_override_css = '<style id="rmss-books-image-override" type="text/css">'
            . '.rmss-books-container img { height: 100% !important; max-width: 100% !important; width: 100% !important; object-fit: cover !important; }'
            . '</style>';
    }

    // Output design CSS with shortcode so it applies in Elementor/AJAX preview (where wp_footer may not run)
    $inline_design_css = '';
    if ($design_css && !empty($atts['id'])) {
        $inline_design_css = '<style id="rmss-design-' . esc_attr($atts['id']) . '-inline" type="text/css">' . $design_css . '</style>';
    }

    $html = $image_override_css . '<div class="' . esc_attr($container_class) . '" ' . $data_attrs . $design_updated_attr . $design_json_attr . '></div>' . $inline_design_css;

    // In modern Gutenberg iframe editors, the parent window's MutationObserver cannot see changes inside the iframe.
    // So we manually inject a tiny script to mount the React container if we are in admin.
    if (is_admin()) {
        $script_id = wp_generate_uuid4();
        $html .= '<script>
            setTimeout(function() {
                if (window.ShelfSageApp && typeof window.ShelfSageApp.mountBooksShortcode === "function") {
                    var container = document.currentScript ? document.currentScript.previousElementSibling : null;
                    if (container && container.classList.contains("rmss-books-container")) {
                        window.ShelfSageApp.mountBooksShortcode(container);
                    } else {
                        // fallback lookup if currentScript fails in some AJAX configs
                        var containers = document.querySelectorAll(".rmss-books-container:not([data-ss-mounted=\'true\'])");
                        containers.forEach(window.ShelfSageApp.mountBooksShortcode);
                    }
                }
            }, 50);
        </script>';
    }

    // Return container for React to hydrate (with design CSS when id present)
    return $html;
}

function trsss_add_book_details_tab($tabs)
{
    $tabs['rmss_book_details'] = array('title' => __('Book Details', 'shelfsage'), 'priority' => 15, 'callback' => 'trsss_render_book_details_tab');
    return $tabs;
}
add_filter('woocommerce_product_tabs', 'trsss_add_book_details_tab');

function trsss_render_book_details_tab()
{
    global $post;
    echo '<h2>' . __('Book Details', 'shelfsage') . '</h2>';
    echo '<table class="woocommerce-product-attributes shop_attributes">';

    $fields = array(
        '_rmss_isbn' => __('ISBN', 'shelfsage'),
        '_rmss_isbn13' => __('ISBN-13', 'shelfsage'),
        '_rmss_asin' => __('ASIN', 'shelfsage'),
        '_rmss_pages' => __('Pages', 'shelfsage'),
        '_rmss_language' => __('Language', 'shelfsage'),
        '_rmss_binding' => __('Binding', 'shelfsage'),
        '_rmss_edition' => __('Edition', 'shelfsage'),
    );

    foreach ($fields as $key => $label) {
        $value = get_post_meta($post->ID, $key, true);
        if ($value) {
            echo '<tr class="woocommerce-product-attributes-item">';
            echo '<th class="woocommerce-product-attributes-item__label">' . esc_html($label) . '</th>';
            echo '<td class="woocommerce-product-attributes-item__value">' . esc_html($value) . '</td>';
            echo '</tr>';
        }
    }
    echo '</table>';
}

// Related books mount (affiliate UI is in bundled extended features).

function trsss_render_related_books_container()
{
    $product_id = 0;
    if (is_singular('product')) {
        global $product;
        $product_id = $product ? $product->get_id() : get_the_ID();
    }
    echo '<div id="rmss-related-books" class="max-w-7xl mx-auto px-4 mt-16" data-product-id="' . esc_attr((string)$product_id) . '" data-limit="6"></div>';
}
add_action('woocommerce_after_single_product_summary', 'trsss_render_related_books_container', 25);

function trsss_render_shelf_talker_container()
{
    echo '<div id="rmss-shelf-talker" style="margin-top: 20px;"></div>';
}
add_action('woocommerce_product_meta_end', 'trsss_render_shelf_talker_container', 20);

/**
 * JSON-LD Schema for Product, Author, Publisher
 */
function trsss_output_schema()
{
    $settings = trsss_get_shelfsage_settings_array();
    if (isset($settings['enable_schema']) && !$settings['enable_schema']) {
        return;
    }

    if (is_singular('product')) {
        global $post;
        $product = wc_get_product($post->ID);
        $isbn = get_post_meta($post->ID, '_rmss_isbn', true);

        $authors = get_the_terms($post->ID, 'rmss_author');
        $publishers = get_the_terms($post->ID, 'rmss_publisher');

        $schema = array(
            '@context' => 'https://schema.org',
            '@type' => 'Book',
            'name' => $product->get_name(),
            'image' => wp_get_attachment_url($product->get_image_id()),
            'description' => wp_strip_all_tags($product->get_short_description()),
            'isbn' => $isbn,
            'offers' => array(
                '@type' => 'Offer',
                'price' => $product->get_price(),
                'priceCurrency' => get_woocommerce_currency(),
                'availability' => $product->is_in_stock() ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            ),
        );

        if ($authors && !is_wp_error($authors)) {
            $schema['author'] = array();
            foreach ($authors as $author) {
                $schema['author'][] = array(
                    '@type' => 'Person',
                    'name' => $author->name
                );
            }
        }

        if ($publishers && !is_wp_error($publishers)) {
            $schema['publisher'] = array();
            foreach ($publishers as $publisher) {
                $schema['publisher'][] = array(
                    '@type' => 'Organization',
                    'name' => $publisher->name
                );
            }
        }

        echo '<script type="application/ld+json">' . json_encode($schema) . '</script>';
    }
}
add_action('wp_head', 'trsss_output_schema');

/**
 * Add type="module" to ShelfSage JS scripts
 * This is the standard WordPress way to support ESM modules
 */
function trsss_modify_script_tag($tag, $handle, $src)
{
    $module_handles = array('trsss-app-js', 'trsss-admin-js');

    if (in_array($handle, $module_handles)) {
        return sprintf(
            '<script type="module" src="%s" id="%s-js"></script>',
            esc_url($src),
            esc_attr($handle)
        );
    }

    return $tag;
}
add_filter('script_loader_tag', 'trsss_modify_script_tag', 10, 3);
