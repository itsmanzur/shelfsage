<?php
if (!defined('ABSPATH')) {
    exit;
}

// NOTE: rmss_shortcode CPT is registered in includes/api.php (with custom-fields support).

require_once __DIR__ . '/admin-ux-panels.php';

/**
 * Register Admin Menu
 */
function trsss_register_admin_menu()
{
    // 1. Main Parent: 'ShelfSage'
    // To fix redirection, parent slug MUST match the first submenu slug.
    // Using a unique slug 'shelfsage-dashboard' to avoid frontend conflicts.
    $main_hook = add_menu_page(
        __('ShelfSage', 'shelfsage'),
        __('ShelfSage', 'shelfsage'),
        'manage_options',
        'shelfsage-dashboard', // Maps to first submenu
        'trsss_render_admin_page', // Callback for dashboard
        'dashicons-book',
        30
    );

    // 2. Creator (React Shortcode Builder)
    $architect_hook = add_submenu_page(
        'shelfsage-dashboard',
        __('Shortcode Architect', 'shelfsage'),
        __('Shortcode Architect', 'shelfsage'),
        'manage_options',
        'shelfsage-architect',
        'trsss_render_shortcode_page'
    );

    // 4. Shortcode Hub (List of saved shortcodes)
    $saved_designs_hook = add_submenu_page(
        'shelfsage-dashboard',
        __('Shortcode Hub', 'shelfsage'),
        __('Shortcode Hub', 'shelfsage'),
        'manage_options',
        'shelfsage-saved-designs',
        'trsss_render_saved_shortcodes_page'
    );

    // 5. Library (Parent for all Taxonomies)
    $library_hook = add_submenu_page(
        'shelfsage-dashboard',
        __('Library', 'shelfsage'),
        __('Library', 'shelfsage'),
        'manage_options',
        'shelfsage-library',
        'trsss_render_library_page'
    );

    // 6. Docs & Settings (Combined)
    $docs_settings_hook = add_submenu_page(
        'shelfsage-dashboard',
        __('Settings', 'shelfsage'),
        __('Settings', 'shelfsage'),
        'manage_options',
        'shelfsage-settings',
        'trsss_render_settings_page'
    );

    // Hidden Welcome Page
    $welcome_hook = add_submenu_page(
        null, // Hidden
        __('Welcome', 'shelfsage'),
        __('Welcome', 'shelfsage'),
        'manage_options',
        'shelfsage-welcome',
        'trsss_render_welcome_page'
    );

    // Rename first submenu from "ShelfSage" to "Dashboard" — keeps parent link to shelfsage-dashboard, no duplicate.
    global $submenu;
    if (isset($submenu['shelfsage-dashboard'][0])) {
        $submenu['shelfsage-dashboard'][0][0] = __('SS Dashboard', 'shelfsage');
    }

    // Enqueue scripts
    $pages = array($main_hook, $architect_hook, $saved_designs_hook, $library_hook, $docs_settings_hook, $welcome_hook);
    foreach ($pages as $page) {
        if ($page) {
            add_action("load-$page", 'trsss_enqueue_admin_scripts');
        }
    }
}
add_action('admin_menu', 'trsss_register_admin_menu', 99);

/**
 * Render Callbacks
 */

function trsss_render_admin_page()
{
    echo '<div class="wrap shelfsage-admin-wrap">';
    trsss_render_dashboard_health_banner();
    echo '<div id="rmss-dashboard-root"></div></div>';
}

function trsss_render_shortcode_page()
{
    echo '<div class="wrap shelfsage-admin-wrap"><div id="rmss-admin-root"></div></div>';
}

function trsss_render_saved_shortcodes_page()
{
    echo '<div class="wrap shelfsage-admin-wrap"><div id="rmss-saved-shortcodes-root"></div></div>';
}

// trsss_render_docs_settings_page() removed — it was never registered to any admin menu page.

function trsss_render_settings_page()
{
    echo '<div class="wrap shelfsage-admin-wrap"><div id="rmss-settings-root"></div></div>';
}

function trsss_render_welcome_page()
{
    echo '<div class="wrap shelfsage-admin-wrap"><div id="rmss-welcome-root"></div></div>';
}

