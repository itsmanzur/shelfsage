import React, { useState, useEffect } from 'react';
import LookInsideModal from './LookInsideModal';

/** Get dominant color from image URL (for Negative Space color flood). */
function getDominantColorFromUrl(url) {
    return new Promise((resolve) => {
        if (!url || typeof document === 'undefined') { resolve('#8b7355'); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const size = 32;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve('#8b7355'); return; }
                ctx.drawImage(img, 0, 0, size, size);
                const data = ctx.getImageData(0, 0, size, size).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 128) {
                        r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
                    }
                }
                if (count === 0) { resolve('#8b7355'); return; }
                r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
                resolve('#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join(''));
            } catch (_) { resolve('#8b7355'); }
        };
        img.onerror = () => resolve('#8b7355');
        img.src = url;
    });
}

/** Badge text: ribbon first, else auto discount % from regular_price/sale_price or parsed price. */
function getBadgeText(book) {
    if (!book) return null;
    const ribbon = (book.ribbon || book.standard_ribbon || book.badge || '').toString().trim();
    if (ribbon) return ribbon;
    return getDiscountBadgeText(book);
}

/** Discount % only (from prices). So discount badge shows even when product has a ribbon. */
function getDiscountBadgeText(book) {
    if (!book) return null;
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

// ── Look Inside Button (uses .ss-look-inside-btn from global/design CSS) ──────
const LookInsideBtn = ({ onClick, label, small = false, fullWidth = false, align = 'center' }) => {
    const justifyContent = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
    return (
    <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClick(); }}
        title={label}
        className={`ss-look-inside-btn ${fullWidth ? 'w-full' : ''}`}
        style={fullWidth ? { justifyContent } : undefined}
    >
        <svg width={small ? '10' : '13'} height={small ? '10' : '13'} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {label}
    </button>
    );
};

