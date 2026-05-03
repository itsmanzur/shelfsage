<?php
/**
 * Vault Single Layout - Classic (Original ShelfSage minimal)
 * @package ShelfSagePro
 */
if (!defined('ABSPATH')) exit;
?>
<div class="rmss-wrapper w-full bg-white">
    <div class="rmss-container min-h-screen pb-20 font-sans">
        <div class="max-w-4xl mx-auto px-4 py-6">
            <div class="text-sm text-gray-500 mb-6">
                <a href="<?php echo esc_url(get_post_type_archive_link('ss_vault_assets')); ?>" class="hover:text-blue-600"><?php esc_html_e('Vault', 'shelfsage-pro'); ?></a>
                <span class="mx-1">/</span>
                <span><?php the_title(); ?></span>
            </div>
            <div class="flex flex-col md:flex-row gap-8 md:gap-12">
                <div class="md:w-1/3 flex-shrink-0">
                    <div class="w-full max-w-[200px] mx-auto md:mx-0 shadow-md rounded">
                        <?php if ($cover_url): ?>
                            <img src="<?php echo esc_url($cover_url); ?>" alt="<?php the_title_attribute(array('echo' => false)); ?>" class="w-full h-auto object-cover rounded" />
                        <?php else: ?>
                            <div class="w-full aspect-[2/3] bg-gray-200 flex items-center justify-center text-4xl rounded">&#128218;</div>
                        <?php endif; ?>
                    </div>
                    <?php if ($look_inside_url): ?>
                        <button id="rmss-look-inside-trigger" class="mt-4 w-full text-center text-sm text-blue-600 hover:underline"
                            data-url="<?php echo esc_url($look_inside_url); ?>"
                            data-title="<?php echo esc_attr(get_the_title()); ?>"
                            data-thumbnail="<?php echo esc_url($cover_url ?: ''); ?>"
                            data-authors="<?php echo esc_attr($author); ?>">
                            <?php echo esc_html(trsss_vault_get_label('look_inside', __('Look Inside', 'shelfsage-pro'), $labels)); ?>
                        </button>
                    <?php endif; ?>
                </div>
                <div class="md:flex-1">
                    <?php if ($ribbon): ?>
                        <span class="inline-block bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded mb-2"><?php echo esc_html($ribbon); ?></span>
                    <?php endif; ?>
                    <h1 class="text-2xl font-bold text-gray-900 mb-2"><?php the_title(); ?></h1>
                    <?php if ($author): ?>
                        <p class="text-gray-600 mb-4"><strong><?php echo esc_html(trsss_vault_get_label('author', __('Author', 'shelfsage-pro'), $labels)); ?>:</strong> <?php echo esc_html($author); ?></p>
                    <?php endif; ?>
                    <?php if ($old_price || $price): ?>
                        <div class="rmss-single-price text-lg font-bold text-gray-900 mb-4">
                            <?php if ($old_price): ?><del class="text-gray-400 font-normal"><?php echo esc_html($old_price); ?></del> <?php endif; ?>
                            <?php if ($price): ?><?php echo wp_kses_post($price); ?><?php endif; ?>
                        </div>
                    <?php endif; ?>
                    <?php if ($rating): ?>
                        <div class="text-amber-500 text-sm mb-4"><?php echo str_repeat('&#9733;', min(5, intval($rating))); ?></div>
                    <?php endif; ?>
                    <?php if ($subtitle || has_excerpt()): ?>
                        <div class="prose text-gray-600 mb-6 max-w-none">
                            <?php echo $subtitle ? wp_kses_post($subtitle) : get_the_excerpt(); ?>
                        </div>
                    <?php endif; ?>
                    <?php if ($link): ?>
                        <a href="<?php echo esc_url($link); ?>" target="_blank" rel="noopener noreferrer" class="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded">
                            <?php echo esc_html($button_text); ?>
                        </a>
                    <?php endif; ?>
                </div>
            </div>
            <?php if (get_the_content()): ?>
                <div class="mt-12 pt-8 border-t border-gray-200">
                    <h2 class="text-lg font-bold text-gray-900 mb-4"><?php esc_html_e('Description', 'shelfsage-pro'); ?></h2>
                    <div class="prose text-gray-600 max-w-none">
                        <?php the_content(); ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
