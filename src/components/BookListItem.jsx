import React, { useState } from 'react';
import LookInsideModal from './LookInsideModal';

function getBadgeText(book) {
    if (!book) return null;
    const ribbon = (book.ribbon || book.standard_ribbon || book.badge || '').toString().trim();
    if (ribbon) return ribbon;
    const regularNum = book.regular_price != null ? Number(book.regular_price) : null;
    const saleNum = book.sale_price != null ? Number(book.sale_price) : null;
    if (regularNum != null && saleNum != null && regularNum > saleNum && regularNum > 0) {
        const pct = Math.round(((regularNum - saleNum) / regularNum) * 100);
        if (pct > 0) return pct + '% OFF';
    }
    const priceStr = (book.standard_price || book.price || '').toString();
    const oldPriceVal = parseFloat(String(book.old_price || '').replace(/[^\d.-]/g, '')) || null;
    let regular = oldPriceVal;
    let sale = null;
    if (priceStr) {
        const nums = priceStr.replace(/<[^>]+>/g, ' ').replace(/[^\d.\s]/g, ' ').split(/\s+/).map(s => parseFloat(s)).filter(n => !isNaN(n) && n > 0);
        if (nums.length >= 2) {
            regular = regular ?? Math.max(nums[0], nums[1]);
            sale = Math.min(nums[0], nums[1]);
        } else if (nums.length === 1) {
            sale = nums[0];
        }
    }
    if (regular != null && sale != null && regular > sale && regular > 0) {
        const pct = Math.round(((regular - sale) / regular) * 100);
        if (pct > 0) return pct + '% OFF';
    }
    return null;
}

const BookListItem = ({ book, settings = {} }) => {
    const [modalOpen, setModalOpen] = useState(false);

    const isPro = settings.isPro || window.rmssSettings?.isPro;
    const lookInsideEnabled = window.rmssSettings?.enable_look_inside !== false;
    const showLookInsideSetting = settings.show_look_inside !== false && settings.show_look_inside !== 'no';
    const lookInsideUrl = book.look_inside_url || '';
    const showLookInside = lookInsideEnabled && showLookInsideSetting && lookInsideUrl;
    const readerStyle = settings.pdf_reader_style || window.rmssSettings?.pdf_reader_style || 'style-1';
    const labels = settings.labels || window.rmssSettings?.labels || {};
    const lookInsideLabel = labels.look_inside || 'Look Inside';
    const showCart = settings.show_cart !== false;
    const hideAddToCart = settings.hide_add_to_cart ?? window.rmssSettings?.hide_add_to_cart ?? false;
    const addToCartLabel = labels.add_to_cart || 'Add to Cart';
    const buttonHref = book.standard_button_link || (book.permalink ? `${book.permalink}${book.permalink.includes('?') ? '&' : '?'}add-to-cart=${book.id}` : '#');
    const buttonLabel = book.standard_button_text || addToCartLabel;

    const s = {
        show_title: settings.show_title !== false,
        show_price: settings.show_price !== false,
        show_rating: settings.show_rating !== false,
        show_author_badge: settings.show_author_badge === true,
        show_summary: settings.show_summary === true,
    };

    const coverImage = book.image || book.thumbnail;
    const imgSrc = coverImage || settings.default_book_image || window.rmssSettings?.default_book_image;
    const description = book.summary || book.short_description || '';

    return (
        <>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all p-5 flex gap-6 items-stretch">
                {/* Left: image in framed block (colored frame + white inner) */}
                <div className="w-28 flex-shrink-0 bg-slate-100 rounded-xl p-2.5 flex items-center justify-center relative">
                    <div className="w-full bg-white rounded-lg overflow-hidden shadow-sm aspect-[3/4] relative">
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={book.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        {settings.show_badge && getBadgeText(book) && (() => {
                            const pos = settings.badge_position || 'top-left';
                            const posClass = pos === 'top-left' ? 'top-1 left-1' : pos === 'top-right' ? 'top-1 right-1' : pos === 'bottom-left' ? 'bottom-1 left-1' : 'bottom-1 right-1';
                            const design = settings.badge_design || 'scalloped';
                            const text = getBadgeText(book);
                            const isPercentOff = typeof text === 'string' && /%\s*OFF/i.test(text);
                            const [pct, off] = isPercentOff ? text.split(/\s+/).filter(Boolean) : [text, ''];
                            return (
                                <div className={`absolute z-10 ss-badge ss-badge-${design} ${posClass} flex flex-col items-center justify-center text-center font-bold shadow-md pointer-events-none`} style={{ backgroundColor: settings.badge_bg_color || '#dc2626', color: settings.badge_text_color || '#ffffff', fontSize: '0.6rem', minWidth: '1.75rem', minHeight: '1.75rem', padding: '0.15rem 0.25rem' }}>
                                    {off ? <><span className="ss-badge-line1 leading-tight block">{pct}</span><span className="ss-badge-line2 text-[0.65em] uppercase tracking-wider">{off}</span></> : <span className="ss-badge-single">{text}</span>}
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Right: content — left-aligned, same order as reference image */}
                <div className="flex-1 min-w-0 flex flex-col text-left">
                    {book.category && (
                        <div
                            className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1.5"
                            dangerouslySetInnerHTML={{ __html: book.category }}
                        />
                    )}
                    {s.show_title && book.title && (
                        <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight">
                            <a href={book.permalink || '#'} className="hover:text-blue-600 hover:underline transition-colors focus:outline-none">
                                {book.title}
                            </a>
                        </h3>
                    )}
                    {s.show_author_badge && (
                        <p className="text-sm text-gray-500 mb-2">
                            by {book.authors || 'Unknown Author'}
                        </p>
                    )}
                    {s.show_rating && (parseFloat(book.rating) > 0 || (book.rating_html && book.rating_html.trim())) && (
                        <div className="flex items-center gap-1 text-yellow-500 text-sm mb-2">
                            {book.rating_html ? (
                                <span dangerouslySetInnerHTML={{ __html: book.rating_html }} />
                            ) : (
                                <span>★</span>
                            )}
                            {book.review_count > 0 && (
                                <span className="text-xs text-gray-400">({book.review_count})</span>
                            )}
                        </div>
                    )}
                    {s.show_summary && description && (
                        <p className="text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">
                            {description}
                        </p>
                    )}
                    {s.show_price && book.price && (
                        <div
                            className="rmss-price text-base font-bold text-green-700 mb-4 [&_.amount]:text-green-700 [&_del]:text-gray-400 [&_del]:line-through [&_del]:font-normal [&_del_.amount]:text-gray-400"
                            dangerouslySetInnerHTML={{ __html: book.price }}
                        />
                    )}

                    <div className="flex flex-wrap items-center justify-end gap-2 mt-auto pt-1">
                        {showLookInside && (
                            <button
                                onClick={() => setModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                            >
                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                {lookInsideLabel}
                            </button>
                        )}
                        {showCart && !hideAddToCart && (
                            <a
                                href={buttonHref}
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-colors duration-150 active:scale-95 whitespace-nowrap"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                                <span>{buttonLabel}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {showLookInside && (
                <LookInsideModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    url={lookInsideUrl}
                    title={book.title}
                    readerStyle={readerStyle}
                    thumbnail={coverImage}
                    authors={book.authors}
                />
            )}
        </>
    );
};

export default BookListItem;