function trsss_render_library_page()
{
    echo '<div class="wrap shelfsage-admin-wrap"><div id="rmss-library-root"></div></div>';
}

/**
 * Force Relative URLs for Scripts & Styles.
 * Only applies on local development (localhost / IP / non-standard port).
 * On live servers, keep absolute URLs to avoid broken asset paths.
 */
function trsss_force_relative_src($src, $handle)
{
    if (in_array($handle, array('trsss-admin-js', 'trsss-admin-css', 'rmss-index-css'))) {
        $current_host = isset( $_SERVER['HTTP_HOST'] ) ? sanitize_text_field( wp_unslash( $_SERVER['HTTP_HOST'] ) ) : '';

        // Only convert to relative path on local dev environments (port-based URLs like :8080, :10003 etc.)
        $is_local = (
            strpos($current_host, ':') !== false ||
            in_array($current_host, array('localhost', '127.0.0.1'), true) ||
            preg_match('/\.local$/', $current_host)
        );

        if ($is_local) {
            $path = parse_url($src, PHP_URL_PATH);
            if ($path) {
                return $path;
            }
        }
    }
    return $src;
}
add_filter('script_loader_src', 'trsss_force_relative_src', 10, 2);
add_filter('style_loader_src', 'trsss_force_relative_src', 10, 2);

/**
 * Enqueue Admin Scripts
 */
