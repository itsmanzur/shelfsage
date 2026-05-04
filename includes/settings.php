<?php
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Handles ShelfSage global settings: registration, REST API (GET/POST /shelfsage/v1/settings), and sanitization.
 */
class TRSSS_Settings
{

    /** @var string wp_options row key (same value as constant TRSSS_OPTION_SETTINGS). */
    private $option_name;

    public function __construct()
    {
        $this->option_name = TRSSS_OPTION_SETTINGS;
        // Note: Settings page is registered in includes/admin-menu.php under 'shelfsage-dashboard'.
        add_action('rest_api_init', array($this, 'register_rest_routes'));
        add_action('admin_init', array($this, 'register_setting'));
    }

    /**
     * Register settings for secure storage (Google Books API key etc.).
     */
    public function register_setting()
    {
        register_setting('shelfsage_settings', TRSSS_OPTION_SETTINGS, array(
            'type' => 'array',
        ));
    }

    /**
     * Registers REST routes for GET/POST /shelfsage/v1/settings.
     */
    public function register_rest_routes()
    {
        register_rest_route('shelfsage/v1', '/settings', array(
                array(
                'methods' => 'GET',
                'callback' => array($this, 'get_settings'),
                'permission_callback' => array($this, 'permissions_check'),
            ),
                array(
                'methods' => 'POST',
                'callback' => array($this, 'update_settings'),
                'permission_callback' => array($this, 'permissions_check'),
            ),
        ));
    }

    /**
     * REST permission callback: requires manage_options.
     *
     * @return bool
     */
    public function permissions_check()
    {
        return current_user_can('manage_options');
    }

    /**
     * Default option shape (merged with DB).
     *
     * @return array
     */
    private function get_option_defaults()
    {
        return trsss_shelfsage_option_defaults();
    }

    /**
     * Full merged settings as stored (Amazon keys may be encrypted).
     *
     * @return array
     */
    private function get_merged_stored_settings()
    {
        $defaults = $this->get_option_defaults();
        $settings = get_option($this->option_name, array());
        // Ensure affiliates is array if saved previously as empty or old format
        if (isset($settings['affiliates']) && !is_array($settings['affiliates'])) {
            $settings['affiliates'] = array();
        }
        // Ensure labels is array
        if (!isset($settings['labels']) || !is_array($settings['labels'])) {
            $settings['labels'] = array();
        }
        return wp_parse_args($settings, $defaults);
    }

    /**
     * Strip API secrets before sending settings JSON to the browser.
     *
     * @param array $settings Settings array.
     * @return array
     */
    private function mask_api_keys_for_response(array $settings)
    {
        foreach (array('amazon_access_key', 'amazon_secret_key', 'google_books_api_key') as $key) {
            if (!empty($settings[$key])) {
                $settings[$key] = '';
            }
        }
        return $settings;
    }

    /**
     * Update an encrypted secret. Blank masked values mean "keep existing"; a
     * "__TRSSS_CLEAR_SECRET__" value clears the stored key for maintenance tools.
     *
     * @param array  $settings Settings array.
     * @param array  $params   REST payload.
     * @param string $key      Secret setting key.
     * @return array
     */
    private function update_encrypted_secret(array $settings, array $params, $key)
    {
        if (!array_key_exists($key, $params)) {
            return $settings;
        }

        $value = isset($params[$key]) ? sanitize_text_field($params[$key]) : '';
        if ($value === '') {
            return $settings;
        }

        $settings[$key] = ($value === '__TRSSS_CLEAR_SECRET__') ? '' : trsss_encrypt_setting_secret($value);
        return $settings;
    }

    /**
     * Returns merged settings for REST GET (secrets never exposed).
     *
     * @return array
     */
    public function get_settings()
    {
        return $this->mask_api_keys_for_response($this->get_merged_stored_settings());
    }

