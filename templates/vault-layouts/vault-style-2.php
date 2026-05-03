<?php
/**
 * Vault Single Layout - Style 2 (Modern / Purple accent)
 * @package ShelfSagePro
 */
if (!defined('ABSPATH')) exit;
?>
<div class="rmss-wrapper w-full bg-gray-50">
    <div class="rmss-container min-h-screen pb-20 font-sans">
        <div class="max-w-7xl mx-auto px-4 py-4 text-sm text-gray-500">
            <a href="<?php echo esc_url(get_post_type_archive_link('ss_vault_assets')); ?>" class="hover:text-purple-600"><?php esc_html_e('Vault', 'shelfsage-pro'); ?></a>
            <span class="mx-1">/</span>
            <span><?php the_title(); ?></span>
        </div>
        <div class="shelfsage-single-product shelfsage-pro-layout-style-2 bg-gray-50/50 py-12 border-t-4 border-purple-500">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
                <span class="inline-block py-1 px-3 rounded bg-purple-100 text-purple-800 text-xs font-bold uppercase tracking-widest">Modern Layout</span>
            </div>
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white rounded-3xl shadow-[0_20px_50px_rgba(139,92,246,0.07)] overflow-hidden border border-gray-100">
                    <div class="flex flex-col lg:flex-row">
                        <div class="lg:w-2/5 p-8 lg:p-12 bg-gray-100 flex flex-col items-center justify-center relative">
                            <?php if ($ribbon): ?>
                                <div class="absolute top-6 left-6 z-10">
                                    <span class="bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider"><?php echo esc_html($ribbon); ?></span>
                                </div>
                            <?php endif; ?>
                            <div class="relative group">
                                <div class="w-64 md:w-80 shadow-2xl rounded-lg overflow-hidden">
                                    <?php if ($cover_url): ?>
                                        <img src="<?php echo esc_url($cover_url); ?>" alt="<?php the_title_attribute(array('echo' => false)); ?>" class="w-full h-auto object-cover" />
                                    <?php else: ?>
                                        <div class="w-full aspect-[2/3] bg-gray-300 flex items-center justify-center text-6xl">📚</div>
                                    <?php endif; ?>
                                </div>
                            </div>
                            <?php if ($look_inside_url): ?>
                                <button id="rmss-look-inside-trigger" class="mt-10 flex items-center gap-2 text-purple-600 hover:text-purple-800 transition-colors font-medium text-sm group"
                                    data-url="<?php echo esc_url($look_inside_url); ?>"
                                    data-title="<?php echo esc_attr(get_the_title()); ?>"
                                    data-thumbnail="<?php echo esc_url($cover_url ?: ''); ?>"
                                    data-authors="<?php echo esc_attr($author); ?>">
                                    <span class="p-2 bg-white rounded-full shadow-sm group-hover:shadow-md transition-shadow">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    </span>
                                    <?php echo esc_html(trsss_vault_get_label('look_inside', __('Look Inside', 'shelfsage-pro'), $labels)); ?>
                                </button>
                            <?php endif; ?>
                        </div>
                        <div class="lg:w-3/5 p-8 lg:p-12 flex flex-col">
                            <?php if ($category): ?>
                                <div class="text-sm font-semibold text-purple-600 uppercase tracking-wide mb-2"><?php echo esc_html($category); ?></div>
                            <?php endif; ?>
                            <h1 class="text-[2.25rem] leading-tight font-serif font-bold text-gray-900 mb-2"><?php the_title(); ?></h1>
                            <?php if ($author): ?>
                                <div class="inline-flex bg-purple-50 border border-purple-200 rounded-full pr-6 pl-2 py-1 mb-6 w-max">
                                    <div class="flex flex-col leading-none">
                                        <span class="text-[10px] text-purple-500 uppercase font-bold tracking-wider"><?php echo esc_html(trsss_vault_get_label('author', __('Author', 'shelfsage-pro'), $labels)); ?></span>
                                        <span class="text-sm font-bold text-gray-800"><?php echo esc_html($author); ?></span>
                                    </div>
                                </div>
                            <?php endif; ?>
                            <div class="flex flex-col mb-6 border-b border-gray-100 pb-6">
                                <?php if ($old_price || $price): ?>
                                    <div class="rmss-single-price text-gray-900 flex items-baseline gap-2">
                                        <?php if ($old_price): ?><del class="text-gray-400"><?php echo esc_html($old_price); ?></del><?php endif; ?>
                                        <?php if ($price): ?><span class="text-xl font-bold text-purple-900"><?php echo wp_kses_post($price); ?></span><?php endif; ?>
                                    </div>
                                <?php endif; ?>
                                <?php if ($rating): ?>
                                    <div class="text-amber-500 text-sm mt-1"><?php echo str_repeat('★', min(5, intval($rating))); ?></div>
                                <?php endif; ?>
                            </div>
                            <?php if ($subtitle || has_excerpt()): ?>
                                <div class="prose text-gray-600 mb-8 leading-relaxed">
                                    <?php echo $subtitle ? wp_kses_post($subtitle) : get_the_excerpt(); ?>
                                </div>
                            <?php endif; ?>
                            <div class="mt-auto">
                                <?php if ($link): ?>
                                    <a href="<?php echo esc_url($link); ?>" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-6 rounded-full shadow-lg hover:shadow-xl transition-all">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        <?php echo esc_html($button_text); ?>
                                    </a>
                                <?php endif; ?>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php if (get_the_content()): ?>
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
            <div class="bg-white rounded-2xl shadow-lg p-8 lg:p-12 border border-gray-100">
                <h2 class="text-xl font-bold text-gray-900 mb-6"><?php esc_html_e('Description', 'shelfsage-pro'); ?></h2>
                <div class="prose prose-lg text-gray-600 max-w-none">
                    <?php the_content(); ?>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>