function trsss_enqueue_admin_scripts()
{
    $screen = get_current_screen();
    if (!$screen || strpos($screen->id, 'shelfsage') === false) {
        return;
    }

    // Enqueue WordPress Media Uploader (Required for Vault/Settings image upload)
    wp_enqueue_media();

    // 1. Core Admin Styles
    wp_enqueue_style(
        'trsss-admin-style',
        TRSSS_URL . 'assets/index.css',
        array(),
        '1.8.5'
    );

    // 2. React Admin Bundle (defer on WP 6.3+ to reduce main-thread blocking)
    $admin_js_args = true;
    if ( apply_filters( 'trsss_enqueue_admin_bundle_deferred', true ) && version_compare( get_bloginfo( 'version' ), '6.3', '>=' ) ) {
        $admin_js_args = array(
            'in_footer' => true,
            'strategy'  => 'defer',
        );
    }
    // Version = file mtime so browser always loads the freshest build.
    $admin_js_path = TRSSS_PATH . 'assets/shelfsage-admin.js';
    $admin_js_ver  = file_exists( $admin_js_path ) ? filemtime( $admin_js_path ) : '1.8.5';
    wp_enqueue_script(
        'trsss-admin-js',
        TRSSS_URL . 'assets/shelfsage-admin.js',
        array( 'wp-element', 'wp-i18n' ),
        $admin_js_ver,
        $admin_js_args
    );

    // 3. Custom React extensions (built from src/ via Vite)
    $custom_chunk = TRSSS_URL . 'assets/custom/chunks/client-CDJS2rZV.js';
    $custom_admin = TRSSS_URL . 'assets/custom/ss-admin-custom.js';
    if ( file_exists( TRSSS_PATH . 'assets/custom/ss-admin-custom.js' ) ) {
        wp_enqueue_script( 'trsss-react-chunk', $custom_chunk, array(), TRSSS_VERSION ?? '1.5.0', true );
        wp_enqueue_script( 'trsss-admin-custom', $custom_admin, array( 'trsss-react-chunk' ), TRSSS_VERSION ?? '1.5.0', true );
    }

    wp_enqueue_style('trsss-google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap', array(), null);

    $custom_admin_css = "
        :root { --rmss-font-sans: 'Inter', system-ui, -apple-system, sans-serif; --rmss-font-serif: 'Lora', Georgia, serif; }
        .shelfsage-admin-wrap { max-width: 1600px; }
        #rmss-admin-root, #rmss-dashboard-root, #rmss-settings-root, #rmss-saved-shortcodes-root, #rmss-library-root, #rmss-welcome-root { font-family: var(--rmss-font-sans); min-height: 280px; }
        #rmss-welcome-root h1, #rmss-welcome-root h2, #rmss-welcome-root h3 { font-family: var(--rmss-font-serif); }
    ";
    wp_add_inline_style('trsss-admin-style', $custom_admin_css);

    // Simplified Low Stock Logic for Dashboard Control Center (capped; full count can be huge)
    $low_stock_cap = max( 1, min( 2000, (int) apply_filters( 'trsss_admin_dashboard_low_stock_cap', 500 ) ) );
    $low_stock_wc = trsss_is_woocommerce_available() ? get_posts( array(
        'post_type'      => 'product',
        'posts_per_page' => $low_stock_cap + 1,
        'meta_query'     => array(
            'relation' => 'AND',
            array(
                'key'     => '_stock',
                'value'   => 5,
                'compare' => '<',
                'type'    => 'NUMERIC',
            ),
            array(
                'key'     => '_manage_stock',
                'value'   => 'yes',
                'compare' => '=',
            ),
        ),
        'fields'         => 'ids',
    ) ) : array();
    if ( count( $low_stock_wc ) > $low_stock_cap ) {
        $low_stock_wc = array_slice( $low_stock_wc, 0, $low_stock_cap );
        $low_stock_wc_truncated = true;
    } else {
        $low_stock_wc_truncated = false;
    }

    $low_stock_vault = get_posts( array(
        'post_type'      => 'ss_vault_assets',
        'posts_per_page' => $low_stock_cap + 1,
        'meta_query'     => array(
            array(
                'key'     => '_ss_vault_stock_quantity',
                'value'   => 5,
                'compare' => '<',
                'type'    => 'NUMERIC',
            ),
        ),
        'fields'         => 'ids',
    ) );
    if ( count( $low_stock_vault ) > $low_stock_cap ) {
        $low_stock_vault = array_slice( $low_stock_vault, 0, $low_stock_cap );
        $low_stock_vault_truncated = true;
    } else {
        $low_stock_vault_truncated = false;
    }

    // Fetch Recent Activity (Last 3 modified items)
    $recent_activity_posts = get_posts(array(
        'post_type' => trsss_is_woocommerce_available() ? array('product', 'ss_vault_assets', 'rmss_shortcode') : array('ss_vault_assets', 'rmss_shortcode'),
        'post_status' => 'publish',
        'orderby' => 'modified',
        'order' => 'DESC',
        'posts_per_page' => 3
    ));

    $activity_feed = array();
    foreach ($recent_activity_posts as $post) {
        $type = 'Action';
        if ($post->post_type === 'product')
            $type = 'Book added';
        if ($post->post_type === 'ss_vault_assets')
            $type = 'Vault Asset updated';
        if ($post->post_type === 'rmss_shortcode')
            $type = 'Design created';

        $activity_feed[] = array(
            'title' => $post->post_title,
            'type' => $type,
            'time' => human_time_diff(get_post_modified_time('U', true, $post), time()) . ' ago'
        );
    }

    $current_user = wp_get_current_user();

    $counts_product = trsss_is_woocommerce_available() ? wp_count_posts('product') : (object) array( 'publish' => 0 );
    $counts_vault = wp_count_posts('ss_vault_assets');
    $counts_shortcode = wp_count_posts('rmss_shortcode');

    $stats = array(
        'total_books' => isset($counts_product->publish) ? (int)$counts_product->publish : 0,
        'total_vault' => isset($counts_vault->publish) ? (int)$counts_vault->publish : 0,
        'total_shortcodes' => isset($counts_shortcode->publish) ? (int)$counts_shortcode->publish : 0,
        'low_stock_count' => count( $low_stock_wc ) + count( $low_stock_vault ),
        'low_stock_truncated' => $low_stock_wc_truncated || $low_stock_vault_truncated,
        'low_stock_query_cap' => $low_stock_cap,
        'total_authors' => wp_count_terms( array( 'taxonomy' => 'rmss_author', 'hide_empty' => false ) ),
        'total_publishers' => wp_count_terms( array( 'taxonomy' => 'rmss_publisher', 'hide_empty' => false ) ),
        'recent_activity' => $activity_feed
    );

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

    $global_settings = array(
        'apiUrl' => esc_url_raw(rest_url('shelfsage/v1')), // For SettingsApp
        'restUrl' => esc_url_raw(rest_url('shelfsage/v1')), // For Architect/SavedShortcodes
        'wpRestUrl' => esc_url_raw(rest_url('wp/v2')), // Standard WP REST API
        'nonce' => wp_create_nonce('wp_rest'),
        'restNonce' => wp_create_nonce('wp_rest'), // Alias for compatibility
        'woocommerceAvailable' => trsss_is_woocommerce_available(),
        'fetchBooksNonce' => wp_create_nonce('rmss_fetch_google_books'), // Smart Book Ingester AJAX
        'amazonSearchNonce' => wp_create_nonce('rmss_amazon_search'), // Amazon PA-API AJAX
        // AJAX fallback nonces (for when REST API is blocked on live servers)
        'ajaxSaveSettingsNonce' => wp_create_nonce('trsss_ajax_save_settings'),
        'ajaxSaveShortcodeNonce' => wp_create_nonce('trsss_ajax_save_shortcode_v2'),
        'ajaxListShortcodesNonce' => wp_create_nonce('trsss_ajax_list_shortcodes'),
        'adminUrl' => admin_url('admin.php'),
        'adminName' => $current_user->display_name,
        'ajaxurl' => admin_url('admin-ajax.php'), // Ensure ajaxurl is available
        'repairNonce' => wp_create_nonce('trsss_repair_product_slugs'),
        'stats' => $stats,
        'labels' => $labels,
        'isPro' => true,
        'licenseNotRequired' => true,
        'enable_look_inside' => !empty($settings['enable_look_inside']),
        'pdf_reader_style' => isset($settings['pdf_reader_style']) ? $settings['pdf_reader_style'] : 'style-1',
        'look_inside_btn_position' => isset($settings['look_inside_btn_position']) ? $settings['look_inside_btn_position'] : 'bottom-left',
        'default_book_image' => isset($settings['default_book_image']) ? esc_url_raw($settings['default_book_image']) : '',
        // API key presence flags
        'apiStatus' => array(
            'googleBooks' => !empty($settings['google_books_api_key']),
            'amazonPA' => !empty($settings['amazon_access_key']) && !empty($settings['amazon_secret_key']),
        ),
        'googleBooksApiKey' => !empty($settings['google_books_api_key']) ? true : false,
        'amazonAccessKey' => !empty($settings['amazon_access_key']) ? true : false,
        // Smart Fallback toggle state for JS
        'smartFallbackEnabled' => !empty($settings['smart_fallback_enabled']),
        // Pass current screen info to help React Router hydration
        'currentScreen' => array(
            'id' => $screen ? $screen->id : '',
            'base' => $screen ? $screen->base : '',
            'parent_base' => $screen ? $screen->parent_base : '',
            // Check for specific page param if any
            'page' => isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '',
            // For Library page (?page=shelfsage-library), default view to 'overview' so the DashboardApp shows Library content
            'view' => trsss_get_current_screen_view(),
            'tab' => isset($_GET['tab']) ? sanitize_text_field(wp_unslash($_GET['tab'])) : '',
            'source' => isset($_GET['source']) ? sanitize_text_field(wp_unslash($_GET['source'])) : '',
        ),
    );

    $global_settings = apply_filters('trsss_admin_global_settings', $global_settings);

    wp_localize_script('trsss-admin-js', 'rmssAdminSettings', $global_settings); // For Admin
    wp_localize_script('trsss-admin-js', 'rmssSettings', $global_settings); // Fallback/Frontend

    // Inline diagnostic & AJAX fallback script
    // লাইভ সার্ভারে REST API block থাকলে fetch interceptor দিয়ে admin-ajax.php-তে fall back করে
    $ajax_url   = admin_url('admin-ajax.php');
    $rest_base  = esc_js(rest_url('shelfsage/v1'));
    $save_settings_nonce = wp_create_nonce('trsss_ajax_save_settings');
    $save_sc_nonce       = wp_create_nonce('trsss_ajax_save_shortcode_v2');
    $list_sc_nonce       = wp_create_nonce('trsss_ajax_list_shortcodes');

    $inline_js = "
(function() {
    // ShelfSage REST→AJAX Fallback Layer v2
    // লাইভে REST API 401 / 403 / 404 এলে admin-ajax.php-তে ফলব্যাক করে।
    // একটি quick probe করে: REST কাজ না করলে সরাসরি AJAX mode-এ যায়।
    var _rmssAjaxUrl  = '" . esc_js($ajax_url) . "';
    var _rmssRestBase = '" . $rest_base . "';
    var _useAjax      = false; // সত্যি হলে REST চেষ্টাই করবে না
    var _probed       = false;
    var _origFetch    = window.fetch;

    var _rmssNonces = {
        settings      : '" . esc_js($save_settings_nonce) . "',
        shortcode     : '" . esc_js($save_sc_nonce) . "',
        listShortcodes: '" . esc_js($list_sc_nonce) . "'
    };

    // ── Quick REST probe (one-time, silent) ───────────────────────────────────
    function _probe() {
        if (_probed) return;
        _probed = true;
        _origFetch(_rmssRestBase + '/shortcodes?per_page=1', {
            headers: { 'X-WP-Nonce': (window.rmssAdminSettings && window.rmssAdminSettings.nonce) || '' }
        }).then(function(r) {
            if (r.status === 404 || r.status === 401 || r.status === 403) {
                console.warn('[ShelfSage] REST API unavailable (HTTP ' + r.status + '). Switching to AJAX mode permanently.');
                _useAjax = true;
            }
        }).catch(function() {
            _useAjax = true;
        });
    }
    _probe();

    // ── Fetch interceptor ─────────────────────────────────────────────────────
    window.fetch = function(url, opts) {
        var urlStr = (typeof url === 'string') ? url : (url && url.url ? url.url : String(url));

        // শুধু শেলফসেজ REST endpoint-এ কাজ করে
        if (urlStr.indexOf('/shelfsage/v1') === -1) {
            return _origFetch.apply(this, arguments);
        }

        // AJAX mode চালু থাকলে সরাসরি fallback
        if (_useAjax) {
            return _rmssAjaxFallback(urlStr, opts);
        }

        return _origFetch.apply(this, arguments).then(function(resp) {
            if (resp.status === 401 || resp.status === 403 || resp.status === 404) {
                console.warn('[ShelfSage] REST blocked (HTTP ' + resp.status + '). Switching to AJAX mode.');
                _useAjax = true;
                return _rmssAjaxFallback(urlStr, opts);
            }
            return resp;
        }).catch(function(err) {
            console.warn('[ShelfSage] REST fetch error, using AJAX:', err);
            _useAjax = true;
            return _rmssAjaxFallback(urlStr, opts);
        });
    };

    // ── AJAX fallback dispatcher ──────────────────────────────────────────────
    function _rmssAjaxFallback(urlStr, opts) {
        var method = (opts && opts.method) ? opts.method.toUpperCase() : 'GET';
        var fd = new FormData();

        if (urlStr.indexOf('/settings') !== -1) {
            if (method === 'GET') {
                fd.append('action', 'trsss_ajax_get_settings');
                fd.append('nonce', _rmssNonces.settings);
            } else {
                fd.append('action', 'trsss_ajax_save_settings');
                fd.append('nonce', _rmssNonces.settings);
                if (opts && opts.body) { fd.append('settings', opts.body); }
            }
        } else if (urlStr.match(/\\/shortcodes\\/\\d+/)) {
            var idMatch = urlStr.match(/\\/shortcodes\\/(\\d+)/);
            fd.append('action', 'trsss_ajax_save_shortcode_v2');
            fd.append('nonce', _rmssNonces.shortcode);
            fd.append('id', idMatch ? idMatch[1] : 0);
            fd.append('crud_action', method === 'DELETE' ? 'delete' : 'update');
            if (opts && opts.body) { fd.append('data', opts.body); }
        } else if (urlStr.indexOf('/shortcodes') !== -1) {
            if (method === 'GET') {
                fd.append('action', 'trsss_ajax_list_shortcodes');
                fd.append('nonce', _rmssNonces.listShortcodes);
            } else {
                fd.append('action', 'trsss_ajax_save_shortcode_v2');
                fd.append('nonce', _rmssNonces.shortcode);
                fd.append('crud_action', 'create');
                if (opts && opts.body) { fd.append('data', opts.body); }
            }
        } else if (urlStr.indexOf('/test-api-connection') !== -1) {
            fd.append('action', 'trsss_ajax_test_api_connection');
            fd.append('nonce', _rmssNonces.settings);
            if (opts && opts.body) { fd.append('payload', opts.body); }
        } else if (urlStr.indexOf('/search') !== -1) {
            fd.append('action', 'trsss_ajax_rest_search_fallback');
            fd.append('nonce', _rmssNonces.listShortcodes);
            var _qidx = urlStr.indexOf('?');
            fd.append('query_string', _qidx >= 0 ? urlStr.substring(_qidx + 1) : '');
        } else if (urlStr.indexOf('/filters') !== -1) {
            fd.append('action', 'trsss_ajax_rest_filters_fallback');
            fd.append('nonce', _rmssNonces.listShortcodes);
        } else if (urlStr.indexOf('/products') !== -1 || urlStr.indexOf('/taxonomies') !== -1) {
            // Products & Taxonomies: list only via AJAX
            fd.append('action', 'trsss_ajax_get_products_or_terms');
            fd.append('nonce', _rmssNonces.listShortcodes);
            fd.append('endpoint', urlStr);
        } else {
            // Unknown → empty success so UI doesn't crash
            return Promise.resolve(new Response(JSON.stringify([]), {status: 200, headers: {'Content-Type':'application/json'}}));
        }

        return _origFetch(_rmssAjaxUrl, { method: 'POST', body: fd })
            .then(function(r) { return r.json(); })
            .then(function(json) {
                var body = json.success ? json.data : (json.data || json);
                return new Response(JSON.stringify(body), {
                    status: json.success ? 200 : 400,
                    headers: {'Content-Type': 'application/json'}
                });
            }).catch(function() {
                return new Response(JSON.stringify([]), {status: 200, headers: {'Content-Type':'application/json'}});
            });
    }
})();
";
    wp_add_inline_script('trsss-admin-js', $inline_js, 'before');

    // ── Test API Connection UI ────────────────────────────────────────────────
    $test_nonce  = wp_create_nonce( 'wp_rest' );
    $test_api_url = esc_js( rest_url( 'shelfsage/v1/test-api-connection' ) );
    $test_ui_js = "
(function() {
    var _testNonce  = '" . esc_js( wp_create_nonce('wp_rest') ) . "';
    var _testApiUrl = '" . esc_js( rest_url('shelfsage/v1/test-api-connection') ) . "';
    var _ajaxUrl    = '" . esc_js( admin_url('admin-ajax.php') ) . "';
    var _ajaxNonce  = '" . esc_js( wp_create_nonce('trsss_ajax_save_settings') ) . "';

    function _btn(id, label, color) {
        var b = document.createElement('button');
        b.type = 'button'; b.id = id;
        b.textContent = label;
        b.style.cssText = 'margin-left:8px;padding:4px 12px;border-radius:6px;border:1px solid '+color+';background:#fff;color:'+color+';cursor:pointer;font-size:13px;font-weight:600;transition:background .2s,color .2s;';
        b.onmouseover = function(){ b.style.background=color; b.style.color='#fff'; };
        b.onmouseout  = function(){ b.style.background='#fff'; b.style.color=color; };
        return b;
    }

    function _badge(id) {
        var s = document.createElement('span');
        s.id = id;
        s.style.cssText = 'margin-left:8px;font-size:12px;font-weight:600;padding:2px 8px;border-radius:4px;display:none;';
        return s;
    }

    function _showBadge(el, ok, msg, latency) {
        el.style.display = 'inline-block';
        el.style.background = ok ? '#d1fae5' : '#fee2e2';
        el.style.color       = ok ? '#065f46' : '#991b1b';
        var lat = latency ? ' (' + latency + 'ms)' : '';
        el.textContent = (ok ? '✓ ' : '✗ ') + msg + lat;
    }

    function _doTest(api, badge, btn) {
        btn.disabled = true;
        btn.textContent = '…';
        badge.style.display = 'none';

        var body = JSON.stringify({ api: api });

        fetch(_testApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': _testNonce },
            body: body
        }).then(function(r) {
            if (!r.ok && r.status !== 200) throw new Error('HTTP ' + r.status);
            return r.json();
        }).then(function(data) {
            // data may be wrapped or direct
            var d = data.ok !== undefined ? data : (data.data || data);
            _showBadge(badge, !!d.ok, d.message || '', d.latency_ms);
        }).catch(function() {
            // AJAX fallback
            var fd = new FormData();
            fd.append('action', 'trsss_ajax_test_api_connection');
            fd.append('nonce', _ajaxNonce);
            fd.append('payload', body);
            return fetch(_ajaxUrl, { method: 'POST', body: fd })
                .then(function(r){ return r.json(); })
                .then(function(json){
                    var d = json.success ? json.data : { ok: false, message: json.data && json.data.message ? json.data.message : 'Request failed' };
                    _showBadge(badge, !!d.ok, d.message || '', d.latency_ms);
                });
        }).finally(function() {
            btn.disabled = false;
            btn.textContent = 'Test Connection';
        });
    }

    function _inject() {
        // Settings page only
        var page = new URLSearchParams(window.location.search).get('page') || '';
        if (page !== 'shelfsage-settings' && page !== 'shelfsage-dashboard') return;

        var _MAX_TRIES = 40, _tries = 0;
        var _timer = setInterval(function() {
            _tries++;
            if (_tries > _MAX_TRIES) { clearInterval(_timer); return; }

            // ── Google Books ──────────────────────────────────────────────────
            if (!document.getElementById('ss-test-gb-btn')) {
                // Look for input[name=google_books_api_key] or any input with 'google' in a label
                var gbInputs = document.querySelectorAll('input[type=\"password\"], input[type=\"text\"]');
                var gbInput = null;
                gbInputs.forEach(function(inp) {
                    var label = inp.closest('label') || inp.parentElement;
                    var txt   = (inp.getAttribute('placeholder') || '') + (label ? label.textContent : '') + (inp.getAttribute('name') || '');
                    if (/google.*key|api.*key/i.test(txt) && !gbInput) gbInput = inp;
                });
                if (gbInput) {
                    var gbBtn   = _btn('ss-test-gb-btn', 'Test Connection', '#16a34a');
                    var gbBadge = _badge('ss-test-gb-badge');
                    gbInput.parentNode.insertBefore(gbBtn, gbInput.nextSibling);
                    gbInput.parentNode.insertBefore(gbBadge, gbBtn.nextSibling);
                    gbBtn.addEventListener('click', function() { _doTest('google_books', gbBadge, gbBtn); });
                }
            }

            if (document.getElementById('ss-test-gb-btn')) {
                clearInterval(_timer);
            }
        }, 300);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _inject);
    } else {
        _inject();
    }
})();
";
    wp_add_inline_script('trsss-admin-js', $test_ui_js, 'after');
}

