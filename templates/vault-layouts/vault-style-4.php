<?php
/**
 * Vault Single Layout - Style 4 (Editorial / Literary)
 * @package ShelfSagePro
 */
if (!defined('ABSPATH')) exit;
?>
<div class="rmss-wrapper w-full bg-stone-50">
    <div class="rmss-container min-h-screen pb-20" style="font-family: Georgia, serif;">
        <div class="max-w-7xl mx-auto px-4 py-4 text-sm text-stone-500">
            <a href="<?php echo esc_url(get_post_type_archive_link('ss_vault_assets')); ?>" class="hover:text-stone-900"><?php esc_html_e('Vault', 'shelfsage-pro'); ?></a>
            <span class="mx-1">/</span>
            <span><?php the_title(); ?></span>
        </div>
        <div class="max-w-7xl mx-auto px-4 mt-6">
            <div class="bg-white shadow-md overflow-hidden border border-stone-200">
                <div class="flex flex-col lg:flex-row">
                    <div class="lg:w-2/5 p-8 lg:p-12 bg-stone-100 flex flex-col items-center justify-center relative">
                        <?php if ($ribbon): ?>
                            <div class="absolute top-6 left-6 z-10">
                                <span class="bg-stone-800 text-white text-xs font-bold px-3 py-1 uppercase tracking-widest"><?php echo esc_html($ribbon); ?></span>
                            </div>
                        <?php endif; ?>
                        <div class="relative group">
                            <div class="w-64 md:w-80 shadow-lg overflow-hidden border border-stone-300">
                                <?php if ($cover_url): ?>
                                    <img src="<?php echo esc_url($cover_url); ?>" alt="<?php the_title_attribute(array('echo' => false)); ?>" class="w-full h-auto object-cover" />
                                <?php else: ?>
                                    <div class="w-full aspect-[2/3] bg-stone-200 flex items-center justify-center text-5xl">&#128218;</div>
                                <?php endif; ?>
                            </div>
                        </div>
                        <?php if ($look_inside_url): ?>
                            <button id="rmss-look-inside-trigger" class="mt-10 text-stone-600 hover:text-stone-900 underline font-medium text-sm"
                                data-url="<?php echo esc_url($look_inside_url); ?>"
                                data-title="<?php echo esc_attr(get_the_title()); ?>"
                                data-thumbnail="<?php echo esc_url($cover_url ?: ''); ?>"
                                data-authors="<?php echo esc_attr($author); ?>">
                                <?php echo esc_html(trsss_vault_get_label('look_inside', __('Look Inside', 'shelfsage-pro'), $labels)); ?>
                            </button>
                        <?php endif; ?>
                    </div>
                    <div class="lg:w-3/5 p-8 lg:p-12 flex flex-col">
                        <?php if ($category): ?>
                            <div class="text-xs font-semibold text-stone-500 uppercase tracking-widest mb-2"><?php echo esc_html($category); ?></div>
                        <?php endif; ?>
                        <h1 class="text-[2.5rem] leading-tight font-bold text-stone-900 mb-2"><?php the_title(); ?></h1>
                        <?php if ($author): ?>
                            <div class="text-sm text-stone-600 mb-6">
                                <span class="uppercase tracking-wider text-stone-400"><?php echo esc_html(trsss_vault_get_label('author', __('Author', 'shelfsage-pro'), $labels)); ?></span>
                                <span class="font-semibold text-stone-800"><?php echo esc_html($author); ?></span>
                            </div>
                        <?php endif; ?>
                        <div class="flex flex-col mb-6 border-b border-stone-200 pb-6">
                            <?php if ($old_price || $price): ?>
                                <div class="rmss-single-price text-stone-900 flex items-baseline gap-2">
                                    <?php if ($old_price): ?><del class="text-stone-400"><?php echo esc_html($old_price); ?></del><?php endif; ?>
                                    <?php if ($price): ?><span class="text-xl font-bold text-stone-900"><?php echo wp_kses_post($price); ?></span><?php endif; ?>
                                </div>
                            <?php endif; ?>
                            <?php if ($rating): ?>
                                <div class="text-amber-600 text-sm mt-1"><?php echo str_repeat('&#9733;', min(5, intval($rating))); ?></div>
                            <?php endif; ?>
                        </div>
                        <?php if ($subtitle || has_excerpt()): ?>
                            <div class="prose prose-lg text-stone-600 mb-8 leading-relaxed max-w-none">
                                <?php echo $subtitle ? wp_kses_post($subtitle) : get_the_excerpt(); ?>
                            </div>
                        <?php endif; ?>
                        <div class="mt-auto">
                            <?php if ($link): ?>
                                <a href="<?php echo esc_url($link); ?>" target="_blank" rel="noopener noreferrer" class="inline-block bg-stone-900 hover:bg-stone-800 text-white font-bold py-3 px-8 transition-all">
                                    <?php echo esc_html($button_text); ?>
                                </a>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
            <?php if (get_the_content()): ?>
                <div class="mt-10 bg-white shadow-md p-8 lg:p-12 border border-stone-200">
                    <h2 class="text-xl font-bold text-stone-900 mb-6 uppercase tracking-wider"><?php esc_html_e('Description', 'shelfsage-pro'); ?></h2>
                    <div class="prose prose-lg text-stone-600 max-w-none">
                        <?php the_content(); ?>
                    </div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
