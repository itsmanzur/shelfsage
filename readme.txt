=== ShelfSage ===
Contributors: itsmanzur
Tags: books, woocommerce, bookstore, authors, publishers, library, shortcode, book display
Requires at least: 5.8
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.5.0
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

ShelfSage connects to external services to provide book metadata and search functionality.

**Google Books API**

When you configure a Google Books API key in Settings → Connect & Data, the plugin sends search queries (ISBN or title) and your API key to the Google Books API via a server-side proxy (`/shelfsage/v1/fetch-books`). This retrieves book metadata (title, author, cover image, description, page count). Your API key is stored in the WordPress database and is never exposed to the frontend. Data is fetched server-side using `wp_remote_get`.

[Google Books API](https://developers.google.com/books/docs/v1/using), [Terms](https://developers.google.com/terms), [Privacy Policy](https://policies.google.com/privacy)

**Amazon Product Advertising API (PA-API) v5**

If you configure Amazon PA-API credentials (Access Key, Secret Key, Associate Tag) in Settings, the plugin sends search requests to Amazon via a server-side proxy (`/shelfsage/v1/amazon-search`). This fetches product data (title, price, image, buy link) for display on your site. Credentials are stored in WordPress options and used only server-side. The plugin may also use Google Books as a fallback when Amazon data is incomplete (e.g., missing cover image).

[Amazon PA-API](https://webservices.amazon.com/paapi5/documentation/), [Terms](https://affiliate-program.amazon.com/help/operating/agreement), [Privacy](https://www.amazon.com/gp/help/customer/display.html?nodeId=468496)

**WordPress REST API**

The plugin uses the WordPress REST API for admin settings, shortcode CRUD, and frontend search. No third-party REST services are called for core functionality beyond Google Books and Amazon (when configured).

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
* **New:** Advanced SEO Book schema with co-author, translator, series, genre, awards, bookFormat, bookEdition, numberOfPages, inLanguage, and datePublished.
* **New:** Co-Author(s) and Book Awards meta fields (Product → Book Details) feed JSON-LD.
* **New:** `trsss_book_schema` filter and `enable_advanced_schema` toggle for fine-grained control.
* **Enhancement:** Mobile-responsive single product, vault, and taxonomy page titles to prevent overflow on small screens.
* **Enhancement:** Schema output moved from `frontend.php` into dedicated `includes/seo-schema.php` for clarity and extensibility.

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
* New: Advanced SEO Book schema (co-author, translator, series, awards, bookFormat) and mobile-responsive single product titles. No breaking changes.

= 1.5.0 =
* New: Secure fetch-books endpoint, Growth & Ecosystem layer, dashboard enhancements, Look Inside fix, and performance optimizations.
