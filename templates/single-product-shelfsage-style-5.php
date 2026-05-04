<?php
/**
 * ShelfSage Single Product Template — Style 5 (Detailed / Masterpiece)
 * A comprehensive, high-converting layout with detailed info in the hero section.
 */

if (!defined('ABSPATH')) {
    exit;
}

get_header();

global $product;

// Ensure we have a WC_Product object
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
$pages = get_post_meta($product_id, '_rmss_pages', true);
$language = get_post_meta($product_id, '_rmss_language', true);
$pub_date = get_post_meta($product_id, '_rmss_publication_date', true);
$edition = get_post_meta($product_id, '_rmss_edition', true);
$look_inside_url = get_post_meta($product_id, '_rmss_look_inside_url', true);

// ── Taxonomies ────────────────────────────────────────────────────────────────
$authors = get_the_terms($product_id, 'rmss_author');
$genres = get_the_terms($product_id, 'rmss_genre');
$publishers = get_the_terms($product_id, 'rmss_publisher');

$primary_author = ($authors && !is_wp_error($authors)) ? $authors[0] : null;
$author_image_id = $primary_author ? get_term_meta($primary_author->term_id, 'rmss_image_id', true) : null;
$author_image_url = $author_image_id ? wp_get_attachment_image_url($author_image_id, 'thumbnail') : null;
$author_link = trsss_safe_term_link( $primary_author );

$primary_publisher = ($publishers && !is_wp_error($publishers)) ? $publishers[0] : null;

// ── Product Data ──────────────────────────────────────────────────────────────
$title = $product->get_name();
$regular_price = $product->get_regular_price();
$sale_price = $product->get_sale_price();
$price = $product->get_price();
$is_on_sale = $product->is_on_sale();
$description = $product->get_description();
$short_desc = $product->get_short_description();
$image_id = $product->get_image_id();
$image_url = $image_id ? wp_get_attachment_image_url($image_id, 'woocommerce_single') : wc_placeholder_img_src('woocommerce_single');
$avg_rating = $product->get_average_rating();
$review_count = $product->get_review_count();

// Calculate discount percentage
$discount_percentage = 0;
if ($is_on_sale && $regular_price && $sale_price) {
    $discount_percentage = round((($regular_price - $sale_price) / $regular_price) * 100);
}

