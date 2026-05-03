import React, { useState, useEffect } from 'react';
import axios from 'axios';
import BookCard from './BookCard';
import BookListItem from './BookListItem';
import SkeletonLoader from './SkeletonLoader';
import Masonry from 'react-masonry-css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

/** Get badge text: ribbon first, else auto discount % from regular_price/sale_price or parsed price. */
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

/** Normalize vault REST response to BookCard/BookListItem shape */
function normalizeVaultAsset(raw, labels = {}) {
    const defaultImg = getSettings().default_book_image || '';
    const viewDetails = labels.view_details || labels.custom_button || 'View Details';
    const img = raw._embedded?.['wp:featuredmedia']?.[0]?.source_url || raw.image || defaultImg;
    const permalink = raw.link || '#';
    return {
        id: raw.id,
        title: raw.title?.rendered || raw.title || 'Untitled',
        thumbnail: img,
        authors: raw.meta?._ss_vault_author || raw.author || '',
        standard_publisher: raw.meta?._ss_vault_publisher || '',
        standard_category: raw.meta?._ss_vault_category || '',
        price: raw.meta?._ss_vault_price || raw.price || '',
        old_price: raw.meta?._ss_vault_old_price || raw.old_price || '',
        ribbon: raw.meta?._ss_vault_ribbon || raw.ribbon || '',
        permalink,
        standard_button_text: viewDetails,
        standard_button_link: permalink,
        rating: parseFloat(raw.meta?._ss_vault_rating) || raw.rating || 0,
        rating_html: null,
        summary: raw.meta?._ss_vault_subtitle || raw.summary || '',
        look_inside_url: raw.meta?._ss_vault_look_inside_url || '',
    };
}

/** Helper to get global settings, handling Gutenberg iframe context */
function getSettings() {
    if (typeof window !== 'undefined' && window.rmssSettings) return window.rmssSettings;
    if (typeof window !== 'undefined' && window.parent && window.parent.rmssSettings) return window.parent.rmssSettings;
    return {};
}

