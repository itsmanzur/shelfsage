=== ShelfSage ===
Contributors: itsmanzur
Tags: books, woocommerce, bookstore, authors, publishers, library, shortcode, book display
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.5.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Transform your WooCommerce store into a powerful, specialized bookstore engine. Manage authors, publishers, and book metadata with ease.

== Description ==

**ShelfSage** is the ultimate WordPress plugin for bookstores, libraries, and publishers. It extends WooCommerce to handle book-specific data and provides beautiful, responsive layouts for displaying your collection.

If you are running a bookstore or a library using WooCommerce, you know that default WooCommerce product functionality isn't enough. Books have specific metadata (ISBN, Authors, Publishers, Translators, Series, Genres) that need to be categorized and displayed gracefully. That's exactly what ShelfSage solves.

📚 [Documentation](https://shelfsage.com/docs) · 🙋 [Support](https://shelfsage.com/support)

== Why Choose ShelfSage for Your WordPress Bookstore? ==

While WooCommerce handles products well, book retail has unique needs. ShelfSage bridges the gap by offering:

* **Book-Specific Taxonomies**: Dedicated management for Authors, Publishers, Translators, Series, and Genres — not generic product categories.
* **Professional Display**: Move beyond basic product grids to create bookstore-style showcases with author badges, ratings, and metadata.
* **Zero-Code Shortcode Builder**: Visual architect with live preview. Design grids, lists, sliders, or masonry layouts without writing code.
* **Metadata Enrichment**: Connect Google Books or Amazon PA-API to auto-fill covers, descriptions, and page counts from ISBN or title.
* **SEO & Schema**: Automatic JSON-LD markup for Books, Authors, and Publishers to boost search visibility.
* **Look Inside**: Let readers preview PDF or image samples before purchase.

== What Makes ShelfSage Stand Out? ==

* **Advanced Taxonomy Management**: Manage Book Authors, Publishers, Translators, Series, and Genres with dedicated admin interfaces.
* **Visual Shortcode Architect**: Create stunning book grids, lists, and masonry layouts without writing code. Live preview included.
* **Multiple Display Designs**: Classic Card, Modern Clean, Minimalist, 3D Shelf, Slide-Out, Negative Space, Brutalist, 3D Flip.
* **Book Metadata Fields**: Add ISBN, Page Count, Language, Format, Publication Date, and Look Inside URL to products.
* **Affiliate Links**: Add multiple affiliate links (Amazon, Rokomari, etc.) to your book pages.
* **Related Books**: Automatically show related books by author, genre, or publisher.
* **RTL & i18n Ready**: Fully translatable with RTL support for Bengali and other languages.
* **Smart Fallback**: When Amazon data is incomplete, auto-fetch missing cover and description from Google Books.

== Who is ShelfSage Most Useful For? ==

* **Online Bookstores**: Sell books with proper author, publisher, and genre organization.
* **Publishers**: Showcase catalogs with rich metadata and professional layouts.
* **Libraries**: Display collections with filtering by author, genre, and publisher.
* **Author Websites**: Showcase your books with elegant grids and related titles.
* **Educational Sites**: Organize textbooks and reading lists by subject and author.
* **Book Review Blogs**: Display reviewed books with ratings and affiliate links.
* **Multilingual Book Shops**: Support translators and series with dedicated taxonomies.

== Core Features ==

* **Taxonomy Management**: Authors, Publishers, Translators, Series, Genres.
* **Shortcode Builder**: Visual architect with live preview, saved designs.
* **Display Modes**: Grid, List, Masonry, Slider.
* **Design Templates**: Classic, Modern, Minimalist, 3D Shelf, Slide-Out, Negative Space, Brutalist, 3D Flip.
* **Book Metadata**: ISBN, Pages, Language, Format, Edition, Binding, Look Inside URL.
* **JSON-LD Schema**: Automatic Book, Author, Publisher schema for SEO.
* **Google Books Integration**: Fetch metadata by ISBN or title (server-side proxy).
* **Amazon PA-API Integration**: Search by keyword or ASIN, inject affiliate links.
* **Sample Data Import**: Quick demo content for testing layouts.
* **Custom Labels**: Override Add to Cart, Look Inside, Related Books, etc.
* **Responsive Layouts**: Tailwind CSS, mobile-optimized.
* **WooCommerce Compatible**: Works with any WooCommerce theme.

== REST API ==

ShelfSage registers REST API endpoints under the namespace `shelfsage/v1`. All requests require appropriate authentication (cookie + nonce for admin endpoints; public endpoints are read-only).

**Base URL:** `https://yoursite.com/wp-json/shelfsage/v1`

=== Public Endpoints (No Auth) ===

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/search` | Search products by query, genre, author, publisher, category, sort. Used by BooksShortcode. |
| GET | `/filters` | Get filter options (authors, publishers, genres) for dropdowns. |
| GET | `/related?product_id={id}&limit={n}` | Get related books by author, genre, or publisher. |

=== Admin Endpoints (require manage_options) ===

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/settings` | Retrieve or update global plugin settings. |
| POST | `/fetch-books` | Proxy to Google Books API. Sends query + API key. Returns volume metadata. |
| POST | `/amazon-search` | Proxy to Amazon PA-API v5. Sends search params + credentials. Returns product data. |
| POST | `/create-product` | Create WooCommerce draft from Google Books ISBN metadata. |
| POST | `/clear-cache` | Clear transient cache for API responses. |
| GET/POST | `/shortcodes` | List or create saved shortcodes. |
| GET/POST/DELETE | `/shortcodes/{id}` | Get, update, or delete a saved shortcode. |
| GET | `/products` | List products for Shortcode Architect (requires edit_posts). |
| GET | `/taxonomies/{taxonomy}` | List taxonomy terms (requires edit_posts). |
| POST | `/onboarding/settings` | Save onboarding wizard settings. |
| POST | `/onboarding/demo-content` | Import demo book content. |
| POST | `/update-stock` | Update product/vault stock status. |

**Authentication:** Admin endpoints expect `X-WP-Nonce` in the request header. The nonce is provided via `wp_localize_script` as `rmssAdminSettings.nonce`.

**Example (fetch books):**
`
POST /wp-json/shelfsage/v1/fetch-books
Headers: Content-Type: application/json, X-WP-Nonce: {nonce}
Body: { "query": "isbn:9780141036144", "max_results": 1 }
`

== External Services ==

This plugin connects to the following external services. Each service is only contacted when the corresponding feature is used or configured. No personal visitor data is transmitted beyond what is described below.

= Google Books API =
* **Used for:** ISBN/title lookup, cover image and description auto-fill, smart fallback when Amazon data is incomplete.
* **When:** An admin clicks "Fetch from Google Books" in the product editor, runs an ISBN/keyword import, or visits a Shortcode Architect preview using the Google Books data source.
* **Data sent:** Search query (ISBN, title, or keyword) and your configured Google Books API key, sent server-side from your WordPress installation via `wp_remote_get` to `https://www.googleapis.com/books/v1/`.
* **Privacy policy:** https://policies.google.com/privacy
* **Terms of service:** https://developers.google.com/terms

= Amazon Product Advertising API (PA-API v5) =
* **Used for:** Book search by keyword/ASIN, cover and pricing data, and affiliate (Associate Tag) injection.
* **When:** An admin uses the "Amazon Search" feature in the Shortcode Architect or product editor, or a saved shortcode uses the Amazon data source.
* **Data sent:** Search query and your AWS Access Key, Secret Key, Associate Tag, and host/region (signed PA-API v5 request) sent server-side from your WordPress installation to `https://webservices.amazon.com/paapi5/`.
* **Privacy policy:** https://www.amazon.com/gp/help/customer/display.html?nodeId=468496
* **Terms of service:** https://webservices.amazon.com/paapi5/documentation/

= Google Fonts =
* **Used for:** Admin UI typography (Inter and Lora) and optional book-display fonts on the public single-product layout.
* **When:** Any ShelfSage admin page is loaded, and on single product pages when an alternate book font is selected in Settings → Appearance.
* **Data sent:** Visitor IP address, browser User-Agent, and the requested font URL are sent by the visitor's browser to `https://fonts.googleapis.com/` and `https://fonts.gstatic.com/`.
* **Privacy policy:** https://policies.google.com/privacy
* **Terms of service:** https://developers.google.com/fonts/faq

= Facebook, X (Twitter), WhatsApp Share Links =
* **Used for:** Social share buttons on single product (book) pages.
* **When:** A visitor *clicks* a share button. The plugin only renders the share URLs; no request is made until the visitor opts in by clicking.
* **Data sent:** Only the public book URL and book title are passed in the share URL to `https://www.facebook.com/sharer/`, `https://twitter.com/intent/tweet`, or `https://wa.me/`. No tracking pixels or scripts are loaded from these services.
* **Privacy policy (Facebook):** https://www.facebook.com/policy.php
* **Privacy policy (X/Twitter):** https://x.com/en/privacy
* **Privacy policy (WhatsApp):** https://www.whatsapp.com/legal/privacy-policy

**Where credentials are stored:** All API keys are stored server-side in the WordPress `wp_options` table (`shelfsage_settings`). They are used only in server-to-server requests via `wp_remote_get` / `wp_remote_post` and are never exposed to the frontend or to non-admin users.

== General Settings ==

Go to **ShelfSage → Settings** to configure:

* **General**: Default layout, single product template, default book image.
* **Appearance**: Primary color, accent color, border radius.
* **Features**: Enable Look Inside, Affiliate buttons, Schema markup, Custom button, Hide Add to Cart.
* **Labels**: Override Add to Cart, Look Inside, View Cart, Related Books, etc.
* **Connect & Data**: Google Books API key, Amazon PA-API credentials, Smart Fallback toggle.

== Shortcode Usage ==

**Basic:**
`
[shelfsage mode="grid" limit="12"]
`

**With attributes:**
`
[shelfsage mode="grid" design="design-1" limit="8" genre="fiction" author="jane-austen" show_author_badge="yes"]
`

**Using saved shortcode ID:**
`
[shelfsage id="3"]
`

**Data source (Shortcode Architect):** WooCommerce (default), Google Books, Amazon, Vault.

Full attribute list: `mode`, `layout`, `design`, `limit`, `query`, `genre`, `author`, `publisher`, `category`, `ids`, `sort_by`, `sort_order`, `show_image`, `show_title`, `show_price`, `show_cart`, `show_author_badge`, `show_rating`, `show_summary`, `col`, `col_tablet`, `col_mobile`, `radius`, `gap`, `img_height`, `alignment`.

**PHP Usage:**
`
<?php echo do_shortcode('[shelfsage mode="grid" limit="6"]'); ?>
`

== Installation ==

= Install via WordPress Admin =
1. Go to Plugins → Add New.
2. Search for **ShelfSage**.
3. Click Install Now, then Activate.
4. You will be redirected to the ShelfSage Welcome Wizard.
5. Follow the setup steps and optionally import sample data.
6. Go to **ShelfSage → Dashboard** to start.

= Install via Upload =
1. Download the `shelfsage.zip` file.
2. Go to Plugins → Add New → Upload Plugin.
3. Choose the file and click Install Now.
4. Activate the plugin.

= Install via FTP =
1. Upload the `shelfsage` folder to `/wp-content/plugins/`.
2. Go to Plugins in WordPress admin and activate ShelfSage.

= Display Books =
* Use the Shortcode Architect (ShelfSage → Shortcode Architect) to design and copy a shortcode.
* Or add `[shelfsage mode="grid"]` to any page or post.

== Frequently Asked Questions ==

= Does this work with any WooCommerce theme? =
Yes. ShelfSage uses its own styling for book grids and details. It can be customized via CSS and respects your theme's layout.

= Can I disable certain taxonomies? =
Yes. You can enable or disable taxonomies (Translators, Series, etc.) during onboarding or from settings.

= How do I display books on a page? =
Use the Shortcode Architect (ShelfSage → Shortcode Architect) to design your layout, or add `[shelfsage mode="grid"]` directly. Paste the shortcode into any page or post.

= Is WooCommerce required? =
Yes. ShelfSage extends WooCommerce for products, pricing, and cart. WooCommerce must be active.

= Where is my Google Books API key stored? =
The API key is stored securely in the WordPress database (`shelfsage_settings` option). It is only used server-side and never exposed to visitors.

= What data does ShelfSage send to Google or Amazon? =
Only the data necessary for the requested operation: search queries (ISBN, title, or keyword) and your configured API credentials. No personal user data is sent. See the External Services section above.

== Screenshots ==

1. ShelfSage Dashboard: Central hub for bookstore management.
2. Shortcode Architect: Visual builder with live preview.
3. Book Grid (Frontend): Responsive book display with hover effects.
4. Author Management: Dedicated interface for book authors.
5. Single Product (Book): Custom template with metadata and Look Inside.
6. Settings: Connect Google Books and Amazon PA-API.
7. Library: Taxonomies for Authors, Publishers, Genres.
8. Related Books: Auto-generated related titles section.

== Changelog ==

= 1.5.1 =
* **New:** Book Analytics dashboard — most-viewed books and search-trend insights (ShelfSage → SS Dashboard → Insights).
* **New:** Audiobook / sample-audio preview player on book product pages and via `[shelfsage_audiobook_preview]` shortcode.
* **New:** Author profile pages with biography, photo, and social profiles (Facebook, Twitter/X, Instagram, LinkedIn, website).
* **New:** Book review system with guest submissions and verified-purchase badge sourced from WooCommerce orders.
* **New:** Series reading-order management (`[shelfsage_series_order]`) — assign and display the canonical sequence of books in a series.
* **New:** Reading List / My Library — logged-in customers can save books from product pages; `[shelfsage_reading_list]` shortcode and `/my-library/` endpoint.
* **New:** Bulk book import from CSV/Excel — sample template, validation, and direct WooCommerce product creation.
* **New:** PDF Flipbook viewer — 3D page-flip "Look Inside" experience powered by StPageFlip with mobile fallback to PDF.js.
* **New:** Advanced SEO Book schema (JSON-LD) — co-authors, translators, series (`isPartOf`), genre, awards, `bookFormat`, `bookEdition`, `numberOfPages`, `inLanguage`, `datePublished`.
* **New:** Co-Author(s) and Book Awards meta fields (Product → Book Details) feed JSON-LD; `trsss_book_schema` filter and `enable_advanced_schema` toggle for fine-grained control.
* **New:** Book-page font family customization — Theme Default (zero web-font requests), curated Bengali/English Google Fonts presets, or Custom CSS font-family.
* **New:** Age Rating / Content Advisory Badge — colour-coded pill on product pages (All Ages / Children / Teen 13+ / Young Adult 16+ / Adult 18+). Dropdown under Product → Book Details → Age Rating. Auto-injected on stock WC templates at priority 9 (between Book Condition and price), embedded in all six ShelfSage single-product templates, and pushed to JSON-LD as `contentRating` + `typicalAgeRange` for SEO. Shortcode: `[shelfsage_age_rating id="123" icon="yes"]`. Legacy free-text values like "13+", "YA", "Adult", "Kids" are auto-mapped to canonical slugs. Filters: `trsss_age_rating_labels`, `trsss_age_rating_colors`, `trsss_age_rating_icons`, `trsss_auto_inject_age_rating`. New file: `includes/age-rating.php`.
* **New:** Low / Out-of-Stock Email Alerts — hooks `woocommerce_low_stock` and `woocommerce_no_stock` to send a customized HTML email (book cover, ISBN, current stock, "Edit Product" button) when stock drops at or below the configured threshold. Throttled to one alert per book per 12 hours; throttle resets the moment stock is replenished above the threshold. Multi-recipient (comma- or semicolon-separated). Settings → Features → Inventory Alerts. Filters: `trsss_stock_alert_throttle`, `trsss_stock_alert_subject`, `trsss_stock_alert_html`, `trsss_stock_alert_recipients`, `trsss_stock_alert_should_send`. Action: `trsss_stock_alert_sent`. New file: `includes/stock-alerts.php`.
* **New:** Book Condition Badge — colour-coded "Used – Good Condition" badge for second-hand bookstores. Dropdown under Product → Book Details (New / Used – Like New / Used – Good / Used – Acceptable / Used – Poor). Auto-injected on stock WC templates (priority 8 between title and price) and inside all six ShelfSage single-product templates. Shortcode: `[shelfsage_book_condition id="123"]`. Also pushed into JSON-LD as `itemCondition` (`schema.org/UsedCondition` / `NewCondition` / `DamagedCondition`) for Google Shopping. Filters: `trsss_book_condition_labels`, `trsss_book_condition_colors`, `trsss_auto_inject_book_condition`. New file: `includes/book-condition.php`.
* **New:** Pre-order Countdown is now visible on stock WooCommerce templates too — auto-injected on the single-product summary at priority 25 (between excerpt and Add to Cart). Use the `trsss_auto_inject_preorder_countdown` filter to disable per product.
* **New:** `[shelfsage_preorder_countdown id="123"]` shortcode for placing the countdown anywhere (landing pages, blocks, sidebars, theme files via `do_shortcode()`).
* **Enhancement:** Release Date meta field upgraded to a native HTML5 date picker; Pre Order Availability is now a clean Yes/No select instead of a free-text input.
* **New:** WooCommerce feature compatibility declared via `FeaturesUtil::declare_compatibility()` for both `custom_order_tables` (HPOS, WC 7.1+) and `cart_checkout_blocks` (Cart / Checkout Blocks, WC 8.3+). The "incompatible plugin" warnings on WooCommerce → Settings → Advanced → Features are gone in both cases.
* **Security:** E-book Download Gate — `_rmss_ebook_url` is no longer exposed publicly. Customers see a "Download e-book" button only after a paid order (status: completed / processing). Downloads use HMAC-SHA256 signed URLs (30-day expiry by default), and the `template_redirect` handler re-checks order ownership and paid status before streaming local files or redirecting to external storage. Order completion / processing emails get a "Your e-book downloads" section auto-injected, and the admin order screen now shows download counters per product. New file: `includes/ebook-download-gate.php`. Filters: `trsss_ebook_token_ttl`, `trsss_ebook_paid_statuses`, `trsss_ebook_email_ids`, `trsss_ebook_locked_label`.
* **Security:** Amazon PA-API credentials (Access Key, Secret Key) encrypted at rest with AES-256-CBC via `openssl_encrypt` (`includes/class-shelfsage-credential-store.php`).
* **Security:** PDF viewer hardened — nonce-protected proxy plus DB whitelist that only serves URLs registered as a product's Look Inside URL (prevents SSRF and unauthorized PDF proxying).
* **Fix:** Analytics — bot detection (Googlebot, Bingbot, Slurp, DuckDuckBot, Baidu, curl, wget) and 24-hour cookie-based deduplication eliminate redundant `update_post_meta` writes on every page view.
* **Fix:** Reading list response now uses `_prime_post_caches()` to resolve N+1 query problem (50 books = 1–2 queries instead of 150+).
* **Fix:** "Look Inside" inside the Shortcode Architect React preview now honors the configured PDF Reader Engine (flipbook / mobile / basic) and uses the nonce-protected viewer.
* **Fix:** `page-flip.browser.js` shipped with the release zip via `scripts/copy-pageflip-assets.js`; defensive CDN fallback if the local asset is missing.
* **Enhancement:** Mobile-responsive single product, vault, and taxonomy page titles prevent overflow on small screens.
* **Enhancement:** Schema output moved from `frontend.php` into dedicated `includes/seo-schema.php`.
* **Enhancement:** `shelfsage-chunk2.js` no longer ships with the public bundle (admin-only Settings module removed from `main.jsx`).
* **i18n:** `languages/shelfsage.pot` shipped (248 strings) for translation pipelines.
* **New:** `uninstall.php` — full data cleanup on plugin delete. Removes 9 plugin options, all `_rmss_*`, `_trsss_view_count`, `_trsss_last_viewed_at`, `_trsss_series_order`, `_trsss_ebook_dl_*`, and `_ss_vault_*` post meta, the `_trsss_reading_list` user meta, the `_trsss_verified_purchase` comment meta, every `ss_vault_assets` and `rmss_shortcode` custom post, all five ShelfSage taxonomy terms, the `idx_shelfsage_isbn` postmeta index, the `trsss_book_api` object-cache group, and all `trsss_*` transients. Multisite-aware (loops every site) and short-circuited by `add_filter( 'trsss_skip_uninstall_cleanup', '__return_true' )` for staged migrations.

= 1.5.0 =
* **New:** Smart Fallback for Google Books API and Amazon PA-API.
* **New:** Secure server-side Google Books fetch endpoint (`/fetch-books`).
* **New:** Growth & Ecosystem layer in Dashboard sidebar.
* **New:** Mini stats row (Vault, Shortcodes, API usage).
* **New:** What's New changelog modal in footer.
* **Enhancement:** Look Inside badge click fix (pointer-events overlay).
* **Enhancement:** Dashboard greeting personalized by local time.
* **Enhancement:** Highlights section for capabilities and documentation links.
* **Security:** Fixed REST API log exposure; nonce verification hardened.
* **Fix:** Resolved shortcode creation race condition for free users.
* **Fix:** Theme override compatibility with payment gateways.
* **Fix:** Replaced deprecated `wp_count_terms()`; `date()` → `gmdate()`.
* **Optimized:** Enqueue assets only when ShelfSage shortcodes are present.

= 1.0.2 =
* **New:** Documentation page in admin.
* **New:** Improved Dashboard UI with quick action cards.
* **Enhancement:** Inter and Lora Google Fonts.

= 1.0.1 =
* **New:** Sample Data Import.
* **New:** Welcome Wizard for initial setup.

= 1.0.0 =
* Initial release.
* Core: Taxonomies, Shortcodes, Metadata, React Frontend.

== Upgrade Notice ==

= 1.5.1 =
* Major release: Analytics dashboard, audiobook player, author profiles, reviews, series order, reading lists, CSV import, PDF flipbook, advanced SEO schema, font customization, WC HPOS compatibility, AES-256 credential encryption, and PDF viewer hardening. No breaking changes.

= 1.5.0 =
* New: Secure fetch-books endpoint, Growth & Ecosystem layer, dashboard enhancements, Look Inside fix, and performance optimizations.
