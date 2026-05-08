<?php
/**
 * The template for displaying Author taxonomy archives.
 */

get_header(); ?>

<div class="container mx-auto px-4 py-8">
    <?php
    $term = get_queried_object();
    ?>
    <header class="mb-8 border-b pb-4">
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800"><?php echo esc_html( $term->name ); ?></h1>
        <?php if ( ! empty( $term->description ) ) : ?>
            <div class="mt-4 text-gray-600 prose">
                <?php echo wp_kses_post( wpautop( $term->description ) ); ?>
            </div>
        <?php endif; ?>
    </header>

    <?php if ( have_posts() ) : ?>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <?php while ( have_posts() ) : the_post(); 
                $product = trsss_is_woocommerce_available() ? wc_get_product( get_the_ID() ) : null;
                ?>
                <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                    <a href="<?php the_permalink(); ?>" class="block">
                        <div class="aspect-w-2 aspect-h-3 bg-gray-200">
                            <?php if ( has_post_thumbnail() ) : ?>
                                <?php the_post_thumbnail( 'woocommerce_thumbnail', array( 'class' => 'object-cover w-full h-full' ) ); ?>
                            <?php else : ?>
                                <div class="flex items-center justify-center h-full text-gray-400">
                                    <span><?php _e( 'No Image', 'shelfsage' ); ?></span>
                                </div>
                            <?php endif; ?>
                        </div>
                    </a>
                    <div class="p-4">
                        <h2 class="text-lg font-semibold text-gray-900 mb-1">
                            <a href="<?php the_permalink(); ?>" class="hover:text-blue-600">
                                <?php the_title(); ?>
                            </a>
                        </h2>
                        <div class="text-gray-600 text-sm mb-2">
                             <?php echo $product ? wp_kses_post( $product->get_price_html() ) : ''; ?>
                        </div>
                        
                        <?php 
                        // Show "Look Inside" button if preview exists
                        $preview = get_post_meta( get_the_ID(), '_rmss_book_preview', true );
                        if ( $preview ) : ?>
                             <button class="mt-2 px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition-colors w-full rmss-look-inside-trigger" data-preview="<?php echo esc_attr( $preview ); ?>" data-title="<?php the_title_attribute(); ?>">
                                <?php _e( 'Look Inside', 'shelfsage' ); ?>
                             </button>
                        <?php endif; ?>
                        
                        <?php if ( $product ) : ?>
                        <a href="?add-to-cart=<?php echo esc_attr( (string) get_the_ID() ); ?>" class="mt-2 block text-center px-4 py-2 border border-blue-500 text-blue-500 text-xs font-bold rounded hover:bg-blue-50 transition-colors w-full">
                            <?php _e( 'Add to Cart', 'woocommerce' ); ?>
                        </a>
                        <?php endif; ?>
                    </div>
                </div>
            <?php endwhile; ?>
        </div>
        
        <div class="mt-8">
            <?php
            the_posts_pagination( array(
                'mid_size'  => 2,
                'prev_text' => __( '&larr; Previous', 'shelfsage' ),
                'next_text' => __( 'Next &rarr;', 'shelfsage' ),
            ) );
            ?>
        </div>

    <?php else : ?>
        <p class="text-gray-500"><?php _e( 'No books found for this author.', 'shelfsage' ); ?></p>
    <?php endif; ?>
</div>

<!-- Simple Modal for Look Inside (Vanilla JS for the taxonomy page) -->
<div id="rmss-modal" class="fixed inset-0 z-50 hidden overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
  <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
    <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" id="rmss-modal-overlay"></div>
    <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
    <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
      <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
        <div class="sm:flex sm:items-start">
          <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Book Preview</h3>
            <div class="mt-2" id="rmss-modal-content">
              <!-- Content goes here -->
            </div>
          </div>
        </div>
      </div>
      <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
        <button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm" id="rmss-modal-close">
          Close
        </button>
      </div>
    </div>
  </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('rmss-modal');
    const closeBtn = document.getElementById('rmss-modal-close');
    const overlay = document.getElementById('rmss-modal-overlay');
    const content = document.getElementById('rmss-modal-content');
    const title = document.getElementById('modal-title');
    
    document.querySelectorAll('.rmss-look-inside-trigger').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const previewData = this.getAttribute('data-preview');
            const bookTitle = this.getAttribute('data-title');
            
            title.textContent = 'Preview: ' + bookTitle;
            content.innerHTML = '';
            
            const lines = previewData.split('\n');
            lines.forEach(line => {
                line = line.trim();
                if(line) {
                    if(line.endsWith('.pdf')) {
                         content.innerHTML += `<iframe src="${line}" class="w-full h-96 border-0"></iframe>`;
                    } else if(line.match(/\.(jpeg|jpg|gif|png)$/) != null) {
                         content.innerHTML += `<img src="${line}" class="max-w-full h-auto mb-4 mx-auto" />`;
                    } else {
                        // Fallback link
                        content.innerHTML += `<a href="${line}" target="_blank" class="text-blue-600 underline block mb-2">${line}</a>`;
                    }
                }
            });
            
            modal.classList.remove('hidden');
        });
    });
    
    const closeModal = () => modal.classList.add('hidden');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
});
</script>

<?php get_footer(); ?>
