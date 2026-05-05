<?php
/**
 * Generic Taxonomy Template for ShelfSage
 * Used for Author, Publisher, Series, etc. single term views
 */

get_header(); 

$term = get_queried_object();
$taxonomy = get_taxonomy( $term->taxonomy );
$term_meta = get_term_meta( $term->term_id );
$image_id = get_term_meta( $term->term_id, 'rmss_image_id', true ); // Assuming you save image ID
$image_url = $image_id ? wp_get_attachment_image_url( $image_id, 'full' ) : '';

// Fallback image based on taxonomy type if needed
if ( ! $image_url ) {
    // $image_url = TRSSS_URL . 'assets/images/placeholder-' . $term->taxonomy . '.png';
}
?>

<div class="rmss-container max-w-7xl mx-auto px-4 py-12">
    <!-- Header Section -->
    <?php if ( 'rmss_author' === $term->taxonomy && function_exists( 'trsss_author_profile_render_header' ) ) : ?>
        <?php trsss_author_profile_render_header( $term, $taxonomy ); ?>
    <?php else : ?>
    <div class="rmss-term-header bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12 flex flex-col md:flex-row items-center md:items-start gap-10 rmss-animate-fade-in">
        <?php if ( $image_url ) : ?>
            <div class="rmss-term-image flex-shrink-0 rmss-animate-scale-in">
                <img src="<?php echo esc_url( $image_url ); ?>" alt="<?php echo esc_attr( $term->name ); ?>" class="w-40 h-40 md:w-56 md:h-56 rounded-full object-cover shadow-lg border-4 border-white ring-1 ring-gray-100">
            </div>
        <?php else : ?>
             <div class="rmss-term-image flex-shrink-0 w-40 h-40 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-5xl font-bold shadow-lg rmss-animate-scale-in">
                <?php echo esc_html( strtoupper( mb_substr( $term->name, 0, 1 ) ) ); ?>
            </div>
        <?php endif; ?>

        <div class="rmss-term-info text-center md:text-left flex-1 rmss-animate-slide-up rmss-stagger-1">
            <span class="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                <?php echo esc_html( $taxonomy->labels->singular_name ); ?>
            </span>
            <h1 class="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight tracking-tight"><?php echo esc_html( $term->name ); ?></h1>
            <?php if ( ! empty( $term->description ) ) : ?>
                <div class="rmss-term-description text-gray-600 text-lg max-w-3xl leading-relaxed mb-6">
                    <?php echo wp_kses_post( $term->description ); ?>
                </div>
            <?php endif; ?>
            <div class="flex flex-wrap gap-4 justify-center md:justify-start">
                <div class="inline-flex items-center bg-gray-50 px-4 py-2 rounded-lg text-gray-600 font-medium">
                    <span><?php echo sprintf( _n( '%s Book', '%s Books', $term->count, 'shelfsage' ), number_format_i18n( $term->count ) ); ?></span>
                </div>
            </div>
        </div>
    </div>
    <?php endif; ?>

    <!-- Books Grid -->
    <div class="rmss-term-books rmss-animate-slide-up rmss-stagger-2">
        <h2 class="text-2xl font-bold text-gray-900 mb-8 flex items-center border-b pb-4">
            <span class="bg-blue-600 w-1.5 h-8 rounded-full mr-3 block"></span>
            Books by <?php echo esc_html( $term->name ); ?>
        </h2>

        <?php if ( have_posts() ) : ?>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-6 gap-y-10">
                <?php while ( have_posts() ) : the_post(); 
                    global $product;
                    $product = trsss_is_woocommerce_available() ? wc_get_product( get_the_ID() ) : null;
                ?>
                    <div class="rmss-book-card group bg-white rounded-xl border border-gray-100 overflow-hidden rmss-card-hover h-full flex flex-col">
                        <div class="relative aspect-[2/3] bg-gray-100 overflow-hidden">
                            <a href="<?php the_permalink(); ?>">
                                <?php
                                if ( $product ) {
                                    echo $product->get_image( 'woocommerce_thumbnail', array( 'class' => 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' ) );
                                } elseif ( has_post_thumbnail() ) {
                                    the_post_thumbnail( 'medium', array( 'class' => 'w-full h-full object-cover transition-transform duration-700 group-hover:scale-110' ) );
                                }
                                ?>
                            </a>
                            <?php if ( $product && $product->is_on_sale() ) : ?>
                                <span class="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md uppercase tracking-wide">Sale</span>
                            <?php endif; ?>
                            
                            <!-- Quick Action Overlay -->
                            <?php if ( $product ) : ?>
                            <div class="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex justify-center">
                                 <a href="<?php echo esc_url( $product->add_to_cart_url() ); ?>" data-quantity="1" class="button product_type_<?php echo esc_attr( $product->get_type() ); ?> add_to_cart_button ajax_add_to_cart bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-full text-sm font-bold shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300" data-product_id="<?php echo esc_attr( (string) $product->get_id() ); ?>" data-product_sku="<?php echo esc_attr( $product->get_sku() ); ?>" aria-label="Add to cart" rel="nofollow">
                                    Add to Cart
                                 </a>
                            </div>
                            <?php endif; ?>
                        </div>
                        
                        <div class="p-5 flex-1 flex flex-col">
                            <div class="text-xs text-blue-600 mb-2 font-semibold uppercase tracking-wide truncate">
                                <?php 
                                $genre_terms = get_the_terms( get_the_ID(), 'rmss_genre' );
                                if ( $genre_terms && ! is_wp_error( $genre_terms ) ) {
                                    echo esc_html( $genre_terms[0]->name );
                                } elseif ( $product && function_exists( 'wc_get_product_category_list' ) ) {
                                    echo wc_get_product_category_list( $product->get_id(), ', ' );
                                }
                                ?>
                            </div>
                            <h3 class="text-base font-bold text-gray-900 mb-2 leading-snug line-clamp-2">
                                <a href="<?php the_permalink(); ?>" class="hover:text-blue-600 transition-colors">
                                    <?php the_title(); ?>
                                </a>
                            </h3>
                            
                            <div class="mt-auto pt-3 flex items-end justify-between">
                                <div class="text-lg font-extrabold text-gray-900">
                                    <?php echo $product ? wp_kses_post( $product->get_price_html() ) : ''; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                <?php endwhile; ?>
            </div>

            <div class="rmss-pagination mt-12 flex justify-center">
                <?php
                echo paginate_links( array(
                    'base'      => str_replace( 999999999, '%#%', esc_url( get_pagenum_link( 999999999 ) ) ),
                    'format'    => '?paged=%#%',
                    'current'   => max( 1, get_query_var( 'paged' ) ),
                    'total'     => $wp_query->max_num_pages,
                    'prev_text' => '&larr;',
                    'next_text' => '&rarr;',
                    'type'      => 'list',
                    'end_size'  => 3,
                    'mid_size'  => 3,
                ) );
                ?>
            </div>

        <?php else : ?>
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p class="text-yellow-700">No books found for this <?php echo esc_html( strtolower( $taxonomy->labels->singular_name ) ); ?>.</p>
            </div>
        <?php endif; ?>
    </div>
</div>

<style>
/* Scoped minimal styles if Tailwind not loaded globally */
.rmss-container { font-family: 'Inter', sans-serif; }
.rmss-pagination ul { display: flex; gap: 0.5rem; list-style: none; padding: 0; }
.rmss-pagination a, .rmss-pagination span { padding: 0.5rem 1rem; border: 1px solid #e5e7eb; border-radius: 0.375rem; color: #374151; text-decoration: none; transition: all 0.2s; }
.rmss-pagination a:hover, .rmss-pagination span.current { background-color: #2563eb; color: white; border-color: #2563eb; }
</style>

<?php get_footer(); ?>