/**
 * Return current screen 'view' for React. On Library page, default to 'overview' so the page loads.
 */
function trsss_get_current_screen_view()
{
    $page = isset($_GET['page']) ? sanitize_text_field(wp_unslash($_GET['page'])) : '';
    $view = isset($_GET['view']) ? sanitize_text_field(wp_unslash($_GET['view'])) : '';
    if ($page === 'shelfsage-library' && $view === '') {
        return 'overview';
    }
    return $view;
}

/**
 * Handle AJAX Save
 */
function trsss_ajax_save_shortcode()
{
    check_ajax_referer('trsss_ajax_save_shortcode_v2', 'nonce');

    if (!current_user_can('manage_options')) {
        wp_send_json_error('Permission denied');
    }

    $title = isset($_POST['title']) ? sanitize_text_field(wp_unslash($_POST['title'])) : 'Untitled';

    $settings_json = isset($_POST['settings']) ? wp_unslash($_POST['settings']) : '{}';
    if (strlen($settings_json) > 500000) {
        wp_send_json_error('Settings payload too large');
    }
    $settings = json_decode($settings_json, true);

    if (!is_array($settings)) {
        $settings = array();
    }

    $settings = map_deep($settings, 'sanitize_text_field');

    $post_data = array(
        'post_title' => $title,
        'post_type' => 'rmss_shortcode',
        'post_status' => 'publish',
    );

    $post_id = wp_insert_post($post_data);

    if ($post_id && !is_wp_error($post_id)) {
        update_post_meta($post_id, '_rmss_settings', $settings);
        clean_post_cache($post_id);
        do_action('trsss_shortcode_design_saved', $post_id);
        wp_send_json_success(array('id' => $post_id, 'message' => 'Saved successfully'));
    }
    else {
        $error_msg = is_wp_error($post_id) ? $post_id->get_error_message() : 'Failed to insert post';
        wp_send_json_error('Failed to save: ' . $error_msg);
    }
}
add_action('wp_ajax_rmss_save_shortcode', 'trsss_ajax_save_shortcode');

