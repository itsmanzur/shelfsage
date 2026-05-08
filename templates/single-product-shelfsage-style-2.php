<?php
/**
 * ShelfSage Custom Single Product Template
 * Replaces default WooCommerce single product layout
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

// Enqueue Styles & Scripts (Tailwind & Animations)
// Use standard wp_enqueue_scripts hook if possible, but here we can just ensure it's loaded.
// Since we are inside the template, we can output a link tag if wp_head() already fired and missed it,
// BUT better to rely on the 'wp_enqueue_scripts' action we added in frontend.php with high priority.

// FORCE CSS Loading if for some reason enqueue failed (fallback)
echo '<link rel="stylesheet" id="rmss-app-css-forced" href="' . esc_url( TRSSS_URL . 'assets/index.css?ver=' . trsss_asset_version( 'assets/index.css' ) ) . '" media="all" />';
?>

<!-- Reading Progress Bar -->
<?php
$isbn = get_post_meta($product_id, '_rmss_isbn', true);
$isbn13 = get_post_meta($product_id, '_rmss_isbn13', true);
$asin = get_post_meta($product_id, '_rmss_asin', true);
$doi = get_post_meta($product_id, '_rmss_doi', true);
$pages = get_post_meta($product_id, '_rmss_pages', true);
$language = get_post_meta($product_id, '_rmss_language', true);
$format = get_post_meta($product_id, '_rmss_format', true);
$pub_date = get_post_meta($product_id, '_rmss_publication_date', true);
$edition = get_post_meta($product_id, '_rmss_edition', true);

$dimension = get_post_meta($product_id, '_rmss_dimension', true);
$weight = get_post_meta($product_id, '_rmss_weight', true);
$binding = get_post_meta($product_id, '_rmss_binding', true);
$age_group = get_post_meta($product_id, '_rmss_age_group', true);
$reading_level = get_post_meta($product_id, '_rmss_reading_level', true);
$awards = get_post_meta($product_id, '_rmss_book_awards', true);
$reading_time = get_post_meta($product_id, '_rmss_reading_time', true);
$accessibility = get_post_meta($product_id, '_rmss_accessibility', true);
$availability = get_post_meta($product_id, '_rmss_availability', true);
$pre_order = get_post_meta($product_id, '_rmss_pre_order', true);
$file_size = get_post_meta($product_id, '_rmss_file_size', true);
$look_inside_url = get_post_meta($product_id, '_rmss_look_inside_url', true);

// Taxonomies
$authors = get_the_terms($product_id, 'rmss_author');
$publishers = get_the_terms($product_id, 'rmss_publisher');
$genres = get_the_terms($product_id, 'rmss_genre');

// Primary Author
$primary_author = $authors && !is_wp_error($authors) ? $authors[0] : null;
$author_image_id = $primary_author ? get_term_meta($primary_author->term_id, 'rmss_image_id', true) : null;
$author_image_url = $author_image_id ? wp_get_attachment_image_url($author_image_id, 'thumbnail') : null;

// Primary Publisher
$primary_publisher = $publishers && !is_wp_error($publishers) ? $publishers[0] : null;
$publisher_image_id = $primary_publisher ? get_term_meta($primary_publisher->term_id, 'rmss_image_id', true) : null;
$publisher_image_url = $publisher_image_id ? wp_get_attachment_image_url($publisher_image_id, 'thumbnail') : null;

// Affiliate Links (Merged Global and Per-Product)
$settings = trsss_get_shelfsage_settings_array();
$labels = isset($settings['labels']) ? $settings['labels'] : array();

// Helper to get label with fallback
if (!function_exists('rmss_get_label')) {
    function rmss_get_label($key, $default, $labels)
    {
        return !empty($labels[$key]) ? $labels[$key] : $default;
    }
}

$global_affiliates = isset($settings['affiliates']) ? $settings['affiliates'] : array();
$affiliates = array();

// 1. Check Global Affiliates first
if (!empty($global_affiliates) && is_array($global_affiliates)) {
    // Loop through global definitions. 
    // We assume the per-product URLs are stored in order: _rmss_affiliate_url_1, _rmss_affiliate_url_2...
    // Or we just render the global ones if they have a URL, OR if the product has a URL for that slot.
    // The previous implementation used fixed 1-5 slots. 
    // Let's try to map them: Global Affiliate 1 -> _rmss_affiliate_url_1

    $index = 1;
    foreach ($global_affiliates as $g_aff) {
        $product_url = get_post_meta($product_id, '_rmss_affiliate_url_' . $index, true);

        // Determine URL: Product specific > Global Default
        $final_url = $product_url ? $product_url : (isset($g_aff['url']) ? $g_aff['url'] : '');

        // Determine Label: Global Label > Product Meta Label (legacy support)
        $final_label = isset($g_aff['label']) ? $g_aff['label'] : 'Buy Now';

        if ($final_url && $final_url !== '#') {
            $affiliates[] = array('name' => $final_label, 'url' => $final_url);
        }
        $index++;
    }
}
else {
    // Fallback to legacy behavior (just check meta)
    for ($i = 1; $i <= 5; $i++) {
        $name = get_post_meta($product_id, '_rmss_affiliate_name_' . $i, true);
        $url = get_post_meta($product_id, '_rmss_affiliate_url_' . $i, true);
        if ($name && $url) {
            $affiliates[] = array('name' => $name, 'url' => $url);
        }
    }
}
?>

<!-- Reading Progress Bar -->
<div id="rmss-progress-bar" class="fixed top-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600 z-50 transition-all duration-300" style="width: 0%"></div>

<!-- Main Wrapper to prevent FSE theme layout issues -->
<div class="rmss-wrapper w-full bg-gray-50">

    <div class="rmss-container min-h-screen pb-20 font-sans">
        
        <!-- Breadcrumb (Optional) -->
        <div class="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
            <?php woocommerce_breadcrumb(); ?>
        </div>
        <div class="shelfsage-single-product shelfsage-pro-layout-style-2 bg-gray-50/50 py-12 border-t-4 border-purple-500">
    <!-- Premium Brutalist Header for Style 2 -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <span class="inline-block py-1 px-3 rounded bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-widest mb-2">Modern Layout</span>
    </div>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Main Product Card - Style 2 Box Shadow -->
        <div class="bg-white rounded-3xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] overflow-hidden border border-gray-100">
                <div class="flex flex-col lg:flex-row">
                    
                    <!-- Left: Book Cover (40%) -->
                    <div class="lg:w-2/5 p-8 lg:p-12 bg-gray-100 flex flex-col items-center justify-center relative">
                        <!-- Badges -->
                        <div class="absolute top-6 left-6 flex flex-col gap-2 z-10">
                            <?php if ($product->is_on_sale()): ?>
                                <span class="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse uppercase tracking-wider">Sale</span>
                            <?php
endif; ?>
                            <?php
$date_created = $product->get_date_created();
if ($date_created && (time() - $date_created->getTimestamp()) < (30 * DAY_IN_SECONDS)):
?>
                                <span class="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">New</span>
                            <?php
endif; ?>
                        </div>

                        <!-- Book Image with Floating Animation -->
                        <div class="relative group perspective-1000">
                            <div class="w-64 md:w-80 shadow-2xl rounded-lg overflow-hidden transform transition-transform duration-500 group-hover:rotate-y-6 group-hover:scale-105 rmss-animate-float">
                                <?php echo $product->get_image('shop_single', array('class' => 'w-full h-auto object-cover')); ?>
                            </div>
                            <!-- Reflection/Shadow -->
                            <div class="absolute -bottom-8 left-0 right-0 h-8 bg-black/20 blur-xl rounded-[100%] transform scale-x-90 group-hover:scale-x-100 transition-transform duration-500"></div>
                        </div>

                        <!-- Look Inside Button (Placeholder for Modal) -->
                        <?php if ((!isset($settings['enable_look_inside']) || $settings['enable_look_inside']) && $look_inside_url): ?>
                        <button id="rmss-look-inside-trigger" class="mt-10 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm group"
                                data-url="<?php echo esc_url($look_inside_url); ?>"
                                data-title="<?php echo esc_attr($product->get_name()); ?>"
                                data-thumbnail="<?php echo esc_url(get_the_post_thumbnail_url($product_id, 'medium') ?: ''); ?>"
                                data-authors="<?php echo esc_attr($authors && !is_wp_error($authors) ? implode(', ', wp_list_pluck($authors, 'name')) : ''); ?>">
                            <span class="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                            </span>
                            <?php echo esc_html(rmss_get_label('look_inside', 'Look Inside', $labels)); ?>
                        </button>
                        <?php
endif; ?>
                    </div>

                    <!-- Right: Product Details (60%) -->
                    <div class="lg:w-3/5 p-8 lg:p-12 flex flex-col">
                        
                        <!-- Genre/Category -->
                        <div class="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-2">
                            <?php echo wp_kses_post( wc_get_product_category_list($product_id, ', ') ); ?>
                        </div>

                        <!-- Title -->
                        <h1 class="text-[1.75rem] md:text-[2rem] leading-tight font-serif font-bold text-gray-900 mb-2">
                            <?php echo esc_html( get_the_title() ); ?>
                        </h1>

                        <!-- Author Badge -->
                        <?php if ($primary_author): ?>
                            <a href="<?php echo esc_url( trsss_safe_term_link($primary_author) ); ?>" class="inline-flex items-center gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full pr-6 pl-2 py-1 mb-6 transition-all w-max group">
                                <?php if ($author_image_url): ?>
                                    <img src="<?php echo esc_url($author_image_url); ?>" alt="<?php echo esc_attr($primary_author->name); ?>" class="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm">
                                <?php
    else: ?>
                                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm border-2 border-white shadow-sm">
                                        <?php echo strtoupper(mb_substr($primary_author->name, 0, 1)); ?>
                                    </div>
                                <?php
    endif; ?>
                                <div class="flex flex-col leading-none">
                                    <span class="text-[10px] text-gray-400 uppercase font-bold tracking-wider"><?php echo esc_html(rmss_get_label('author', 'Written by', $labels)); ?></span>
                                    <span class="text-sm font-bold text-gray-800 group-hover:text-blue-600 transition-colors"><?php echo esc_html($primary_author->name); ?></span>
                                </div>
                            </a>
                        <?php
endif; ?>

                        <!-- Price & Rating -->
                        <div class="flex flex-col mb-6 border-b border-gray-100 pb-6">
                            <div class="flex items-baseline gap-3 mb-1">
                                <?php
// Parse price html to separate old/new if possible, or just style the wrapper
// WooCommerce price HTML structure is usually <del>Old</del> <ins>New</ins>
// We can use CSS to target them inside .rmss-single-price
?>
                                <div class="rmss-single-price text-gray-900 flex items-baseline gap-2">
                                    <?php echo wp_kses_post( $product->get_price_html() ); ?>
                                </div>
                            </div>
                             <?php if ($product->is_on_sale()): ?>
                                <span class="text-xs text-green-600 font-bold uppercase tracking-wide">You save money!</span>
                            <?php
endif; ?>
                            
                            <style>
                                /* Scoped Price Styles for Single Page */
                                .rmss-single-price { font-family: 'Inter', sans-serif; }
                                .rmss-single-price .amount { font-weight: 700; font-size: 1.5rem; } /* New Price Size */
                                .rmss-single-price del .amount { font-size: 1rem; color: #9ca3af; text-decoration: line-through; font-weight: 400; } /* Old Price Size */
                                .rmss-single-price ins { text-decoration: none; }
                            </style>
                            <?php trsss_render_preorder_countdown( $product_id ); ?>
                        </div>

                        <!-- Short Description -->
                        <div class="prose text-gray-600 mb-8 leading-relaxed">
                            <?php echo wp_kses_post( apply_filters('woocommerce_short_description', $post->post_excerpt) ); ?>
                        </div>

                        <!-- Conversion Zone -->
                        <div class="mt-auto">
                            <div class="flex flex-col sm:flex-row gap-4 mb-6">
                                <!-- Add to Cart & Custom Button -->
                                <div class="flex-1 flex flex-wrap gap-4">
                                    <?php $show_cart = !filter_var($settings['hide_add_to_cart'] ?? false, FILTER_VALIDATE_BOOLEAN); ?>
                                    <?php if ($product->is_in_stock() && $show_cart): ?>
                                        <form class="cart flex-1" action="<?php echo esc_url(apply_filters('woocommerce_add_to_cart_form_action', $product->get_permalink())); ?>" method="post" enctype='multipart/form-data'>
                                            <?php do_action('woocommerce_before_add_to_cart_button'); ?>
                                            <div class="flex flex-col gap-4">
                                                <div class="w-24 mb-2"><?php woocommerce_quantity_input(array('min_value' => apply_filters('woocommerce_quantity_input_min', $product->get_min_purchase_quantity(), $product), 'max_value' => apply_filters('woocommerce_quantity_input_max', $product->get_max_purchase_quantity(), $product), 'input_value' => isset($_POST['quantity']) ? wc_stock_amount(wp_unslash($_POST['quantity'])) : $product->get_min_purchase_quantity())); ?></div>
                                                <div class="flex flex-wrap gap-4">
                                                    <button type="submit" name="add-to-cart" value="<?php echo esc_attr($product->get_id()); ?>" class="flex-1 bg-gray-900 hover:bg-black text-white font-bold py-2.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all flex justify-center items-center gap-2 single_add_to_cart_button button alt text-sm">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                        <?php echo esc_html(rmss_get_label('add_to_cart', 'Add to Cart', $labels)); ?>
                                                    </button>
                                                </div>
                                            </div>
                                            <?php do_action('woocommerce_after_add_to_cart_button'); ?>
                                        </form>
                                    <?php endif; ?>
                                    <?php if (filter_var($settings['enable_custom_button'] ?? false, FILTER_VALIDATE_BOOLEAN)): ?>
                                        <?php $custom_btn_url = (!empty($affiliates) && !empty($affiliates[0]['url'])) ? $affiliates[0]['url'] : '#product-details'; ?>
                                        <a href="<?php echo esc_url($custom_btn_url); ?>" target="<?php echo (strpos($custom_btn_url, '#') === 0) ? '_self' : '_blank'; ?>" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-gray-900 hover:bg-gray-900 hover:text-white text-gray-900 font-bold rounded-full transition-all"><?php echo esc_html(rmss_get_label('custom_button', 'View Details', $labels)); ?></a>
                                    <?php endif; ?>
                                    <?php if (!$product->is_in_stock()): ?><p class="text-red-500 font-bold bg-red-50 p-3 rounded-lg text-center">Out of Stock</p><?php endif; ?>
                                </div>
                                
                                <!-- Wishlist / Share -->
                                <button class="p-2.5 border border-gray-200 rounded-full text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors h-[45px] w-[45px] flex items-center justify-center self-end mb-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                </button>
                            </div>

                            <!-- Affiliate Buttons (Random Loop Colors) -->
                            <?php if (!empty($affiliates) && (!isset($settings['enable_affiliate']) || $settings['enable_affiliate'])): ?>
                                <div class="border-t border-gray-100 pt-6">
                                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3 border border-gray-200 rounded px-2 py-0.5 inline-block bg-gray-50">
                                        <?php echo esc_html(rmss_get_label('also_available', 'ALSO AVAILABLE AT:', $labels)); ?>
                                    </p>
                                    <div class="flex flex-wrap gap-2">
                                        <?php
    $colors = [
        'bg-yellow-500 text-white hover:bg-yellow-600',
        'bg-purple-600 text-white hover:bg-purple-700',
        'bg-pink-500 text-white hover:bg-pink-600',
        'bg-green-500 text-white hover:bg-green-600',
        'bg-indigo-500 text-white hover:bg-indigo-600'
    ];
    $color_count = count($colors);
    $idx = 0;

    foreach ($affiliates as $aff):
        // Cycle through colors
        $color_class = $colors[$idx % $color_count];
        $idx++;
?>
                                            <a href="<?php echo esc_url($aff['url']); ?>" target="_blank" class="px-3 py-1.5 rounded-full text-xs font-bold shadow-sm hover:shadow-md transition-all <?php echo esc_attr( $color_class ); ?>">
                                                <?php echo esc_html($aff['name']); ?>
                                            </a>
                                        <?php
    endforeach; ?>
                                    </div>
                                </div>
                            <?php
endif; ?>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <!-- Specifications & Details (Staggered Animation) -->
        <div id="product-details" class="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left: Specs (2/3) -->
            <div class="lg:col-span-2 space-y-8">
                <!-- Specs Grid -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 rmss-animate-slide-up">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Book Specifications
                    </h3>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <?php
$specs = array(
    rmss_get_label('isbn', 'ISBN', $labels) => $isbn,
    'ISBN 13' => $isbn13,
    'ASIN' => $asin,
    'DOI' => $doi,
    rmss_get_label('pages', 'Pages', $labels) => $pages,
    'Language' => $language,
    'Format' => $format,
    'Publication Date' => $pub_date,
    rmss_get_label('edition', 'Edition', $labels) => $edition,
    'Dimension' => $dimension,
    'Weight' => $weight,
    rmss_get_label('binding', 'Binding', $labels) => $binding,
    'Age Group' => $age_group,
    'Reading Level' => $reading_level,
    'Book Awards' => $awards,
    'Reading Time' => $reading_time,
    'Accessibility' => $accessibility,
    'Availability' => $availability,
    'Pre-Order' => $pre_order,
    'File Size' => $file_size
);
$delay = 0;
foreach ($specs as $label => $value):
    if (!$value)
        continue;
    $delay += 50; // Faster stagger
?>
                            <div class="flex flex-col rmss-animate-slide-up" style="animation-delay: <?php echo absint( $delay ); ?>ms">
                                <span class="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1"><?php echo esc_html( $label ); ?></span>
                                <span class="text-gray-800 font-semibold"><?php echo esc_html($value); ?></span>
                            </div>
                        <?php
endforeach; ?>
                    </div>
                </div>

                <!-- Full Description / Content -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 rmss-animate-slide-up" style="animation-delay: 300ms">
                    <h3 class="text-xl font-bold text-gray-900 mb-6">About the Book</h3>
                    <div class="prose max-w-none text-gray-600">
                        <?php echo wp_kses_post( apply_filters('the_content', $product->get_description()) ); ?>
                    </div>
                </div>
            </div>

            <!-- Right: Sidebar Profiles (1/3) -->
            <div class="space-y-6">
                
                <!-- Author Profile Card -->
                <?php if ($primary_author): ?>
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 rmss-animate-slide-up" style="animation-delay: 400ms">
                        <div class="flex items-center gap-4 mb-4">
                            <?php if ($author_image_url): ?>
                                <img src="<?php echo esc_url($author_image_url); ?>" class="w-16 h-16 rounded-full object-cover border-2 border-gray-100" alt="">
                            <?php
    else: ?>
                                <div class="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl">
                                    <?php echo strtoupper(mb_substr($primary_author->name, 0, 1)); ?>
                                </div>
                            <?php
    endif; ?>
                            <div>
                                <h4 class="text-lg font-bold text-gray-900"><?php echo esc_html($primary_author->name); ?></h4>
                                <span class="text-xs text-blue-600 font-bold uppercase tracking-wider">Author</span>
                            </div>
                        </div>
                        <?php if (!empty($primary_author->description)): ?>
                            <p class="text-sm text-gray-500 leading-relaxed mb-4 line-clamp-4">
                                <?php echo wp_strip_all_tags($primary_author->description); ?>
                            </p>
                        <?php
    endif; ?>
                        <a href="<?php echo esc_url( trsss_safe_term_link($primary_author) ); ?>" class="block w-full text-center py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 font-bold text-sm transition-colors">
                            View Author Profile
                        </a>
                    </div>
                <?php
endif; ?>

                <!-- Publisher Profile Card -->
                <?php if ($primary_publisher): ?>
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 rmss-animate-slide-up" style="animation-delay: 500ms">
                        <div class="flex items-center gap-4 mb-4">
                            <?php if ($publisher_image_url): ?>
                                <img src="<?php echo esc_url($publisher_image_url); ?>" class="w-12 h-12 rounded object-contain border border-gray-100 p-1" alt="">
                            <?php
    else: ?>
                                <div class="w-12 h-12 rounded bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xl">
                                    <?php echo strtoupper(mb_substr($primary_publisher->name, 0, 1)); ?>
                                </div>
                            <?php
    endif; ?>
                            <div>
                                <h4 class="text-md font-bold text-gray-900"><?php echo esc_html($primary_publisher->name); ?></h4>
                                <span class="text-xs text-purple-600 font-bold uppercase tracking-wider"><?php echo esc_html(rmss_get_label('publisher', 'Publisher', $labels)); ?></span>
                            </div>
                        </div>
                        <a href="<?php echo esc_url( trsss_safe_term_link($primary_publisher) ); ?>" class="text-sm text-gray-500 hover:text-purple-600 flex items-center gap-1 transition-colors">
                            More books from this publisher &rarr;
                        </a>
                    </div>
                <?php
endif; ?>

            </div>
        </div>

        <!-- Related Books Slider Mount Point -->
        <div id="rmss-related-books" class="max-w-7xl mx-auto px-4 mt-16" data-product-id="<?php echo esc_attr((string)$product_id); ?>" data-limit="6"></div>

        <!-- Shelf Talker Mount Point -->
        <div id="rmss-shelf-talker" class="mt-8"></div>

        <!-- ================================================== -->
        <!-- Customer Reviews Section (Style 2 — Purple/Modern) -->
        <!-- ================================================== -->
        <?php if (wc_reviews_enabled() && (comments_open() || $product->get_review_count() > 0)): ?>
        <div class="max-w-7xl mx-auto px-4 mt-12 mb-4">
            <div class="bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-gray-100 p-8 rmss-animate-slide-up">
                <h2 class="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3 border-l-4 border-purple-500 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <?php esc_html_e('Customer Reviews', 'shelfsage'); ?>
                    <?php if ($product->get_review_count() > 0): ?>
                    <span class="text-sm font-normal text-purple-700 bg-purple-50 rounded-full px-3 py-1">
                        <?php echo esc_html($product->get_review_count()); ?> <?php echo esc_html(_n('review', 'reviews', $product->get_review_count(), 'shelfsage')); ?>
                    </span>
                    <?php
    endif; ?>
                </h2>
                <div class="rmss-reviews-wrap rmss-reviews-style-2">
                    <?php comments_template(); ?>
                </div>
            </div>
        </div>
        <?php
endif; ?>

        <!-- ================================================== -->
        <!-- WooCommerce Upsells (Style 2 — Purple)             -->
        <!-- ================================================== -->
        <?php
$upsell_ids = $product->get_upsell_ids();
if (!empty($upsell_ids)):
?>
        <div class="max-w-7xl mx-auto px-4 mt-8 pb-16">
            <div class="bg-white rounded-2xl shadow-[0_20px_50px_rgba(8,_112,_184,_0.07)] border border-gray-100 p-8 rmss-animate-slide-up">
                <h2 class="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3 border-l-4 border-purple-500 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    <?php esc_html_e('You May Also Like', 'shelfsage'); ?>
                </h2>
                <div class="rmss-upsells-wrap">
                    <?php woocommerce_upsell_display(4, 4); ?>
                </div>
            </div>
        </div>
        <?php
endif; ?>

    </div>
</div>

<!-- Look Inside Modal (style-aware) -->
<?php include TRSSS_PATH . 'includes/look-inside-modal.php'; ?>

<?php /* Legacy modal stub kept so old JS references do not throw errors */
add_action('wp_footer', function () use ($labels) {
?>
    <div id="rmss-look-inside-modal" style="display:none;">
        
        <!-- Modal Content Wrapper -->
        <div id="rmss-modal-content" style="position: relative; background: #fff; width: 90%; height: 90%; max-width: 1200px; border-radius: 12px; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); overflow: hidden; transform: scale(0.95); transition: transform 0.3s ease-out;">
            
            <!-- Header -->
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid #eee; background-color: #f9fafb;">
                <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: #1f2937; display: flex; align-items: center; gap: 8px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="color: #2563eb;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                    <?php echo esc_html(rmss_get_label('look_inside', 'Look Inside', $labels)); ?>: <?php echo esc_html( get_the_title() ); ?>
                </h3>
                <button id="rmss-modal-close" style="background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #6b7280; transition: color 0.2s;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <!-- Viewer Container -->
            <div style="flex: 1; position: relative; background-color: #f3f4f6; width: 100%; height: 100%; overflow: hidden;">
                <!-- Loader -->
                <div id="rmss-viewer-loading" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: white; z-index: 10;">
                    <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                </div>
                
                <!-- PDF Iframe -->
                <iframe id="rmss-pdf-frame" src="" style="width: 100%; height: 100%; border: none; display: none;" allowfullscreen></iframe>
                
                <!-- Image Viewer -->
                <img id="rmss-image-viewer" src="" alt="Book Preview" style="width: 100%; height: 100%; object-fit: contain; display: none;">
            </div>
        </div>
    </div>
    <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        #rmss-modal-close:hover { color: #ef4444; background-color: #f3f4f6; }
    </style>
    <?php
}, 99999); // Maximum priority
?>

<!-- Reading Progress Script & Modal Logic -->
<script>
window.onscroll = function() {
    var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var scrolled = (winScroll / height) * 100;
    var progressBar = document.getElementById("rmss-progress-bar");
    if(progressBar) progressBar.style.width = scrolled + "%";
};

// Modal handled by includes/look-inside-modal.php
</script>

<style>
/* Floating Animation */
@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
.rmss-animate-float { animation: float 6s ease-in-out infinite; }
.perspective-1000 { perspective: 1000px; }

/* ===== Scoped WooCommerce Review Styles — Style 2 (Purple) ===== */
.rmss-reviews-style-2 #reviews { margin: 0; padding: 0; }
.rmss-reviews-style-2 #comments h2 { font-size: 1.1rem; font-weight: 700; color: #111827; margin-bottom: 1.5rem; }
.rmss-reviews-style-2 .commentlist { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 1.25rem; }
.rmss-reviews-style-2 .commentlist li.review { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 1rem; padding: 1.25rem 1.5rem; }
.rmss-reviews-style-2 .commentlist .star-rating { color: #f59e0b; font-size: 0.9rem; margin-bottom: 0.5rem; }
.rmss-reviews-style-2 .commentlist .reviewer { font-weight: 700; color: #6b21a8; font-size: 0.95rem; }
.rmss-reviews-style-2 .commentlist time { font-size: 0.75rem; color: #9ca3af; margin-left: 0.5rem; }
.rmss-reviews-style-2 .commentlist .description p { color: #4b5563; font-size: 0.95rem; line-height: 1.6; margin-top: 0.5rem; }
.rmss-reviews-style-2 #review_form_wrapper { margin-top: 2rem; border-top: 1px solid #e9d5ff; padding-top: 2rem; }
.rmss-reviews-style-2 #reply-title { font-size: 1.1rem; font-weight: 700; color: #111827; margin-bottom: 1rem; }
.rmss-reviews-style-2 .comment-form p label { display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 0.35rem; }
.rmss-reviews-style-2 .comment-form input[type="text"],
.rmss-reviews-style-2 .comment-form input[type="email"],
.rmss-reviews-style-2 .comment-form textarea { width: 100%; padding: 0.6rem 0.9rem; border: 1px solid #d1d5db; border-radius: 0.5rem; font-size: 0.95rem; outline: none; transition: border-color 0.2s; }
.rmss-reviews-style-2 .comment-form input:focus,
.rmss-reviews-style-2 .comment-form textarea:focus { border-color: #a855f7; box-shadow: 0 0 0 3px rgba(168,85,247,0.1); }
.rmss-reviews-style-2 .comment-form #submit { background: #7c3aed; color: #fff; font-weight: 700; padding: 0.65rem 1.75rem; border-radius: 9999px; border: none; cursor: pointer; transition: background 0.2s; font-size: 0.9rem; }
.rmss-reviews-style-2 .comment-form #submit:hover { background: #6d28d9; }
.rmss-reviews-style-2 .stars span a { color: #f59e0b !important; }
/* Upsells */
.rmss-upsells-wrap .products { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; list-style: none; margin: 0; padding: 0; }
.rmss-upsells-wrap .product a { text-decoration: none; color: inherit; }
.rmss-upsells-wrap .product img { border-radius: 0.5rem; width: 100%; height: auto; }
.rmss-upsells-wrap .woocommerce-loop-product__title { font-size: 0.9rem; font-weight: 600; color: #111827; margin-top: 0.5rem; }
.rmss-upsells-wrap .price { color: #7c3aed; font-weight: 700; font-size: 0.9rem; }
</style>

<?php get_footer(); ?>