const BookCard = ({ book, settings = {} }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [negativeSpaceColor, setNegativeSpaceColor] = useState(null);

    // Prefer large image (API returns both image + thumbnail) so frontend cover is not blurry
    const coverImage = book.image || book.thumbnail;
    // Cap cover height so fewer columns don't make the image area too tall
    const coverMaxHeight = 420;

    // ── Settings ──────────────────────────────────────────────────────────────
    const s = {
        show_image: settings.show_image !== false,
        show_title: settings.show_title !== false,
        show_price: settings.show_price !== false,
        show_cart: settings.show_cart !== false,
        show_author_badge: settings.show_author_badge === true || settings.show_author_badge === 'yes',
        show_rating: settings.show_rating === true || settings.show_rating === 'yes',
        show_summary: settings.show_summary === true,
        border_radius: settings.border_radius || 12,
        image_height: settings.image_height || 320,
        image_height_unit: settings.image_height_unit || 'px',
    };

    // ── Look Inside (Pro only) ────────────────────────────────────────────────
    const isPro = settings.isPro || window.rmssSettings?.isPro;
    const lookInsideEnabled = window.rmssSettings?.enable_look_inside !== false;
    const showLookInsideSetting = settings.show_look_inside !== false && settings.show_look_inside !== 'no';
    const lookInsideUrl = book.look_inside_url || '';
    const showLookInside = lookInsideEnabled && showLookInsideSetting && lookInsideUrl;
    const btnPosition = settings.look_inside_btn_position || window.rmssSettings?.look_inside_btn_position || 'bottom-left';
    const readerStyle = settings.pdf_reader_style || window.rmssSettings?.pdf_reader_style || 'style-1';
    const labels = settings.labels || window.rmssSettings?.labels || {};
    const lookInsideLabel = labels.look_inside || 'Look Inside';
    const alignRaw = settings.card_alignment || 'center';
    const align = (typeof alignRaw === 'string' ? alignRaw.toLowerCase().trim() : alignRaw) || 'center';
    const textAlignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
    const flexAlignClass = align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center';
    const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';

    // Position helpers
    const isTopPosition = btnPosition === 'top-left' || btnPosition === 'top-right';
    const isTopLeftOuter = btnPosition === 'top-left-outer';
    const isOverlayCenter = btnPosition === 'overlay-center';
    const isBottomLeft = btnPosition === 'bottom-left';
    const isBottomCenter = btnPosition === 'bottom-center';
    const isBottomRight = btnPosition === 'bottom-right';

    // Corner stacking: avoid badge/ribbon/look-inside overlap when same corner
    const CORNER_GAP = 44; // vertical space per slot so stacked badge/ribbon/button have visible gap
    const STACK_MARGIN = 8; // margin between stacked items; last item has no bottom margin
    const hasDiscountBadge = settings.show_badge && !!getDiscountBadgeText(book);
    const badgePos = settings.badge_position || 'top-right';
    const ribbonPos = settings.ribbon_position || 'top-left';
    const topLeftEls = [];
    if (badgePos === 'top-left' && hasDiscountBadge) topLeftEls.push('discount');
    if (ribbonPos === 'top-left' && settings.show_ribbon_badge !== false) topLeftEls.push('ribbon');
    if (btnPosition === 'top-left' && showLookInside) topLeftEls.push('look_inside'); // top-left-outer is not over image, so not in corner stack
    const topRightEls = [];
    if (badgePos === 'top-right' && hasDiscountBadge) topRightEls.push('discount');
    if (ribbonPos === 'top-right' && settings.show_ribbon_badge !== false) topRightEls.push('ribbon');
    if (btnPosition === 'top-right' && showLookInside) topRightEls.push('look_inside');
    const bottomLeftEls = [];
    if (badgePos === 'bottom-left' && hasDiscountBadge) bottomLeftEls.push('discount');
    if (ribbonPos === 'bottom-left' && settings.show_ribbon_badge !== false) bottomLeftEls.push('ribbon');
    const bottomRightEls = [];
    if (badgePos === 'bottom-right' && hasDiscountBadge) bottomRightEls.push('discount');
    if (ribbonPos === 'bottom-right' && settings.show_ribbon_badge !== false) bottomRightEls.push('ribbon');
    const cornerSlot = (pos) => {
        const arr = pos === 'top-left' ? topLeftEls : pos === 'top-right' ? topRightEls : pos === 'bottom-left' ? bottomLeftEls : bottomRightEls;
        return (key) => { const i = arr.indexOf(key); return i >= 0 ? i : 0; };
    };
    const cornerOffset = (pos, key) => cornerSlot(pos)(key) * CORNER_GAP;
    const isLastInCorner = (pos, key) => {
        const arr = pos === 'top-left' ? topLeftEls : pos === 'top-right' ? topRightEls : pos === 'bottom-left' ? bottomLeftEls : bottomRightEls;
        const i = arr.indexOf(key);
        return i >= 0 && i === arr.length - 1;
    };

    // Absolute position style for top/overlay positions (left+right so full-width button can span)
    const getAbsoluteStyle = () => {
        if (btnPosition === 'top-left') return { position: 'absolute', top: (8 + cornerOffset('top-left', 'look_inside')) + 'px', left: '8px', right: '8px', zIndex: 20 };
        if (btnPosition === 'top-right') return { position: 'absolute', top: (8 + cornerOffset('top-right', 'look_inside')) + 'px', left: '8px', right: '8px', zIndex: 20 };
        if (btnPosition === 'overlay-center') return { position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', zIndex: 20 };
        return {};
    };
    const lookInsideFullWidth = settings.look_inside_btn_width !== 'inline';
    const lookInsideAlign = settings.look_inside_btn_align || 'center';

    // Footer flex alignment (button position + card alignment for bottom row)
    const footerJustify = isBottomCenter ? 'center' : isBottomRight ? 'flex-end' : 'flex-start';
    const footerRowJustify = align === 'right' ? 'flex-end' : align === 'left' ? 'flex-start' : footerJustify;

    const is3DShelf = settings.design === 'design-3d-shelf';
    const isNegativeSpace = settings.design === 'design-negative-space';

    // Negative Space: extract dominant color from cover when design is negative-space
    useEffect(() => {
        if (!isNegativeSpace || !coverImage) return;
        getDominantColorFromUrl(coverImage).then(setNegativeSpaceColor);
    }, [isNegativeSpace, coverImage]);

    // ── 3D Shelf Perspective: books on shelf; hover = straighten, come forward, price/rating float beside ──
    if (is3DShelf) {
        const shelfCardStyle = {
            background: 'linear-gradient(180deg, #e8e4df 0%, #e0dcd6 70%, #c4b8a8 85%, #8b7355 100%)',
            borderRadius: '4px',
            boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.15)',
            transformStyle: 'preserve-3d',
        };
        const imgSrc = coverImage || s.default_book_image || window.rmssSettings?.default_book_image;
        const productUrl = book.permalink || (typeof window !== 'undefined' ? `${(window.rmssSettings?.homeUrl || window.location.origin).replace(/\/$/, '')}/?p=${book.id}` : '#');
        return (
            <>
                <a href={productUrl} className="block w-full focus:outline-none cursor-pointer" style={{ color: 'inherit', textDecoration: 'none' }}>
                <div
                    className="group relative perspective-[1400px] w-full aspect-[2/3] mx-auto overflow-visible z-0 hover:z-50"
                    style={{ ...shelfCardStyle, maxHeight: coverMaxHeight }}
                >
                    <div
                        className="absolute inset-0 w-full h-full transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] origin-left z-10 rounded-r-md border-r-2 border-white/30 shadow-[8px_4px_24px_rgba(0,0,0,0.35)] group-hover:shadow-[16px_8px_40px_rgba(0,0,0,0.4)] rotate-y-[22deg] scale-[0.92] group-hover:rotate-y-0 group-hover:scale-105 group-hover:translate-x-3 group-hover:translate-z-[20px]"
                        style={{ position: 'relative', transformStyle: 'preserve-3d' }}
                    >
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={book.title}
                                loading="lazy"
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                                style={{ boxShadow: '12px 6px 28px rgba(0,0,0,0.35)', transformStyle: 'preserve-3d' }}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">📚</div>
                        )}
                    </div>
                    {/* Hover-only floating title + price + rating — uses Designer typo/color; box grows with content */}
                    {(() => {
                        const boxBg = s.color_container?.bg || '#ffffff';
                        const opacity = typeof s.shelf_hover_box_opacity === 'number' ? s.shelf_hover_box_opacity : 0.96;
                        const hexToRgba = (hex, a) => {
                            const m = String(hex).replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
                            if (!m) return `rgba(255,255,255,${a})`;
                            return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
                        };
                        const boxStyle = {
                            backgroundColor: hexToRgba(boxBg, opacity),
                            borderRadius: `${s.border_radius ?? 8}px`,
                            padding: `${Math.max(8, (s.box_padding ?? 16) - 4)}px`,
                            minWidth: '120px',
                            minHeight: '72px',
                        };
                        return (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-max max-w-[calc(100%-0.5rem)] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 ease-out delay-75 pointer-events-none flex flex-col justify-center gap-1.5 backdrop-blur-sm shadow-xl border border-gray-200/80" style={boxStyle}>
                                {s.show_title && book.title && (
                                    <h3 className="ss-card-title leading-tight line-clamp-2 mb-0" title={book.title}>{book.title}</h3>
                                )}
                                {s.show_price && book.price && (
                                    <div className="ss-card-price rmss-price leading-tight" dangerouslySetInnerHTML={{ __html: book.price }} />
                                )}
                                {s.show_rating && (
                                    <div className="ss-card-rating text-amber-500 text-[10px] tracking-wider flex items-center gap-0.5">
                                        {book.rating_html && book.rating_html.trim() ? (
                                            <span dangerouslySetInnerHTML={{ __html: book.rating_html }} />
                                        ) : parseFloat(book.rating) > 0 ? (
                                            (() => { const r = Math.min(5, Math.max(0, parseFloat(book.rating))); return '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)); })()
                                        ) : (
                                            <span className="text-gray-300">★★★★★</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
                </a>
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
    }

    // ── Negative Space: hover = color flood from cover + title slide from left ──
    if (isNegativeSpace) {
        const imgSrc = coverImage || s.default_book_image || window.rmssSettings?.default_book_image;
        const productUrl = book.permalink || (typeof window !== 'undefined' ? `${(window.rmssSettings?.homeUrl || window.location.origin).replace(/\/$/, '')}/?p=${book.id}` : '#');
        return (
            <>
                <a href={productUrl} className="block w-full focus:outline-none cursor-pointer" style={{ color: 'inherit', textDecoration: 'none' }}>
                    <div className="group relative w-full aspect-square bg-[#f4f4f4] flex items-center justify-center overflow-hidden transition-colors duration-700">
                        <div
                            className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                            style={{ backgroundColor: negativeSpaceColor || 'transparent' }}
                            aria-hidden
                        />
                        <div className="w-[30%] aspect-[2/3] shadow-2xl z-10 transition-transform duration-700 group-hover:scale-110 group-hover:rotate-3 relative flex-shrink-0 overflow-hidden rounded-sm">
                            {imgSrc ? (
                                <img src={imgSrc} alt={book.title} loading="lazy" className="w-full h-full object-contain" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200">📚</div>
                            )}
                        </div>
                        {s.show_title && book.title && (
                            <div className="absolute left-0 bottom-4 right-0 z-20 pl-4 pr-8 overflow-hidden pointer-events-none">
                                <h3
                                    className="text-white font-bold text-sm leading-tight line-clamp-2 transform -translate-x-full group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
                                    style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                                >
                                    {book.title}
                                </h3>
                            </div>
                        )}
                    </div>
                </a>
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
    }

    return (
        <>
            <div
                className="group relative bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 flex flex-col overflow-hidden h-full"
                style={{ borderRadius: `${s.border_radius}px` }}
            >
                {/* Look Inside — Top Left Outer: above image, outside box */}
                {showLookInside && isTopLeftOuter && (
                    <div className="flex justify-start items-center mb-2 w-full px-1">
                        <LookInsideBtn onClick={() => setModalOpen(true)} label={lookInsideLabel} fullWidth={lookInsideFullWidth} align={lookInsideAlign} />
                    </div>
                )}
                {/* ── Image Section ── (100% = flex-1 fill, no gap; px = fixed height) ── */}
                {s.show_image && (
                    <div
                        className={`relative overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center ${s.image_height_unit === '%' ? 'flex-1 min-h-0' : ''}`}
                        style={s.image_height_unit === '%' ? { maxHeight: coverMaxHeight } : { height: `${s.image_height}px`, maxHeight: coverMaxHeight }}
                    >
                        {(coverImage || s.default_book_image || window.rmssSettings?.default_book_image) ? (
                            <img
                                src={coverImage || s.default_book_image || window.rmssSettings?.default_book_image}
                                alt={book.title}
                                loading="lazy"
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}

                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Discount Badge (% OFF) — independent; shows even when product has ribbon; stacked with margin, last has no bottom margin */}
                        {settings.show_badge && getDiscountBadgeText(book) && (() => {
                            const text = getDiscountBadgeText(book);
                            if (!text || typeof text !== 'string' || !/%\s*OFF/i.test(text)) return null;
                            const pos = settings.badge_position || 'top-right';
                            const posClass = pos === 'top-left' ? 'top-2 left-2' : pos === 'top-right' ? 'top-2 right-2' : pos === 'bottom-left' ? 'bottom-2 left-2' : 'bottom-2 right-2';
                            const offset = cornerOffset(pos, 'discount');
                            const posStyle = offset ? (pos === 'top-left' ? { top: (8 + offset) + 'px', left: '8px' } : pos === 'top-right' ? { top: (8 + offset) + 'px', right: '8px' } : pos === 'bottom-left' ? { bottom: (8 + offset) + 'px', left: '8px' } : { bottom: (8 + offset) + 'px', right: '8px' }) : {};
                            const marginStyle = !isLastInCorner(pos, 'discount') ? { marginBottom: STACK_MARGIN } : {};
                            const design = settings.badge_design || 'scalloped';
                            const [pct, off] = text.split(/\s+/).filter(Boolean);
                            return (
                                <div className={`absolute z-20 ss-badge ss-discount-badge ss-badge-${design} ${posClass} flex flex-col items-center justify-center text-center font-bold shadow-lg pointer-events-none`} style={{ backgroundColor: settings.badge_bg_color || '#dc2626', color: settings.badge_text_color || '#ffffff', ...posStyle, ...marginStyle }}>
                                    <span className="ss-badge-line1 leading-tight block">{pct}</span><span className="ss-badge-line2 text-[0.65em] uppercase tracking-wider">{off}</span>
                                </div>
                            );
                        })()}

                        {/* Ribbon Badge (New / Sale / custom) — independent; stacked with margin, last has no bottom margin */}
                        {settings.show_ribbon_badge !== false && (() => {
                            const text = getBadgeText(book);
                            const isDiscount = text && typeof text === 'string' && /%\s*OFF/i.test(text);
                            let ribbonText = null;
                            if (text && !isDiscount) ribbonText = text;
                            else if (book.is_new) ribbonText = 'New';
                            else if (book.is_on_sale) ribbonText = 'Sale';
                            if (!ribbonText) return null;
                            const pos = settings.ribbon_position || 'top-left';
                            const posClass = pos === 'top-left' ? 'top-2 left-2' : pos === 'top-right' ? 'top-2 right-2' : pos === 'bottom-left' ? 'bottom-2 left-2' : 'bottom-2 right-2';
                            const offset = cornerOffset(pos, 'ribbon');
                            const posStyle = offset ? (pos === 'top-left' ? { top: (8 + offset) + 'px', left: '8px' } : pos === 'top-right' ? { top: (8 + offset) + 'px', right: '8px' } : pos === 'bottom-left' ? { bottom: (8 + offset) + 'px', left: '8px' } : { bottom: (8 + offset) + 'px', right: '8px' }) : {};
                            const marginStyle = !isLastInCorner(pos, 'ribbon') ? { marginBottom: STACK_MARGIN } : {};
                            const cr = settings.color_ribbon || {};
                            const tr = settings.typo_ribbon || {};
                            const r = settings.ribbon_radius ?? 8;
                            const radius = typeof r === 'object' ? `${r.topLeft ?? 8}px ${r.topRight ?? 8}px ${r.bottomRight ?? 8}px ${r.bottomLeft ?? 8}px` : `${r}px`;
                            const rb = settings.ribbon_border || {};
                            const bw = rb.top ?? rb.width ?? 0;
                            const borderStyle = bw ? { border: `${bw}px solid ${rb.color || 'transparent'}` } : {};
                            return (
                                <div className={`absolute z-20 ss-ribbon-badge ${posClass} flex items-center justify-center font-bold shadow-lg pointer-events-none px-2 py-1 uppercase tracking-wide`} style={{ fontSize: (tr.size ?? 12) + 'px', color: cr.text || '#ffffff', backgroundColor: cr.bg || '#dc2626', borderRadius: radius, ...borderStyle, ...posStyle, ...marginStyle }}>
                                    {ribbonText}
                                </div>
                            );
                        })()}

                        {/* Look Inside — top-left (stacked with badge/ribbon when same corner); width + align */}
                        {showLookInside && btnPosition === 'top-left' && (
                            <div style={getAbsoluteStyle()}>
                                <LookInsideBtn onClick={() => setModalOpen(true)} label={lookInsideLabel} small fullWidth={lookInsideFullWidth} align={lookInsideAlign} />
                            </div>
                        )}

                        {/* Look Inside — top-right (stacked with badge/ribbon when same corner); width + align */}
                        {showLookInside && btnPosition === 'top-right' && (
                            <div style={getAbsoluteStyle()}>
                                <LookInsideBtn onClick={() => setModalOpen(true)} label={lookInsideLabel} small fullWidth={lookInsideFullWidth} align={lookInsideAlign} />
                            </div>
                        )}

                        {/* overlay-center: appears on hover; width + align */}
                        {showLookInside && isOverlayCenter && (
                            <div
                                style={{ position: 'absolute', bottom: '12px', left: '8px', right: '8px', zIndex: 20 }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                                <LookInsideBtn onClick={() => setModalOpen(true)} label={lookInsideLabel} small fullWidth={lookInsideFullWidth} align={lookInsideAlign} />
                            </div>
                        )}

                        {/* Hover overlay: View Details (always) + Look Inside only when overlay-center — pointer-events-none so badges below stay clickable */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none [&>*]:pointer-events-auto">
                            <a href={book.permalink || '#'} className="bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-white px-5 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform text-sm backdrop-blur-sm">
                                View Details
                            </a>
                        </div>
                    </div>
                )}

                {/* ── Content Section ── ss-card-content so Designer alignment CSS applies */}
                <div className={`ss-card-content p-5 flex flex-col w-full min-w-0 ${s.image_height_unit === '%' ? 'flex-shrink-0' : 'flex-1'} ${flexAlignClass} ${textAlignClass}`}>
                    {/* Genre/Category */}
                    {book.genre && (
                        <div className="mb-2">
                            <span
                                className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                                dangerouslySetInnerHTML={{ __html: book.genre }}
                            />
                        </div>
                    )}

                    {/* Title — ss-card-title so Designer typo/color apply on frontend */}
                    {s.show_title && (
                        <h3 className="ss-card-title text-lg font-bold leading-tight mb-2 line-clamp-2 transition-colors">
                            <a href={book.permalink || '#'} className="focus:outline-none hover:underline block">{book.title}</a>
                        </h3>
                    )}

                    {/* Author Badge — ss-card-author for Designer typo/color */}
                    {s.show_author_badge && book.authors && (
                        <div className="ss-card-author mb-3">by {book.authors}</div>
                    )}

                    {/* Rating — show when enabled; use rating_html or placeholder stars so frontend matches Designer */}
                    {s.show_rating && (
                        <div className="ss-card-rating flex items-center gap-1.5 mb-3 text-yellow-400 text-sm">
                            {book.rating_html && book.rating_html.trim() ? (
                                <span dangerouslySetInnerHTML={{ __html: book.rating_html }} />
                            ) : parseFloat(book.rating) > 0 ? (
                                (() => {
                                    const r = Math.min(5, Math.max(0, parseFloat(book.rating)));
                                    const full = Math.round(r);
                                    const empty = 5 - full;
                                    return (
                                        <span>
                                            {'★'.repeat(full)}{'☆'.repeat(empty)}
                                            {book.review_count > 0 && (
                                                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({book.review_count})</span>
                                            )}
                                        </span>
                                    );
                                })()
                            ) : (
                                <span className="text-gray-300">★★★★★</span>
                            )}
                        </div>
                    )}

                    {/* Summary */}
                    {s.show_summary && book.summary && (
                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3 leading-relaxed opacity-90" dangerouslySetInnerHTML={{ __html: book.summary }} />
                    )}

                    {/* ── Footer: Price, Look Inside (bottom positions), Action buttons ── */}
                    <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                        {/* Row 1: Look Inside (bottom positions) */}
                        {showLookInside && (isBottomLeft || isBottomCenter || isBottomRight) && (
                            <div className="w-full" style={{ display: 'flex', justifyContent: footerRowJustify }}>
                                <LookInsideBtn onClick={() => setModalOpen(true)} label={lookInsideLabel} fullWidth={settings.look_inside_btn_width !== 'inline'} align={settings.look_inside_btn_align || 'center'} />
                            </div>
                        )}

                        {/* Row 2: Price & cart buttons — ss-card-footer-row for Designer alignment CSS */}
                        <div className={`ss-card-footer-row flex flex-wrap items-center gap-4 w-full ${align === 'right' ? 'justify-end' : align === 'left' ? 'justify-start' : 'justify-between'}`}>
                            {/* Price */}
                            {s.show_price && (
                                <div className="ss-card-price rmss-price font-bold text-lg flex flex-wrap items-baseline gap-2" dangerouslySetInnerHTML={{ __html: book.price }} />
                            )}

                            <div className={`ss-card-actions flex gap-2 ${justifyClass}`}>
                                {/* Custom Button */}
                                {(settings.enable_custom_button ?? window.rmssSettings?.enable_custom_button) && (
                                    <a href={book.permalink || '#'} className="inline-flex items-center justify-center bg-gray-800 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap">
                                        {labels.custom_button || 'View Details'}
                                    </a>
                                )}
                                {/* Cart / Action Button — vault uses View Details link; WC uses add-to-cart */}
                                {s.show_cart && !(settings.hide_add_to_cart ?? window.rmssSettings?.hide_add_to_cart) && (
                                    <a
                                        href={(book.standard_button_link || (book.permalink ? `${book.permalink}${book.permalink.includes('?') ? '&' : '?'}add-to-cart=${book.id}` : '#'))}
                                        className="ss-cart-button inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-colors duration-150 active:scale-95 whitespace-nowrap"
                                    >
                                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                        </svg>
                                        <span>{book.standard_button_text || labels.add_to_cart || 'Add to Cart'}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Look Inside Modal ── */}
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

export default BookCard;