// ── Settings & Labels ────────────────────────────────────────────────────────
$settings = trsss_get_shelfsage_settings_array();
$labels = isset($settings['labels']) ? $settings['labels'] : array();
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
/* ── Style-5 Scoped Styles (Colorful Edition) ── */
.s5-wrap { font-family: 'Inter', sans-serif; color: #374151; }
.s5-serif { font-family: 'Lora', 'Georgia', serif; }
.s5-title { font-size: clamp(2rem, 4vw, 3rem); line-height: 1.1; font-weight: 700; color: #111827; }
/* Colorful gradient primary button */
.s5-btn-primary { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%); color: white; transition: all 0.25s; box-shadow: 0 4px 15px rgba(99,102,241,0.35); }
.s5-btn-primary:hover { background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #db2777 100%); transform: translateY(-2px); box-shadow: 0 6px 20px rgba(99,102,241,0.45); }
.s5-qty-input::-webkit-outer-spin-button, .s5-qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.s5-qty-input { -moz-appearance: textfield; }
/* Colorful tab indicators */
.s5-tab-btn { border-bottom: 2px solid transparent; color: #6b7280; font-weight: 600; padding-bottom: 0.75rem; transition: all 0.2s; cursor: pointer; }
.s5-tab-btn.active { border-color: #8b5cf6; color: #7c3aed; }
.s5-tab-btn:hover:not(.active) { color: #8b5cf6; }
.s5-tab-panel { display: none; animation: s5-fade 0.3s ease-in-out; }
.s5-tab-panel.active { display: block; }
@keyframes s5-fade { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
/* Qty stepper */
.s5-qty-btn { width: 2.25rem; height: 2.25rem; display: flex; align-items: center; justify-content: center; background: white; border: 1.5px solid #e5e7eb; border-radius: 0.5rem; cursor: pointer; font-size: 1.1rem; color: #6b7280; transition: all 0.2s; flex-shrink: 0; }
.s5-qty-btn:hover { border-color: #8b5cf6; color: #7c3aed; background: #f5f3ff; }
/* Hero gradient background */
.s5-hero-bg { background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 40%, #ecfdf5 100%); }
/* Colorful genre badge */
.s5-genre-badge { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; }
/* Look inside — subtle link style like Style 1 */
.s5-look-link { display: inline-flex; align-items: center; gap: 8px; color: #6b7280; font-size: 0.875rem; font-weight: 500; transition: color 0.2s; cursor: pointer; background: none; border: none; padding: 0; }
.s5-look-link:hover { color: #7c3aed; }
.s5-look-link .s5-look-icon { padding: 6px; background: white; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.12); transition: box-shadow 0.2s; }
.s5-look-link:hover .s5-look-icon { box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
</style>

<div class="s5-wrap bg-white min-h-screen pb-20">

    <!-- ══ BREADCRUMB & TOP META ══ -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-4">
        <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <a href="<?php echo esc_url( home_url() ); ?>" class="hover:text-blue-600">Home</a>
            <span class="text-gray-300">/</span>
            <a href="<?php echo esc_url( get_permalink(wc_get_page_id('shop')) ); ?>" class="hover:text-blue-600">Books</a>
            <?php if ($genres && !is_wp_error($genres)): ?>
                <span class="text-gray-300">/</span>
                <a href="<?php echo esc_url( trsss_safe_term_link($genres[0]) ); ?>" class="hover:text-blue-600"><?php echo esc_html($genres[0]->name); ?></a>
            <?php endif; ?>
            <span class="text-gray-300">/</span>
            <span class="text-gray-900 font-medium truncate max-w-xs"><?php echo esc_html($title); ?></span>
        </div>
    </div>

    <!-- ══ HERO SECTION ══ -->
    <section class="s5-hero-bg max-w-7xl mx-auto px-4 sm:px-6 py-8 rounded-3xl my-4 shadow-sm border border-purple-50">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            <!-- LEFT: Image (5 cols) -->
            <div class="lg:col-span-5">
                <div class="relative bg-white/70 rounded-2xl p-8 flex items-center justify-center border border-purple-100 shadow-lg shadow-purple-100/40">
                    <!-- Badges -->
                    <div class="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <?php if ($is_on_sale): ?>
                            <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-md uppercase tracking-wider shadow-sm">Bestseller</span>
                        <?php endif; ?>
                    </div>
                    
                    <div class="relative shadow-2xl rounded-lg overflow-hidden transform hover:scale-[1.02] transition-transform duration-500 max-w-[320px] w-full">
                        <img 
                            src="<?php echo esc_url($image_url); ?>" 
                            alt="<?php echo esc_attr($title); ?>" 
                            class="w-full h-auto object-cover"
                        />
                    </div>

                    <!-- Gallery Thumbs (if any) -->
                    <?php 
                    $attachment_ids = $product->get_gallery_image_ids();
                    if ($attachment_ids): 
                    ?>
                    <div class="absolute -bottom-6 left-0 right-0 flex justify-center gap-3 px-4">
                        <?php foreach (array_slice($attachment_ids, 0, 3) as $attachment_id): 
                            $thumb_url = wp_get_attachment_image_url($attachment_id, 'thumbnail');
                        ?>
                            <div class="w-12 h-16 rounded border-2 border-white shadow-md overflow-hidden cursor-pointer hover:border-blue-500 transition-colors bg-white">
                                <img src="<?php echo esc_url($thumb_url); ?>" class="w-full h-full object-cover">
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>

                <!-- Look Inside Button — subtle link style (like Style 1) -->
                <?php if ((!isset($settings['enable_look_inside']) || $settings['enable_look_inside']) && $look_inside_url): ?>
                <div class="mt-8 flex justify-center">
                    <button id="rmss-look-inside-trigger" class="s5-look-link"
                            data-url="<?php echo esc_url($look_inside_url); ?>"
                            data-title="<?php echo esc_attr($product->get_name()); ?>"
                            data-thumbnail="<?php echo esc_url(get_the_post_thumbnail_url($product_id, 'medium') ?: ''); ?>"
                            data-authors="<?php echo esc_attr($authors && !is_wp_error($authors) ? implode(', ', wp_list_pluck($authors, 'name')) : ''); ?>">
                        <span class="s5-look-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        </span>
                        <?php echo esc_html(rmss_get_label('look_inside', 'Look Inside', $labels)); ?>
                    </button>
                </div>
                <?php endif; ?>
            </div>

            <!-- RIGHT: Details (7 cols) -->
            <div class="lg:col-span-7 flex flex-col gap-6">
                
                <!-- Top Meta Row -->
                <div class="flex flex-wrap items-center gap-3 text-xs font-bold tracking-wide uppercase">
                    <?php if ($genres && !is_wp_error($genres)): ?>
                        <span class="s5-genre-badge px-3 py-1 rounded-full shadow-sm shadow-purple-200 text-[11px] tracking-widest">
                            <?php echo esc_html($genres[0]->name); ?>
                            <?php if(isset($genres[1])) echo ' · ' . esc_html($genres[1]->name); ?>
                        </span>
                    <?php endif; ?>
                    
                    <?php if ($primary_publisher): ?>
                        <span class="text-gray-400">|</span>
                        <span class="text-gray-500">
                            Published by <a href="<?php echo esc_url( trsss_safe_term_link($primary_publisher) ); ?>" class="text-gray-900 hover:text-blue-600 underline decoration-gray-300 underline-offset-2"><?php echo esc_html($primary_publisher->name); ?></a>
                        </span>
                    <?php endif; ?>
                </div>

                <!-- Title -->
                <h1 class="s5-title s5-serif"><?php echo esc_html($title); ?></h1>

                <!-- Author & Rating -->
                <div class="flex flex-wrap items-center gap-6 border-b border-gray-100 pb-6">
                    <?php if ($primary_author): ?>
                        <div class="flex items-center gap-3">
                            <?php if ($author_image_url): ?>
                                <img src="<?php echo esc_url($author_image_url); ?>" alt="<?php echo esc_attr($primary_author->name); ?>" class="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100">
                            <?php else: ?>
                                <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs ring-2 ring-gray-100">
                                    <?php echo strtoupper(mb_substr($primary_author->name, 0, 1)); ?>
                                </div>
                            <?php endif; ?>
                            <div>
                                <p class="text-xs text-gray-500 uppercase font-bold tracking-wider mb-0.5">Written by</p>
                                <a href="<?php echo esc_url($author_link); ?>" class="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors"><?php echo esc_html($primary_author->name); ?></a>
                            </div>
                        </div>
                    <?php endif; ?>

                    <?php if ($review_count > 0): ?>
                        <div class="h-8 w-px bg-gray-200 hidden sm:block"></div>
                        <div class="flex items-center gap-2">
                            <div class="flex text-yellow-400 text-sm">
                                <?php 
                                for($i=1; $i<=5; $i++) {
                                    echo $i <= $avg_rating ? '★' : '☆';
                                }
                                ?>
                            </div>
                            <span class="text-sm font-medium text-gray-500 underline decoration-dotted decoration-gray-300 hover:text-blue-600 cursor-pointer">
                                <?php echo absint( $review_count ); ?> Reviews
                            </span>
                        </div>
                    <?php endif; ?>
                </div>

                <!-- Description -->
                <div class="prose prose-sm text-gray-600 leading-relaxed max-w-none">
                    <?php echo wp_kses_post($short_desc); ?>
                </div>

                <!-- Basic Info Grid (Dynamic Global) -->
                <div class="bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Key Details</h4>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <?php if($language): ?>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase font-bold">Language</span>
                            <span class="text-sm font-semibold text-gray-800"><?php echo esc_html($language); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if($pages): ?>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase font-bold">Pages</span>
                            <span class="text-sm font-semibold text-gray-800"><?php echo esc_html($pages); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if($pub_date): ?>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase font-bold">Released</span>
                            <span class="text-sm font-semibold text-gray-800"><?php echo date_i18n('M Y', strtotime($pub_date)); ?></span>
                        </div>
                        <?php endif; ?>
                        <?php if($isbn): ?>
                        <div>
                            <span class="block text-[10px] text-gray-400 uppercase font-bold">ISBN</span>
                            <span class="text-sm font-semibold text-gray-800 font-mono"><?php echo esc_html($isbn); ?></span>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- Price & Cart Action -->
                <div class="bg-white rounded-xl mt-2">
                    <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                        <div class="flex items-center gap-3">
                            <span class="text-4xl font-bold text-gray-900 tracking-tight"><?php echo wp_kses_post( wc_price($price) ); ?></span>
                            <?php if($is_on_sale && $regular_price): ?>
                                <span class="text-lg text-gray-400 line-through decoration-red-400 decoration-2"><?php echo wp_kses_post( wc_price($regular_price) ); ?></span>
                                <span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-md">SAVE <?php echo esc_html($discount_percentage); ?>%</span>
                            <?php endif; ?>
                        </div>
                        <div class="flex items-center gap-2 mt-2">
                            <?php if($product->is_in_stock()): ?>
                                <span class="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                    <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> In Stock
                                </span>
                                <span class="text-xs text-gray-400">• Ready to ship</span>
                            <?php else: ?>
                                <span class="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                            <?php endif; ?>
                        </div>
                        <?php trsss_render_preorder_countdown( $product_id ); ?>
                    </div>

                    <?php $show_cart_s5 = !filter_var($settings['hide_add_to_cart'] ?? false, FILTER_VALIDATE_BOOLEAN) && $product->is_in_stock(); ?>
                    <?php if ($show_cart_s5): ?>
                    <div class="mt-5 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <form class="cart flex flex-wrap items-center gap-3" action="<?php echo esc_url(get_permalink()); ?>" method="post" enctype='multipart/form-data'>

                        <!-- Quantity Stepper -->
                        <div class="flex items-center rounded-xl border border-purple-200 bg-white shadow-sm overflow-hidden h-10 flex-shrink-0">
                            <button
                                type="button"
                                style="background:none;border:none;border-right:1px solid #e9d5ff;height:100%;width:36px;cursor:pointer;font-size:1.1rem;color:#6b7280;display:flex;align-items:center;justify-content:center;transition:background 0.15s;"
                                onmouseover="this.style.background='#f5f3ff';this.style.color='#7c3aed';"
                                onmouseout="this.style.background='none';this.style.color='#6b7280';"
                                onclick="var q=this.parentNode.querySelector('input');var v=parseInt(q.value)||1;if(v>1){q.value=v-1;}"
                                aria-label="Decrease quantity"
                            >−</button>
                            <input
                                type="number"
                                name="quantity"
                                value="1"
                                min="1"
                                style="-moz-appearance:textfield;width:36px;text-align:center;border:none;outline:none;font-weight:700;color:#111827;background:transparent;font-size:0.875rem;height:100%;"
                                oninput="this.value=Math.max(1,parseInt(this.value)||1);"
                            />
                            <button
                                type="button"
                                style="background:none;border:none;border-left:1px solid #e9d5ff;height:100%;width:36px;cursor:pointer;font-size:1.1rem;color:#6b7280;display:flex;align-items:center;justify-content:center;transition:background 0.15s;"
                                onmouseover="this.style.background='#f5f3ff';this.style.color='#7c3aed';"
                                onmouseout="this.style.background='none';this.style.color='#6b7280';"
                                onclick="var q=this.parentNode.querySelector('input');q.value=(parseInt(q.value)||1)+1;"
                                aria-label="Increase quantity"
                            >+</button>
                        </div>

                        <!-- Add to Cart — always show when in stock -->
                        <button type="submit" name="add-to-cart" value="<?php echo esc_attr($product->get_id()); ?>"
                                class="w-44 s5-btn-primary h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 flex-shrink-0 px-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            <?php echo esc_html(rmss_get_label('add_to_cart', 'Add to Cart', $labels)); ?>
                        </button>

                        <!-- Wishlist -->
                        <?php if (function_exists('YITH_WCWL')): ?>
                            <?php echo do_shortcode('[yith_wcwl_add_to_wishlist]'); ?>
                        <?php else: ?>
                            <button type="button" class="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            </button>
                        <?php endif; ?>

                        <?php do_action( 'woocommerce_after_add_to_cart_button' ); ?>

                    </form>
                    <?php if (filter_var($settings['enable_custom_button'] ?? false, FILTER_VALIDATE_BOOLEAN)): ?>
                        <?php $custom_btn_url_s5 = (!empty($affiliates) && !empty($affiliates[0]['url'])) ? $affiliates[0]['url'] : '#s5-desc'; ?>
                        <a href="<?php echo esc_url($custom_btn_url_s5); ?>" target="<?php echo (strpos($custom_btn_url_s5, '#') === 0) ? '_self' : '_blank'; ?>" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-purple-600 hover:bg-purple-600 hover:text-white text-purple-600 font-bold rounded-xl transition-all flex-shrink-0"><?php echo esc_html(rmss_get_label('custom_button', 'View Details', $labels)); ?></a>
                    <?php endif; ?>
                    </div>
                    <?php elseif (filter_var($settings['enable_custom_button'] ?? false, FILTER_VALIDATE_BOOLEAN) && $product->is_in_stock()): ?>
                        <?php $custom_btn_url = (!empty($affiliates) && !empty($affiliates[0]['url'])) ? $affiliates[0]['url'] : '#s5-desc'; ?>
                        <a href="<?php echo esc_url($custom_btn_url); ?>" target="<?php echo (strpos($custom_btn_url, '#') === 0) ? '_self' : '_blank'; ?>" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-purple-600 hover:bg-purple-600 hover:text-white text-purple-600 font-bold rounded-xl transition-all"><?php echo esc_html(rmss_get_label('custom_button', 'View Details', $labels)); ?></a>
                    <?php elseif (!$product->is_in_stock()): ?>
                        <p class="text-red-500 font-bold bg-red-50 p-3 rounded-lg text-center"><?php esc_html_e( 'Out of Stock', 'shelfsage' ); ?></p>
                    <?php endif; ?>

                </div>

                <!-- Partner Stores — colorful pill badges (Style 1 pattern) -->
                <?php if (!empty($affiliates)): ?>
                <div class="mt-4 border-t border-gray-100 pt-4">
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 border border-gray-200 rounded px-2 py-0.5 inline-block bg-gray-50">
                        <?php echo esc_html(isset($labels['also_available']) && $labels['also_available'] ? $labels['also_available'] : 'Also Available At:'); ?>
                    </p>
                    <div class="flex flex-wrap gap-2">
                        <?php
                        $s5_colors = [
                            'bg-yellow-500 text-white hover:bg-yellow-600',
                            'bg-purple-600 text-white hover:bg-purple-700',
                            'bg-pink-500 text-white hover:bg-pink-600',
                            'bg-green-500 text-white hover:bg-green-600',
                            'bg-indigo-500 text-white hover:bg-indigo-600',
                        ];
                        $s5_ci = 0;
                        foreach ($affiliates as $aff):
                            $s5_cc = $s5_colors[$s5_ci % count($s5_colors)];
                            $s5_ci++;
                        ?>
                            <a href="<?php echo esc_url($aff['url']); ?>" target="_blank" rel="noopener sponsored"
                               class="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all <?php echo esc_attr($s5_cc); ?>">
                                <?php echo esc_html($aff['name']); ?>
                            </a>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>

            </div>
        </div>
    </section>

    <!-- ══ BOTTOM TABS ══ -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 mt-8">
        <div class="border-b border-gray-200">
            <div class="flex gap-8 overflow-x-auto" id="s5-tabs">
                <button class="s5-tab-btn active" onclick="s5SwitchTab('s5-desc', this)"><?php esc_html_e( 'About the Book', 'shelfsage' ); ?></button>
                <?php if($primary_author): ?>
                    <button class="s5-tab-btn" onclick="s5SwitchTab('s5-author', this)"><?php esc_html_e( 'About the Author', 'shelfsage' ); ?></button>
                <?php endif; ?>
                <button class="s5-tab-btn" onclick="s5SwitchTab('s5-reviews', this)"><?php echo esc_html( sprintf( __( 'Customer Reviews (%d)', 'shelfsage' ), absint( $review_count ) ) ); ?></button>
                <button class="s5-tab-btn" onclick="s5SwitchTab('s5-shipping', this)"><?php esc_html_e( 'Shipping & Delivery', 'shelfsage' ); ?></button>
            </div>
        </div>

        <div class="py-10 min-h-[300px]">
            <!-- Desc Tab -->
            <div id="s5-desc" class="s5-tab-panel active">
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div class="lg:col-span-2 prose prose-lg text-gray-600">
                        <h3 class="font-serif text-2xl text-gray-900 font-bold mb-4"><?php esc_html_e( 'Synopsis', 'shelfsage' ); ?></h3>
                        <?php echo $description ? wp_kses_post($description) : wp_kses_post($short_desc); ?>
                    </div>
                    <div class="bg-gray-50 rounded-xl p-6 h-fit">
                        <h4 class="font-bold text-gray-900 mb-4"><?php esc_html_e( 'Product Details', 'shelfsage' ); ?></h4>
                        <ul class="space-y-3 text-sm text-gray-600">
                            <?php if($isbn): ?><li class="flex justify-between border-b border-gray-200 pb-2"><span>ISBN</span> <span class="font-mono text-gray-900"><?php echo esc_html($isbn); ?></span></li><?php endif; ?>
                            <?php if($edition): ?><li class="flex justify-between border-b border-gray-200 pb-2"><span>Edition</span> <span class="font-semibold text-gray-900"><?php echo esc_html($edition); ?></span></li><?php endif; ?>
                            <?php if($primary_publisher): ?><li class="flex justify-between border-b border-gray-200 pb-2"><span>Publisher</span> <span class="font-semibold text-gray-900"><?php echo esc_html($primary_publisher->name); ?></span></li><?php endif; ?>
                            <?php if($pub_date): ?><li class="flex justify-between border-b border-gray-200 pb-2"><span>Published</span> <span class="font-semibold text-gray-900"><?php echo esc_html($pub_date); ?></span></li><?php endif; ?>
                            <?php if($pages): ?><li class="flex justify-between border-b border-gray-200 pb-2"><span>Pages</span> <span class="font-semibold text-gray-900"><?php echo esc_html($pages); ?></span></li><?php endif; ?>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Author Tab -->
            <?php if($primary_author): ?>
            <div id="s5-author" class="s5-tab-panel">
                <div class="flex items-start gap-6 bg-white border border-gray-100 p-8 rounded-2xl shadow-sm max-w-3xl">
                    <?php if ($author_image_url): ?>
                        <img src="<?php echo esc_url($author_image_url); ?>" class="w-24 h-24 rounded-full object-cover ring-4 ring-gray-50">
                    <?php else: ?>
                        <div class="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-500 ring-4 ring-gray-50">
                            <?php echo strtoupper(mb_substr($primary_author->name, 0, 1)); ?>
                        </div>
                    <?php endif; ?>
                    <div>
                        <h3 class="text-xl font-bold text-gray-900 mb-2"><?php echo esc_html($primary_author->name); ?></h3>
                        <div class="prose prose-sm text-gray-600 mb-4">
                            <?php echo term_description($primary_author->term_id, 'rmss_author') ?: 'No biography available for this author.'; ?>
                        </div>
                        <a href="<?php echo esc_url($author_link); ?>" class="text-blue-600 font-bold text-sm hover:underline">View all books by <?php echo esc_html($primary_author->name); ?> →</a>
                    </div>
                </div>
            </div>
            <?php endif; ?>

            <!-- Reviews Tab -->
            <div id="s5-reviews" class="s5-tab-panel">
                <div class="max-w-4xl">
                    <?php 
                    if (comments_open() || get_comments_number()) {
                        comments_template();
                    } else {
                        echo '<p class="text-gray-500 italic">' . esc_html__( 'Reviews are closed for this book.', 'shelfsage' ) . '</p>';
                    }
                    ?>
                </div>
            </div>

            <!-- Shipping Tab (Static for now, but editable via hooks/settings ideally) -->
            <div id="s5-shipping" class="s5-tab-panel">
                <div class="prose prose-gray text-gray-600">
                    <h3 class="text-lg font-bold text-gray-900">Shipping Information</h3>
                    <p>We offer reliable shipping options for all orders.</p>
                    <ul class="list-disc pl-5 space-y-2">
                        <li><strong>Standard Delivery:</strong> 3-5 business days.</li>
                        <li><strong>Express Delivery:</strong> 1-2 business days (available at checkout).</li>
                        <li><strong>International:</strong> Available for select regions.</li>
                    </ul>
                    <p class="mt-4 text-sm text-gray-500">* Delivery times are estimates and may vary based on your location.</p>
                </div>
            </div>
        </div>
    </section>

    <!-- ══ RELATED BOOKS ══ -->
    <section class="max-w-7xl mx-auto px-4 sm:px-6 py-16 border-t border-gray-100 bg-gray-50/50">
        <h3 class="s5-serif text-3xl font-bold text-gray-900 mb-8 text-center">You May Also Like</h3>
        
        <?php
        $related_ids = wc_get_related_products($product_id, 4);
        if ($related_ids):
        ?>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <?php foreach ($related_ids as $r_id): 
                $r_product = wc_get_product($r_id);
                if (!$r_product) continue;
                $r_img = $r_product->get_image_id() ? wp_get_attachment_image_url($r_product->get_image_id(), 'woocommerce_thumbnail') : wc_placeholder_img_src();
                $r_authors = get_the_terms($r_id, 'rmss_author');
                $r_author_name = ($r_authors && !is_wp_error($r_authors)) ? $r_authors[0]->name : '';
            ?>
            <a href="<?php echo get_permalink($r_id); ?>" class="group bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
                <div class="aspect-[2/3] rounded-lg overflow-hidden mb-4 bg-gray-100 relative">
                    <img src="<?php echo esc_url($r_img); ?>" class="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500">
                    <?php if($r_product->is_on_sale()): ?>
                        <span class="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">SALE</span>
                    <?php endif; ?>
                </div>
                <h4 class="font-bold text-gray-900 leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2 text-sm"><?php echo esc_html( $r_product->get_name() ); ?></h4>
                <?php if($r_author_name): ?>
                    <p class="text-xs text-gray-500 mb-2 line-clamp-1">by <?php echo esc_html($r_author_name); ?></p>
                <?php endif; ?>
                <div class="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
                    <span class="font-bold text-gray-900 text-sm"><?php echo wp_kses_post( $r_product->get_price_html() ); ?></span>
                </div>
            </a>
            <?php endforeach; ?>
        </div>
        <?php else: ?>
            <p class="text-center text-gray-500 italic">No related books found.</p>
        <?php endif; ?>
    </section>

</div>

<script>
function s5SwitchTab(tabId, btn) {
    document.querySelectorAll('.s5-tab-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.s5-tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
}
</script>

<?php
// Look Inside Modal — style-aware, reads pdf_reader_style from shelfsage_settings
if ((!isset($settings['enable_look_inside']) || $settings['enable_look_inside']) && $look_inside_url):
    include TRSSS_PATH . 'includes/look-inside-modal.php';
endif;
?>

<?php get_footer(); ?>