const BooksShortcode = (props) => {
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const {
        mode = 'grid',
        layout = 'grid',
        design = 'design-1',
        limit = 12,
        query = 'latest',
        genre = '',
        author = '',
        publisher = '',
        category = '',
        ids = '',
        source = '',
        vault_ids = '',
        vault_author = '',
        vault_publisher = '',
        vault_category = '',
        vault_genre = '',
        col = 4,
        col_tablet = 3,
        col_mobile = 1,
        radius = 12,
        border_radius,
        gap = 24,
        img_height = 320,
        image_height = '',
        image_height_unit = '%',
        show_image = 'yes',
        image = 'yes',
        show_title = 'yes',
        title = 'yes',
        show_price = 'yes',
        price = 'yes',
        show_cart = 'yes',
        cart = 'yes',
        show_author = 'no',
        show_author_badge = 'no',
        author_badge = 'no',
        show_rating = 'no',
        rating = 'no',
        show_summary = 'no',
        summary = 'no',
        sort_by = 'date',
        sort_order = 'desc',
        alignment = 'center',
        card_alignment,
        look_inside_btn_position = '',
        look_inside_btn_width = '',
        look_inside_btn_align = '',
        show_look_inside = '',
        badge_show = 'yes',
        show_badge,
        badge_design = 'scalloped',
        badge_position = 'top-right',
        badge_bg_color = '#dc2626',
        badge_text_color = '#ffffff',
        show_ribbon_badge,
        ribbon_position = 'top-left',
        typo_ribbon,
        color_ribbon,
        ribbon_border,
        ribbon_radius,
        color_container,
        box_padding,
        shelf_hover_box_opacity,
    } = props;

    const displayMode = mode || layout;
    const rawLimit = parseInt(limit);
    const itemsLimit = rawLimit === -1 ? 100 : (rawLimit || 12);

    useEffect(() => {
        const fetchBooks = async () => {
            const settings = getSettings();
            const nonce = settings.nonce || '';
            const labels = settings.labels || {};

            if (source === 'vault') {
                try {
                    const wpRestBase = (settings.wpRestUrl || '').replace(/\/?$/, '');
                    const vaultUrl = wpRestBase ? `${wpRestBase}/ss_vault_assets` : `${window.location.origin}/wp-json/wp/v2/ss_vault_assets`;
                    const includeIds = vault_ids ? String(vault_ids).split(',').map(id => id.trim()).filter(Boolean) : [];
                    const params = new URLSearchParams();
                    params.set('per_page', '100');
                    params.set('_embed', '1');
                    if (includeIds.length > 0) params.set('include', includeIds.join(','));
                    const res = await fetch(`${vaultUrl}?${params}`, {
                        headers: { 'X-WP-Nonce': nonce }
                    });
                    if (!res.ok) throw new Error('Vault fetch failed');
                    const data = await res.json();
                    let normalized = Array.isArray(data) ? data.map(r => normalizeVaultAsset(r, labels)) : [];
                    const qAuth = (vault_author || '').trim().toLowerCase();
                    const qPub = (vault_publisher || '').trim().toLowerCase();
                    const qCat = (vault_category || '').trim().toLowerCase();
                    const qGen = (vault_genre || '').trim().toLowerCase();
                    if (qAuth || qPub || qCat || qGen) {
                        normalized = normalized.filter(b => {
                            const auth = (b.authors || '').toLowerCase();
                            const pub = (b.standard_publisher || '').toLowerCase();
                            const cat = (b.standard_category || '').toLowerCase();
                            if (qAuth && !auth.includes(qAuth)) return false;
                            if (qPub && !pub.includes(qPub)) return false;
                            if (qCat && !cat.includes(qCat)) return false;
                            if (qGen && !cat.includes(qGen)) return false;
                            return true;
                        });
                    }
                    const sb = sort_by || 'date';
                    const ord = sort_order === 'asc' ? 1 : -1;
                    normalized.sort((a, b) => {
                        if (sb === 'title') return ord * ((a.title || '').localeCompare(b.title || ''));
                        if (sb === 'modified') return 0;
                        if (sb === 'price') {
                            const pa = parseFloat(String(a.price || '0').replace(/[^\d.-]/g, '')) || 0;
                            const pb = parseFloat(String(b.price || '0').replace(/[^\d.-]/g, '')) || 0;
                            return ord * (pa - pb);
                        }
                        if (sb === 'rating') return ord * ((a.rating || 0) - (b.rating || 0));
                        if (sb === 'rand') return Math.random() - 0.5;
                        return 0;
                    });
                    normalized = normalized.slice(0, itemsLimit);
                } catch (err) {
                    console.error('Error fetching vault books:', err);
                    setBooks([]);
                } finally {
                    setIsLoading(false);
                }
                return;
            }

            const apiUrl = settings.apiUrl || '/wp-json/shelfsage/v1';
            const params = {
                limit: itemsLimit,
                query: query
            };

            if (genre) params.genre = genre;
            if (author) params.author = author;
            if (publisher) params.publisher = publisher;
            if (category) params.category = category;
            if (ids) params.include = ids;
            if (sort_by && sort_by !== 'date') params.sort_by = sort_by;
            if (sort_order && sort_order !== 'desc') params.sort_order = sort_order;

            try {
                const res = await axios.get(`${apiUrl}/search`, {
                    params,
                    headers: { 'X-WP-Nonce': nonce }
                });
                setBooks(res.data);
            } catch (err) {
                console.error('Error fetching shortcode books:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchBooks();
    }, [props]);

    if (isLoading) return <div className="p-4" style={{ minHeight: '200px', border: '1px dashed #ddd' }}>Loading books...</div>;

    if (books.length === 0) {
        return (
            <div className="p-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
                <p className="text-gray-500 font-medium italic">ShelfSage: No books found for these settings.</p>
                <code className="block mt-2 text-[10px] text-gray-400">Settings: {JSON.stringify({ query, genre, author, publisher, category, ids })}</code>
            </div>
        );
    }

    const masonryBreakpoints = {
        default: parseInt(col),
        1100: parseInt(col_tablet),
        700: parseInt(col_tablet) > 2 ? 2 : parseInt(col_tablet),
        500: parseInt(col_mobile)
    };

    const bookSettings = {
        show_image: (show_image === 'yes' || image === 'yes'),
        show_title: (show_title === 'yes' || title === 'yes'),
        show_price: (show_price === 'yes' || price === 'yes'),
        show_cart: (show_cart === 'yes' || cart === 'yes'),
        show_author_badge: (show_author === 'yes' || show_author_badge === 'yes' || author_badge === 'yes'),
        show_rating: (show_rating === 'yes' || rating === 'yes'),
        show_summary: (show_summary === 'yes' || summary === 'yes'),
        border_radius: parseInt(border_radius ?? radius, 10) || 12,
        grid_gap: parseInt(gap),
        image_height: (image_height !== undefined && image_height !== '' ? parseInt(image_height, 10) : parseInt(img_height, 10)) || 320,
        image_height_unit: (image_height_unit === '%' || image_height_unit === 'px') ? image_height_unit : '%',
        // Look Inside & labels (explicitly passed so display modes get custom labels)
        isPro: getSettings().isPro || false,
        pdf_reader_style: getSettings().pdf_reader_style || 'style-1',
        look_inside_btn_position: look_inside_btn_position || getSettings().look_inside_btn_position || 'bottom-left',
        look_inside_btn_width: look_inside_btn_width || getSettings().look_inside_btn_width || 'full',
        look_inside_btn_align: look_inside_btn_align || getSettings().look_inside_btn_align || 'center',
        show_look_inside: (show_look_inside === 'no' || show_look_inside === false) ? false : true,
        default_book_image: getSettings().default_book_image || '',
        labels: getSettings().labels || {},
        enable_custom_button: getSettings().enable_custom_button || false,
        hide_add_to_cart: getSettings().hide_add_to_cart || false,
        card_alignment: (alignment !== undefined && alignment !== '' ? alignment : card_alignment) || 'center',
        design: design || 'design-1',
        show_badge: (badge_show === 'yes' || badge_show === true) || (show_badge === 'yes' || show_badge === true),
        badge_design: badge_design || 'scalloped',
        badge_position: badge_position || 'top-right',
        badge_bg_color: badge_bg_color || '#dc2626',
        badge_text_color: badge_text_color || '#ffffff',
        show_ribbon_badge: show_ribbon_badge !== 'no' && show_ribbon_badge !== false,
        ribbon_position: ribbon_position || 'top-left',
        typo_ribbon: typo_ribbon || { font: '', size: 12, weight: '700' },
        color_ribbon: color_ribbon || { text: '#ffffff', hoverText: '#ffffff', bg: '#dc2626', hoverBg: '#b91c1c' },
        ribbon_border: ribbon_border || {},
        ribbon_radius: ribbon_radius ?? 8,
        color_container: color_container || { bg: '#ffffff' },
        box_padding: typeof box_padding === 'number' ? box_padding : (parseInt(box_padding, 10) || 16),
        shelf_hover_box_opacity: typeof shelf_hover_box_opacity === 'number' ? shelf_hover_box_opacity : (parseFloat(shelf_hover_box_opacity) || 0.96),
    };

    const renderContent = () => {
        switch (displayMode) {
            case 'masonry':
                return (
                    <Masonry
                        breakpointCols={masonryBreakpoints}
                        className="flex w-auto -ml-6"
                        columnClassName="pl-6 bg-clip-padding"
                    >
                        {books.map(book => (
                            <div key={book.id} className="mb-6">
                                <BookCard book={book} settings={bookSettings} />
                            </div>
                        ))}
                    </Masonry>
                );

            case 'list':
                return (
                    <div className="space-y-5">
                        {books.map(book => (
                            <BookListItem key={book.id} book={book} settings={bookSettings} />
                        ))}
                    </div>
                );

            case 'slider':
                return (
                    <Swiper
                        modules={[Navigation, Pagination]}
                        spaceBetween={parseInt(gap)}
                        slidesPerView={parseInt(col_mobile)}
                        navigation
                        pagination={{ clickable: true }}
                        breakpoints={{
                            640: { slidesPerView: parseInt(col_tablet) },
                            1024: { slidesPerView: parseInt(col) },
                        }}
                        className="pb-10"
                    >
                        {books.map(book => (
                            <SwiperSlide key={book.id} className="pb-8">
                                <BookCard book={book} settings={bookSettings} />
                            </SwiperSlide>
                        ))}
                    </Swiper>
                );

            case 'grid':
            default:
                const gridStyles = {
                    display: 'grid',
                    gridTemplateColumns: `repeat(${col}, minmax(0, 1fr))`,
                    gap: `${gap}px`
                };

                // Add media query equivalents in CSS if possible, but for shortcode we can use simple responsive classes if available
                // For now, let's use a dynamic className approach or inline style for simplicity in this specific component
                return (
                    <div
                        className={`grid grid-cols-${col_mobile} md:grid-cols-${col_tablet} lg:grid-cols-${col}`}
                        style={{ gap: `${gap}px` }}
                    >
                        {books.map(book => (
                            <BookCard key={book.id} book={book} settings={bookSettings} />
                        ))}
                    </div>
                );
        }
    };

    return (
        <div className="rmss-shortcode-render">
            {renderContent()}
        </div>
    );
};

export default BooksShortcode;