    /**
     * Sanitizes and saves settings from REST POST body.
     *
     * @param \WP_REST_Request $request Request object.
     * @return \WP_REST_Response
     */
    public function update_settings($request)
    {
        $params = $request->get_json_params();
        $settings = $this->get_merged_stored_settings();

        // Sanitize and update settings
        if (isset($params['enable_custom_template']))
            $settings['enable_custom_template'] = (bool)$params['enable_custom_template'];
        if (isset($params['apply_to_all_products']))
            $settings['apply_to_all_products'] = (bool)$params['apply_to_all_products'];
        if (isset($params['single_product_layout']))
            $settings['single_product_layout'] = sanitize_text_field($params['single_product_layout']);
        if (isset($params['vault_single_layout'])) {
            $valid_vault_layouts = array('style-1', 'style-2', 'style-3', 'style-4', 'style-5', 'classic');
            $v = sanitize_text_field($params['vault_single_layout']);
            $settings['vault_single_layout'] = in_array($v, $valid_vault_layouts, true) ? $v : 'style-1';
        }
        if (isset($params['default_book_image']))
            $settings['default_book_image'] = sanitize_text_field($params['default_book_image']);
        if (isset($params['primary_color']))
            $settings['primary_color'] = sanitize_hex_color($params['primary_color']);
        if (isset($params['accent_color']))
            $settings['accent_color'] = sanitize_hex_color($params['accent_color']);
        if (isset($params['enable_look_inside']))
            $settings['enable_look_inside'] = (bool)$params['enable_look_inside'];
        if (isset($params['pdf_reader_style'])) {
            $valid_reader_styles = ['style-1', 'style-2', 'style-3'];
            $sanitized = sanitize_text_field($params['pdf_reader_style']);
            $settings['pdf_reader_style'] = in_array($sanitized, $valid_reader_styles, true) ? $sanitized : 'style-1';
        }
        if (isset($params['look_inside_btn_position'])) {
            $valid_positions = ['bottom-left', 'bottom-center', 'bottom-right', 'top-left', 'top-left-outer', 'top-right', 'overlay-center'];
            $sanitized = sanitize_text_field($params['look_inside_btn_position']);
            $settings['look_inside_btn_position'] = in_array($sanitized, $valid_positions, true) ? $sanitized : 'bottom-left';
        }

        // Book page typography (must match SettingsApp.jsx preset values).
        if (isset($params['book_font_family']) && is_string($params['book_font_family'])) {
            $allowed_book_fonts = array(
                'inherit',
                'custom',
                "'Hind Siliguri', sans-serif",
                "'Noto Serif Bengali', serif",
                "'Noto Sans Bengali', sans-serif",
                "'Kalpurush', sans-serif",
                "'SolaimanLipi', sans-serif",
                'Georgia, serif',
                "'Times New Roman', Times, serif",
                'system-ui, sans-serif',
            );
            $bf = trim(wp_check_invalid_utf8($params['book_font_family'], true));
            $settings['book_font_family'] = in_array($bf, $allowed_book_fonts, true) ? $bf : 'inherit';
        }
        if (isset($params['book_font_family_custom']) && is_string($params['book_font_family_custom'])) {
            $custom_bf = wp_strip_all_tags($params['book_font_family_custom']);
            $custom_bf = preg_replace('/[\r\n\t\0\x0B]/', '', $custom_bf);
            if (function_exists('mb_substr')) {
                $custom_bf = mb_substr($custom_bf, 0, 400, 'UTF-8');
            } else {
                $custom_bf = substr($custom_bf, 0, 400);
            }
            $settings['book_font_family_custom'] = $custom_bf;
        }

        if (isset($params['enable_affiliate']))
            $settings['enable_affiliate'] = (bool)$params['enable_affiliate'];
        if (isset($params['enable_schema']))
            $settings['enable_schema'] = (bool)$params['enable_schema'];
        if (isset($params['enable_custom_button']))
            $settings['enable_custom_button'] = (bool)$params['enable_custom_button'];
        if (isset($params['hide_add_to_cart']))
            $settings['hide_add_to_cart'] = (bool)$params['hide_add_to_cart'];

        // API credentials (encrypt at rest; blank masked values keep the existing secret)
        $settings = $this->update_encrypted_secret($settings, $params, 'amazon_access_key');
        $settings = $this->update_encrypted_secret($settings, $params, 'amazon_secret_key');
        if (isset($params['amazon_associate_tag']))
            $settings['amazon_associate_tag'] = sanitize_text_field($params['amazon_associate_tag']);
        if (isset($params['amazon_marketplace']))
            $settings['amazon_marketplace'] = sanitize_text_field($params['amazon_marketplace']);

        // Google Books API
        if (isset($params['enable_google_books']))
            $settings['enable_google_books'] = (bool)$params['enable_google_books'];
        $settings = $this->update_encrypted_secret($settings, $params, 'google_books_api_key');

        // WooCommerce Sync
        if (isset($params['wc_sync_enabled']))
            $settings['wc_sync_enabled'] = (bool)$params['wc_sync_enabled'];

        // Smart API Fallback
        if (isset($params['smart_fallback_enabled']))
            $settings['smart_fallback_enabled'] = (bool)$params['smart_fallback_enabled'];

        // Dynamic Affiliates
        if (isset($params['affiliates']) && is_array($params['affiliates'])) {
            $settings['affiliates'] = array_map(function ($item) {
                return array(
                'label' => sanitize_text_field($item['label']),
                'url' => esc_url_raw($item['url']) // Optional global default URL
                );
            }, $params['affiliates']);
        }

        // Custom Labels
        if (isset($params['labels']) && is_array($params['labels'])) {
            foreach ($params['labels'] as $key => $value) {
                $settings['labels'][$key] = sanitize_text_field($value);
            }
        }

        update_option($this->option_name, $settings);

        return rest_ensure_response(array(
            'success' => true,
            'settings' => $this->mask_api_keys_for_response($settings),
        ));
    }
}

new TRSSS_Settings();