/**
 * Handle Book Fetch via AJAX
 */
function trsss_ajax_fetch_books()
{
    check_ajax_referer('wp_rest', 'nonce');

    if (!current_user_can('edit_posts')) {
        wp_send_json_error('Permission denied');
    }

    if ( ! trsss_is_woocommerce_available() ) {
        wp_send_json_error( trsss_woocommerce_required_error()->get_error_message(), 400 );
    }

    $term = isset($_GET['term']) ? sanitize_text_field(wp_unslash($_GET['term'])) : '';
    $authors = isset($_GET['author']) ? sanitize_text_field(wp_unslash($_GET['author'])) : '';
    $genres = isset($_GET['genre']) ? sanitize_text_field(wp_unslash($_GET['genre'])) : '';

    $args = array(
        'post_type' => 'product',
        'posts_per_page' => 20,
        'post_status' => 'publish',
        'orderby' => 'date',
        'order' => 'DESC'
    );

    if (!empty($term)) {
        $args['s'] = $term;
        $args['orderby'] = 'relevance';
    }

    $tax_query = array();

    if (!empty($authors)) {
        $author_slugs = array_map('trim', explode(',', $authors));
        $tax_query[] = array('taxonomy' => 'rmss_author', 'field' => 'slug', 'terms' => $author_slugs);
    }

    if (!empty($genres)) {
        $genre_slugs = array_map('trim', explode(',', $genres));
        $tax_query[] = array('taxonomy' => 'rmss_genre', 'field' => 'slug', 'terms' => $genre_slugs);
    }

    if (!empty($tax_query)) {
        if (count($tax_query) > 1)
            $tax_query['relation'] = 'AND';
        $args['tax_query'] = $tax_query;
    }

    $query = new WP_Query($args);
    $results = array();

    if ($query->have_posts()) {
        while ($query->have_posts()) {
            $query->the_post();
            $product_id = get_the_ID();
            $product = wc_get_product($product_id);

            if (!$product)
                continue;

            $author_terms = get_the_terms($product_id, 'rmss_author');
            $author_names = $author_terms && !is_wp_error($author_terms) ? wp_list_pluck($author_terms, 'name') : array();

            $image_id = $product->get_image_id();
            $image_url = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_thumbnail') : wc_placeholder_img_src('woocommerce_thumbnail');

            $results[] = array(
                'id' => $product_id,
                'title' => $product->get_title(),
                'thumbnail' => $image_url,
                'authors' => implode(', ', $author_names),
                'price' => $product->get_price_html(),
                'permalink' => get_permalink($product_id),
                'genre' => wc_get_product_category_list($product_id),
                'summary' => wp_trim_words($product->get_short_description(), 10),
                'rating' => wc_get_rating_html($product->get_average_rating())
            );
        }
        wp_reset_postdata();
    }

    wp_send_json_success(array('data' => $results));
}
add_action('wp_ajax_rmss_fetch_books', 'trsss_ajax_fetch_books');
// Note: nopriv removed — trsss_ajax_fetch_books requires admin capabilities.
