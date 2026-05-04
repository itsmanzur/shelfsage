<?php
/**
 * ShelfSage Single Product Template — Style 4 (Editorial / Literary)
 * Pro-only clean white design, inspired by modern literary bookstore UI.
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

global $product;

// Ensure we have a WC_Product object (global $product can be string/ID in some contexts)
if ( ! is_a( $product, 'WC_Product' ) ) {
    $product = wc_get_product( is_numeric( $product ) ? $product : get_the_ID() );
}
if ( ! $product || ! is_a( $product, 'WC_Product' ) ) {
    esc_html_e( 'Product not found.', 'shelfsage' );
    get_footer();
    exit;
}

$product_id = $product->get_id();

// Force CSS
echo '<link rel="stylesheet" id="rmss-app-css-forced" href="' . esc_url( TRSSS_URL . 'assets/index.css?ver=' . trsss_asset_version( 'assets/index.css' ) ) . '" media="all" />';

// ── Meta Fields ──────────────────────────────────────────────────────────────
$isbn = get_post_meta($product_id, '_rmss_isbn', true);
$isbn13 = get_post_meta($product_id, '_rmss_isbn13', true);
$pages = get_post_meta($product_id, '_rmss_pages', true);
$language = get_post_meta($product_id, '_rmss_language', true);
$format = get_post_meta($product_id, '_rmss_format', true);
$pub_date = get_post_meta($product_id, '_rmss_publication_date', true);
$edition = get_post_meta($product_id, '_rmss_edition', true);
$dimension = get_post_meta($product_id, '_rmss_dimension', true);
$weight = get_post_meta($product_id, '_rmss_weight', true);
$binding = get_post_meta($product_id, '_rmss_binding', true) ?: $format;
$look_inside_url = get_post_meta($product_id, '_rmss_look_inside_url', true);

// ── Taxonomies ────────────────────────────────────────────────────────────────
$authors = get_the_terms($product_id, 'rmss_author');
$genres = get_the_terms($product_id, 'rmss_genre');
$publishers = get_the_terms($product_id, 'rmss_publisher');

$primary_author = ($authors && !is_wp_error($authors)) ? $authors[0] : null;
$author_image_id = $primary_author ? get_term_meta($primary_author->term_id, 'rmss_image_id', true) : null;
$author_image_url = $author_image_id ? wp_get_attachment_image_url($author_image_id, 'thumbnail') : null;
$author_bio = $primary_author ? term_description($primary_author->term_id, 'rmss_author') : '';
$author_link = trsss_safe_term_link( $primary_author );

$genre_names = ($genres && !is_wp_error($genres)) ? implode(', ', wp_list_pluck($genres, 'name')) : '';

// ── Product Data ──────────────────────────────────────────────────────────────
$title = $product->get_name();
$price_html = wp_kses_post( $product->get_price_html() );
$regular_price = $product->get_regular_price();
$sale_price = $product->get_sale_price();
$is_on_sale = $product->is_on_sale();
$description = $product->get_description();
$short_desc = $product->get_short_description();
$image_id = $product->get_image_id();
$image_url = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_single') : wc_placeholder_img_src('woocommerce_single');

$is_new = (time() - strtotime($product->get_date_created())) < (60 * DAY_IN_SECONDS);

// ── Settings & Labels ────────────────────────────────────────────────────────
$settings = trsss_get_shelfsage_settings_array();
$label_defaults = array(
    'add_to_cart' => 'Add to Cart',
    'look_inside' => 'Look Inside',
    'custom_button' => 'View Details',
    'view_cart' => 'View Cart',
);
$saved_labels = (isset($settings['labels']) && is_array($settings['labels'])) ? $settings['labels'] : array();
$labels = array_merge($label_defaults, array_filter($saved_labels, function ($v) { return $v !== null && $v !== ''; }));
if (!function_exists('rmss_get_label')) {
    function rmss_get_label($key, $default, $labels) {
        return !empty($labels[$key]) ? $labels[$key] : $default;
    }
}

// Affiliate Links
$affiliates = [];
$global_affiliates = isset($settings['affiliates']) ? $settings['affiliates'] : [];
if (!empty($global_affiliates)) {
    $index = 1;
    foreach ($global_affiliates as $g_aff) {
        $url = get_post_meta($product_id, '_rmss_affiliate_url_' . $index, true) ?: (isset($g_aff['url']) ? $g_aff['url'] : '');
        $label = isset($g_aff['label']) ? $g_aff['label'] : 'Buy';
        if ($url && $url !== '#') {
            $affiliates[] = ['name' => $label, 'url' => $url];
        }
        $index++;
    }
}
?>

<style>
/* ── Style-4 Scoped Styles ── */
.s4-wrap { font-family: 'Georgia', 'Times New Roman', serif; }
.s4-wrap * { box-sizing: border-box; }
.s4-sans { font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; }
.s4-title { font-size: clamp(2.5rem, 5vw, 4rem); font-weight: 900; letter-spacing: -0.03em; line-height: 1.05; }
.s4-tab-btn { position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #9ca3af; padding: 1rem 0; border: none; background: none; cursor: pointer; transition: color 0.2s; }
.s4-tab-btn.active { color: #111827; }
.s4-tab-btn::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 2px; background: #111827; transform: scaleX(0); transition: transform 0.2s; }
.s4-tab-btn.active::after { transform: scaleX(1); }
.s4-tab-panel { display: none; }
.s4-tab-panel.active { display: block; }
.s4-spec-label { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; color: #9ca3af; margin-bottom: 0.25rem; }
.s4-spec-value { font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif; font-size: 0.95rem; font-weight: 600; color: #111827; }
.s4-qty-btn { width: 2rem; height: 2rem; display: flex; align-items: center; justify-content: center; border: 1px solid #e5e7eb; border-radius: 50%; cursor: pointer; font-size: 1.1rem; color: #6b7280; transition: all 0.2s; background: white; }
.s4-qty-btn:hover { border-color: #111827; color: #111827; }
/* WooCommerce review styles */
.s4-reviews-wrap .woocommerce-Reviews .comment-form { background: #f9fafb; border-radius: 12px; padding: 1.5rem; }
.s4-reviews-wrap .woocommerce-Reviews .comment-form textarea, .s4-reviews-wrap .woocommerce-Reviews .comment-form input[type="text"], .s4-reviews-wrap .woocommerce-Reviews .comment-form input[type="email"] { border: 1px solid #e5e7eb; border-radius: 8px; padding: 0.6rem 1rem; width: 100%; font-size: 0.9rem; outline: none; }
.s4-reviews-wrap .woocommerce-Reviews .comment-form textarea:focus, .s4-reviews-wrap .woocommerce-Reviews .comment-form input:focus { border-color: #111827; }
.s4-reviews-wrap .woocommerce-Reviews .comment-form .form-submit input { background: #111827; color: white; padding: 0.6rem 1.5rem; border-radius: 8px; border: none; cursor: pointer; font-weight: 700; }
</style>

<div class="s4-wrap bg-gray-50 min-h-screen">

    <!-- ══ HERO SECTION ══ -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-start">

        <!-- LEFT: Cover Image -->
        <div class="relative">
            <!-- Badges -->
            <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <?php if ($is_on_sale): ?>
                    <span class="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">SALE</span>
                <?php
endif; ?>
                <?php if ($is_new): ?>
                    <span class="bg-emerald-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider shadow">NEW</span>
                <?php
endif; ?>
            </div>
            <div class="rounded-2xl overflow-hidden shadow-2xl bg-white">
                <img
                    src="<?php echo esc_url($image_url); ?>"
                    alt="<?php echo esc_attr($title); ?>"
                    class="w-full h-auto object-cover"
                    style="max-height: 520px; object-fit: cover;"
                />
            </div>
        </div>

        <!-- RIGHT: Product Info -->
        <div class="flex flex-col gap-5 pt-2">

            <!-- Genre breadcrumb -->
            <?php if ($genre_names): ?>
                <p class="s4-sans text-xs font-bold tracking-widest uppercase text-gray-400"><?php echo esc_html($genre_names); ?></p>
            <?php
endif; ?>

            <!-- Title -->
            <h1 class="s4-title text-gray-900"><?php echo esc_html($title); ?></h1>

            <!-- Price + Author avatar row -->
            <div class="flex items-center gap-5 flex-wrap">
                <div class="s4-sans flex items-baseline gap-3">
                    <span class="text-3xl font-black text-gray-900">
                        <?php
echo wp_kses_post( wc_price($product->get_price()) );
?>
                    </span>
                    <?php if ($is_on_sale && $regular_price): ?>
                        <span class="text-lg text-gray-400 line-through"><?php echo wp_kses_post( wc_price($regular_price) ); ?></span>
                    <?php
endif; ?>
                </div>

                <?php if ($primary_author): ?>
                    <div class="flex items-center gap-2 ml-auto">
                        <div class="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-sm overflow-hidden flex-shrink-0">
                            <?php if ($author_image_url): ?>
                                <img src="<?php echo esc_url($author_image_url); ?>" alt="<?php echo esc_attr($primary_author->name); ?>" class="w-full h-full object-cover" />
                            <?php
    else: ?>
                                <?php echo esc_html(strtoupper(mb_substr($primary_author->name, 0, 1))); ?>
                            <?php
    endif; ?>
                        </div>
                        <div>
                            <p class="s4-sans text-[9px] font-bold uppercase tracking-widest text-gray-400">Author</p>
                            <p class="s4-sans text-sm font-bold text-gray-800"><?php echo esc_html($primary_author->name); ?></p>
                        </div>
                    </div>
                <?php
endif; ?>
            </div>
            <?php trsss_render_preorder_countdown( $product_id, array( 'class' => 's4-sans' ) ); ?>

            <!-- Short description -->
            <?php if ($short_desc): ?>
                <p class="text-gray-500 leading-relaxed text-[0.95rem]"><?php echo wp_kses_post($short_desc); ?></p>
            <?php
endif; ?>

            <!-- Quantity + Add to Cart -->
            <?php $show_cart_s4 = !filter_var($settings['hide_add_to_cart'] ?? false, FILTER_VALIDATE_BOOLEAN) && $product->is_purchasable() && $product->is_in_stock(); ?>
            <?php if ($show_cart_s4): ?>
                <form class="cart" method="post" enctype="multipart/form-data" action="<?php echo esc_url(get_permalink($product_id)); ?>">
                    <div class="flex items-center gap-2.5 flex-wrap">
                        <!-- Qty Stepper -->
                        <div class="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm h-9">
                            <button
                                type="button"
                                class="s4-sans px-3 h-full text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-bold text-base"
                                onclick="var q=this.parentNode.querySelector('input');var v=parseInt(q.value)||1;if(v>1){q.value=v-1;}"
                                aria-label="Decrease quantity"
                            >−</button>
                            <input
                                type="number"
                                name="quantity"
                                value="1"
                                min="1"
                                class="w-9 text-center font-bold text-gray-800 text-sm border-x border-gray-100 outline-none bg-transparent h-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                style="-moz-appearance:textfield;"
                            />
                            <button
                                type="button"
                                class="s4-sans px-3 h-full text-gray-500 hover:bg-indigo-50 hover:text-indigo-700 transition-colors font-bold text-base"
                                onclick="var q=this.parentNode.querySelector('input');q.value=(parseInt(q.value)||1)+1;"
                                aria-label="Increase quantity"
                            >+</button>
                        </div>

                        <!-- Add to Cart — compact -->
                        <button
                            type="submit"
                            name="add-to-cart"
                            value="<?php echo absint($product_id); ?>"
                            class="s4-sans flex-1 bg-gray-900 hover:bg-gray-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md h-9"
                        >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            <?php echo esc_html(rmss_get_label('add_to_cart', 'Add to Cart', $labels)); ?>
                        </button>

                        <?php do_action( 'woocommerce_after_add_to_cart_button' ); ?>

                        <!-- Wishlist icon -->
                        <?php if (function_exists('YITH_WCWL')): ?>
                            <?php echo do_shortcode('[yith_wcwl_add_to_wishlist]'); ?>
                        <?php
    else: ?>
                            <button type="button" class="w-9 h-9 border border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-200 transition-all bg-white shadow-sm text-sm">♡</button>
                        <?php
    endif; ?>
                    </div>
                </form>
            <?php else: ?>
                <?php if (filter_var($settings['enable_custom_button'] ?? false, FILTER_VALIDATE_BOOLEAN) && $product->is_in_stock()): ?>
                    <?php $custom_btn_url = (!empty($affiliates) && !empty($affiliates[0]['url'])) ? $affiliates[0]['url'] : '#s4-additional'; ?>
                    <a href="<?php echo esc_url($custom_btn_url); ?>" target="<?php echo (strpos($custom_btn_url, '#') === 0) ? '_self' : '_blank'; ?>" rel="noopener noreferrer" class="s4-sans inline-flex items-center gap-2 px-5 py-2.5 border-2 border-indigo-600 hover:bg-indigo-600 hover:text-white text-indigo-600 font-bold rounded-xl transition-all"><?php echo esc_html(rmss_get_label('custom_button', 'View Details', $labels)); ?></a>
                <?php elseif (!$product->is_in_stock()): ?>
                    <p class="s4-sans text-sm font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">Out of Stock</p>
                <?php else: ?>
                    <p class="s4-sans text-sm font-semibold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">This product is not available for purchase.</p>
                <?php endif; ?>
            <?php endif; ?>

            <!-- Look Inside Button -->
            <?php if ((!isset($settings['enable_look_inside']) || $settings['enable_look_inside']) && $look_inside_url): ?>
            <button id="rmss-look-inside-trigger" class="s4-sans mt-2 flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-colors font-semibold text-sm group w-fit"
                    data-url="<?php echo esc_url($look_inside_url); ?>"
                    data-title="<?php echo esc_attr($product->get_name()); ?>"
                    data-thumbnail="<?php echo esc_url(get_the_post_thumbnail_url($product_id, 'medium') ?: ''); ?>"
                    data-authors="<?php echo esc_attr($authors && !is_wp_error($authors) ? implode(', ', wp_list_pluck($authors, 'name')) : ''); ?>">
                <span class="p-1.5 bg-white border border-gray-200 rounded-full shadow-sm group-hover:shadow-md group-hover:border-indigo-200 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                </span>
                <?php echo esc_html(rmss_get_label('look_inside', 'Look Inside', $labels)); ?>
            </button>
            <?php endif; ?>

        </div>
    </section>

    <!-- ══ TABS ══ -->
    <section class="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
        <div class="border-b border-gray-200 flex gap-8" id="s4-tabs">
            <button class="s4-tab-btn active" data-tab="s4-description">Description</button>
            <button class="s4-tab-btn" data-tab="s4-additional">Additional Information</button>
            <?php if ($primary_author): ?>
                <button class="s4-tab-btn" data-tab="s4-author-tab">Author Info</button>
            <?php
endif; ?>
            <?php if (comments_open($product_id)): ?>
                <button class="s4-tab-btn" data-tab="s4-reviews-tab">Reviews (<?php echo absint( $product->get_review_count() ); ?>)</button>
            <?php
endif; ?>
        </div>

        <!-- Tab: Description -->
        <div id="s4-description" class="s4-tab-panel active py-10">
            <h2 class="text-2xl font-black text-gray-900 mb-5 s4-sans">About the Book</h2>
            <div class="prose prose-gray max-w-none leading-relaxed text-gray-600">
                <?php echo wp_kses_post($description ?: $short_desc); ?>
            </div>
        </div>

        <!-- Tab: Additional Information (Technical Specs) -->
        <div id="s4-additional" class="s4-tab-panel py-10">
            <div class="flex items-center gap-3 mb-8">
                <div class="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                </div>
                <h2 class="text-xl font-black text-gray-900 s4-sans">Technical Specifications</h2>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
                <?php
$specs = [];
if ($pages)
    $specs[] = ['label' => 'Pages', 'value' => $pages . ' Pages'];
if ($language)
    $specs[] = ['label' => 'Language', 'value' => $language];
if ($pub_date)
    $specs[] = ['label' => 'Published', 'value' => $pub_date];
if ($isbn || $isbn13)
    $specs[] = ['label' => 'ISBN', 'value' => $isbn13 ?: $isbn];
if ($binding)
    $specs[] = ['label' => 'Format', 'value' => $binding];
if ($dimension)
    $specs[] = ['label' => 'Dimensions', 'value' => $dimension];
if ($edition)
    $specs[] = ['label' => 'Edition', 'value' => $edition];
if ($weight)
    $specs[] = ['label' => 'Weight', 'value' => $weight];

// Fallback if nothing filled
if (empty($specs)): ?>
                    <p class="s4-sans col-span-full text-gray-400 text-sm">No technical specifications available.</p>
                <?php
else:
    foreach ($specs as $spec): ?>
                        <div>
                            <p class="s4-spec-label"><?php echo esc_html($spec['label']); ?></p>
                            <p class="s4-spec-value"><?php echo esc_html($spec['value']); ?></p>
                        </div>
                    <?php
    endforeach;
endif; ?>
            </div>

            <!-- Affiliate buttons -->
            <?php if (!empty($affiliates)): ?>
                <div class="mt-10 pt-8 border-t border-gray-100">
                    <p class="s4-sans text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Where to Buy</p>
                    <div class="flex flex-wrap gap-3">
                        <?php foreach ($affiliates as $aff): ?>
                            <a href="<?php echo esc_url($aff['url']); ?>" target="_blank" rel="noopener sponsored"
                               class="s4-sans inline-flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-900 hover:bg-gray-900 hover:text-white text-gray-700 font-bold text-sm px-5 py-2.5 rounded-full transition-all shadow-sm">
                                🛒 <?php echo esc_html($aff['name']); ?>
                            </a>
                        <?php
    endforeach; ?>
                    </div>
                </div>
            <?php
endif; ?>
        </div>

        <!-- Tab: Author Info -->
        <?php if ($primary_author): ?>
        <div id="s4-author-tab" class="s4-tab-panel py-10">
            <div class="flex items-start gap-6">
                <!-- Avatar -->
                <div class="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-2xl overflow-hidden flex-shrink-0 shadow-lg">
                    <?php if ($author_image_url): ?>
                        <img src="<?php echo esc_url($author_image_url); ?>" alt="<?php echo esc_attr($primary_author->name); ?>" class="w-full h-full object-cover" />
                    <?php
    else: ?>
                        <?php echo esc_html(strtoupper(mb_substr($primary_author->name, 0, 1))); ?>
                    <?php
    endif; ?>
                </div>

                <div class="flex-1">
                    <p class="s4-sans text-xs font-bold uppercase tracking-widest text-indigo-500 mb-1">The Author</p>
                    <h3 class="text-2xl font-black text-gray-900 mb-3 s4-sans"><?php echo esc_html($primary_author->name); ?></h3>

                    <?php if ($author_bio): ?>
                        <div class="text-gray-500 leading-relaxed mb-5"><?php echo wp_kses_post($author_bio); ?></div>
                    <?php
    elseif ($primary_author->description): ?>
                        <p class="text-gray-500 leading-relaxed mb-5"><?php echo esc_html($primary_author->description); ?></p>
                    <?php
    else: ?>
                        <p class="text-gray-400 italic mb-5">No author biography available.</p>
                    <?php
    endif; ?>

                    <div class="flex gap-3">
                        <?php if (!is_wp_error($author_link)): ?>
                            <a href="<?php echo esc_url($author_link); ?>"
                               class="s4-sans bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:bg-gray-700 transition-all shadow">
                                View All Books
                            </a>
                        <?php
    endif; ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
endif; ?>

        <!-- Tab: Reviews -->
        <?php if (comments_open($product_id)): ?>
        <div id="s4-reviews-tab" class="s4-tab-panel py-10 s4-reviews-wrap">
            <?php comments_template(); ?>
        </div>
        <?php
endif; ?>

    </section>

    <!-- ══ RELATED PRODUCTS ══ -->
    <?php
// Collect related IDs by same author → genre → publisher (priority order)
$related_ids = [];
$tax_priorities = [
    ['rmss_author', $authors && !is_wp_error($authors) ? wp_list_pluck($authors, 'term_id') : []],
    ['rmss_genre', $genres && !is_wp_error($genres) ? wp_list_pluck($genres, 'term_id') : []],
    ['rmss_publisher', $publishers && !is_wp_error($publishers) ? wp_list_pluck($publishers, 'term_id') : []],
];

foreach ($tax_priorities as [$tax, $term_ids]) {
    if (empty($term_ids) || count($related_ids) >= 8)
        break;
    $q = new WP_Query([
        'post_type' => 'product',
        'posts_per_page' => 8,
        'post_status' => 'publish',
        'post__not_in' => [$product_id],
        'fields' => 'ids',
        'tax_query' => [['taxonomy' => $tax, 'field' => 'term_id', 'terms' => $term_ids]],
    ]);
    foreach ($q->posts as $rid) {
        if (!in_array($rid, $related_ids, true)) {
            $related_ids[] = $rid;
        }
    }
}

$related_ids = array_slice($related_ids, 0, 4);

if (!empty($related_ids)):
    // "View All" link — link to first genre or author archive
    $view_all_url = (!is_wp_error($genres) && !empty($genres)) ? trsss_safe_term_link($genres[0]) :
        ((!is_wp_error($authors) && !empty($authors)) ? trsss_safe_term_link($authors[0]) : '#');
?>
    <section class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <!-- Header -->
        <div class="flex items-end justify-between mb-6">
            <h2 class="s4-sans text-2xl font-black text-gray-900">Related Products</h2>
            <?php if ($view_all_url && $view_all_url !== '#' && !is_wp_error($view_all_url)): ?>
                <a href="<?php echo esc_url($view_all_url); ?>"
                   class="s4-sans text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors">
                    View All Collection →
                </a>
            <?php
    endif; ?>
        </div>

        <!-- 4-Column Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            <?php foreach ($related_ids as $rid):
        $rp = wc_get_product($rid);
        if (!$rp)
            continue;
        $r_thumb = get_the_post_thumbnail_url($rid, 'woocommerce_thumbnail') ?: wc_placeholder_img_src();
        $r_title = $rp->get_name();
        $r_price = wp_kses_post( $rp->get_price_html() );
        $r_url = get_permalink($rid);
        $r_genre = get_the_terms($rid, 'rmss_genre');
        $r_genre_lbl = ($r_genre && !is_wp_error($r_genre)) ? $r_genre[0]->name : '';
        $r_author = get_the_terms($rid, 'rmss_author');
        $r_author_nm = ($r_author && !is_wp_error($r_author)) ? $r_author[0]->name : '';
        $r_sale = $rp->is_on_sale();
?>
            <div class="group bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col">
                <!-- Cover -->
                <a href="<?php echo esc_url($r_url); ?>" class="block overflow-hidden bg-gray-50 aspect-[3/4]">
                    <img
                        src="<?php echo esc_url($r_thumb); ?>"
                        alt="<?php echo esc_attr($r_title); ?>"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </a>

                <!-- Info -->
                <div class="p-3 flex flex-col flex-1">
                    <?php if ($r_genre_lbl): ?>
                        <p class="s4-sans text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1"><?php echo esc_html($r_genre_lbl); ?></p>
                    <?php
        endif; ?>

                    <a href="<?php echo esc_url($r_url); ?>"
                       class="s4-sans text-sm font-black text-gray-900 leading-tight line-clamp-2 hover:text-indigo-600 transition-colors mb-1 flex-1">
                        <?php echo esc_html($r_title); ?>
                    </a>

                    <?php if ($r_author_nm): ?>
                        <p class="s4-sans text-xs text-gray-400 mb-2"><?php echo esc_html($r_author_nm); ?></p>
                    <?php
        endif; ?>

                    <!-- Price + Cart -->
                    <div class="flex items-center justify-between mt-auto">
                        <span class="s4-sans text-sm font-black text-gray-900"><?php echo wp_kses_post($r_price); ?></span>
                        <?php if ($rp->is_purchasable() && $rp->is_in_stock()): ?>
                        <form method="post" action="<?php echo esc_url($r_url); ?>">
                            <button
                                type="submit"
                                name="add-to-cart"
                                value="<?php echo absint($rid); ?>"
                                class="w-8 h-8 rounded-full bg-gray-100 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all"
                                title="Add to cart"
                            >
                                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"/>
                                </svg>
                            </button>
                            <?php
                            /*
                             * Not woocommerce_after_add_to_cart_button: callbacks read global $product (main PDP item).
                             * This hook receives the related card product (WC_Product).
                             */
                            do_action( 'trsss_after_mini_add_to_cart_button', $rp );
                            ?>
                        </form>
                        <?php
        endif; ?>
                    </div>
                </div>
            </div>
            <?php
    endforeach; ?>
        </div>
    </section>
    <?php
endif; ?>

    <!-- ══ UPSELLS ══ -->
    <?php
$upsell_ids = $product->get_upsell_ids();
if (!empty($upsell_ids)):
    $upsell_products = array_filter(array_map('wc_get_product', $upsell_ids));
    if (!empty($upsell_products)):
?>
    <section class="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
        <h2 class="s4-sans text-xl font-black text-gray-900 mb-6">You May Also Like</h2>
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            <?php foreach (array_slice($upsell_products, 0, 4) as $up_product): ?>
                <a href="<?php echo esc_url(get_permalink($up_product->get_id())); ?>" class="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-gray-100 transition-all">
                    <div class="aspect-[3/4] overflow-hidden bg-gray-50">
                        <img src="<?php echo esc_url(get_the_post_thumbnail_url($up_product->get_id(), 'woocommerce_thumbnail') ?: wc_placeholder_img_src()); ?>"
                             alt="<?php echo esc_attr($up_product->get_name()); ?>"
                             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div class="p-4">
                        <p class="s4-sans font-bold text-gray-900 text-sm leading-tight line-clamp-2 mb-1"><?php echo esc_html($up_product->get_name()); ?></p>
                        <p class="s4-sans text-indigo-600 font-black text-sm"><?php echo wp_kses_post( $up_product->get_price_html() ); ?></p>
                    </div>
                </a>
            <?php
        endforeach; ?>
        </div>
    </section>
    <?php
    endif;
endif; ?>

    <!-- ══ MINIMAL FOOTER ══ -->
    <footer class="border-t border-gray-200 bg-white mt-6">
        <div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div class="flex items-center gap-2">
                <div class="w-6 h-6 bg-gray-900 rounded-md flex items-center justify-center">
                    <span class="text-white text-[9px] font-black">S</span>
                </div>
                <span class="s4-sans text-sm font-bold text-gray-700">
                    <?php bloginfo('name'); ?>
                </span>
            </div>
            <p class="s4-sans text-xs text-gray-400">
                &copy; <?php echo esc_html( gmdate( 'Y' ) ); ?> Premium Bookstore Experience &middot; Crafted for excellence.
            </p>
            <div class="flex items-center gap-4">
                <?php if (get_privacy_policy_url()): ?>
                    <a href="<?php echo esc_url(get_privacy_policy_url()); ?>" class="s4-sans text-xs text-gray-400 hover:text-gray-700 uppercase tracking-wider font-bold">Privacy</a>
                <?php
endif; ?>
                <a href="<?php echo esc_url(wc_get_page_permalink('terms')); ?>" class="s4-sans text-xs text-gray-400 hover:text-gray-700 uppercase tracking-wider font-bold">Terms</a>
            </div>
        </div>
    </footer>

</div><!-- .s4-wrap -->

<!-- ══ TAB SWITCHING SCRIPT ══ -->
<script>
document.addEventListener('DOMContentLoaded', function () {
    // ── Tab switching ──────────────────────────────────────────
    var tabs   = document.querySelectorAll('#s4-tabs .s4-tab-btn');
    var panels = document.querySelectorAll('.s4-tab-panel');

    tabs.forEach(function (btn) {
        btn.addEventListener('click', function () {
            tabs.forEach(function (t) { t.classList.remove('active'); });
            panels.forEach(function (p) { p.classList.remove('active'); });
            btn.classList.add('active');
            var target = document.getElementById(btn.dataset.tab);
            if (target) { target.classList.add('active'); }
        });
    });

    // ── Review Sort ────────────────────────────────────────────
    var sortSel = document.getElementById('s4-review-sort');
    if (sortSel) {
        sortSel.addEventListener('change', function () {
            var list  = document.getElementById('s4-reviews-list');
            if (!list) return;
            var cards = Array.from(list.querySelectorAll('.s4-review-card'));
            cards.sort(function (a, b) {
                var mode = sortSel.value;
                if (mode === 'newest')  return parseInt(b.dataset.date)  - parseInt(a.dataset.date);
                if (mode === 'oldest')  return parseInt(a.dataset.date)  - parseInt(b.dataset.date);
                if (mode === 'highest') return parseInt(b.dataset.rating) - parseInt(a.dataset.rating);
                if (mode === 'lowest')  return parseInt(a.dataset.rating) - parseInt(b.dataset.rating);
                return 0;
            });
            cards.forEach(function (c) { list.appendChild(c); });
        });
    }

    // ── Write a Review toggle ──────────────────────────────────
    var writeBtn = document.getElementById('s4-write-review-btn');
    var formWrap = document.getElementById('s4-review-form-wrap');
    if (writeBtn && formWrap) {
        writeBtn.addEventListener('click', function () {
            formWrap.classList.toggle('hidden');
            if (!formWrap.classList.contains('hidden')) {
                formWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    }

    // ── Helpful button (cosmetic) ──────────────────────────────
    document.querySelectorAll('.s4-helpful-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (btn.dataset.voted) return;
            btn.dataset.voted = '1';
            var span = btn.querySelector('.s4-helpful-count');
            if (span) {
                var cur = parseInt(span.textContent.replace(/\D/g, '')) || 0;
                span.textContent = '(' + (cur + 1) + ')';
            }
            btn.classList.add('text-indigo-600');
        });
    });
});
</script>

<?php
// Look Inside Modal — style-aware, reads pdf_reader_style from shelfsage_settings
if ((!isset($settings['enable_look_inside']) || $settings['enable_look_inside']) && $look_inside_url):
    include TRSSS_PATH . 'includes/look-inside-modal.php';
endif;
?>

<?php get_footer(); ?>
