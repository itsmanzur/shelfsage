/**
 * ShelfSage Changelog — single source of truth for "What's New" tab.
 *
 * To add a new release:
 *   1. Push a new object to the top of this array.
 *   2. Fill in version, date, and features[].
 *   3. badge options: 'NEW' | 'IMPROVED' | 'FIX' | 'SECURITY' | 'REMOVED'
 *   4. category: 'Feature' | 'Performance' | 'Security' | 'UX' | 'Developer'
 */

export const CURRENT_VERSION = '1.5.1';

export const changelog = [
  {
    version: '1.5.1',
    date: '2026-05-04',
    features: [
      {
        badge: 'NEW',
        category: 'UX',
        icon: '🔤',
        title: 'Book Page Font Family',
        summary: 'Choose typography for ShelfSage single product pages: inherit from your theme, curated Bengali/English stacks, or a custom CSS font-family value. Google Fonts load only when a web font preset is selected.',
        usage: 'Settings → Appearance → Book Page Font Family. Pick a preset or Custom, then Save Settings. Theme Default keeps zero extra font requests.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '📖',
        title: 'Reading Lists (My Library)',
        summary: 'Customers can save books to personal reading lists directly from product pages.',
        usage: 'Product page → "Add to List" button → customers view saved books at /my-library/. Shortcode: [shelfsage_reading_list]',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '📥',
        title: 'Bulk Book Import',
        summary: 'Import books in bulk from a CSV file directly into WooCommerce.',
        usage: 'Settings → Connect & Data → Bulk Import. Download the sample CSV template, fill in book data, and upload.',
      },
      {
        badge: 'NEW',
        category: 'UX',
        icon: '📱',
        title: 'Mobile PDF Look Inside',
        summary: 'Look Inside now works on mobile — PDFs open inline instead of downloading.',
        usage: 'Automatic. On mobile, clicking Look Inside opens the PDF in a page-by-page reader. No configuration needed.',
      },
      {
        badge: 'NEW',
        category: 'UX',
        icon: '🔗',
        title: 'Test API Connection (Google Books)',
        summary: 'Verify your Google Books API key is working with one click.',
        usage: 'Settings → Connect & Data → Google Books API Key → click "Test Connection". Shows latency and result.',
      },
      {
        badge: 'NEW',
        category: 'UX',
        icon: '🔧',
        title: 'Maintenance Tools Tab',
        summary: 'Bulk slug & title repair moved to a dedicated Tools tab with a confirmation dialog.',
        usage: 'Settings → Tools → "Run Slug & Title Repair". Fixes mojibake/encoding issues in book titles and URLs.',
      },
      {
        badge: 'FIX',
        category: 'Performance',
        icon: '⚡',
        title: 'Object-Cache Transient Optimization',
        summary: 'Amazon/Google API results now use wp_cache first; DB transients only written when needed.',
        usage: 'Automatic. With Redis/Memcached active, wp_options bloat is reduced. Filter: trsss_book_api_always_write_db_transients',
      },
      {
        badge: 'SECURITY',
        category: 'Security',
        icon: '🔒',
        title: 'PDF Viewer Hardened',
        summary: 'pdf-viewer.php now requires a WordPress nonce and verifies the URL is a registered Look Inside URL.',
        usage: 'Automatic. Prevents SSRF abuse and unauthorized PDF proxying.',
      },
    ],
  },
  {
    version: '1.2.0',
    date: '2025-12-01',
    features: [
      {
        badge: 'NEW',
        category: 'UX',
        icon: '🏗️',
        title: '3-Tab Shortcode Architect',
        summary: 'Redesigned left sidebar with Fetch Data, Layout, and Designer tabs for a cleaner workflow.',
        usage: 'ShelfSage → Shortcode Architect → use the three tabs on the left panel.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '🔃',
        title: 'Sort & Order Controls',
        summary: 'Sort books by Date, Title, Price, Rating, or Random — in Ascending or Descending order.',
        usage: 'Shortcode Architect → Fetch Data → Sort & Order section at the bottom.',
      },
      {
        badge: 'IMPROVED',
        category: 'UX',
        icon: '🏠',
        title: 'Home Dashboard Redesign',
        summary: 'New home page with Quick Launch cards, Pro Power section, stats row, and ecosystem tools.',
        usage: 'ShelfSage → Dashboard → Home tab.',
      },
      {
        badge: 'FIX',
        category: 'UX',
        icon: '📌',
        title: 'Shortcode Block Pinned to Top',
        summary: 'The generated shortcode code block is now pinned directly below the shortcode name input.',
        usage: 'Shortcode Architect → top of the left panel.',
      },
      {
        badge: 'FIX',
        category: 'UX',
        icon: '🌅',
        title: 'Smart Greeting Logic',
        summary: 'Greeting now shows Good Night, Morning, Afternoon, or Evening based on local browser time.',
        usage: 'Automatic — shown on the Dashboard home.',
      },
    ],
  },
  {
    version: '1.5.0',
    date: '2026-04-01',
    features: [
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '🎨',
        title: 'Shortcode Architect v2.4',
        summary: 'Visual no-code builder with WooCommerce, Vault, Google Books, and Amazon data sources.',
        usage: 'ShelfSage → Shortcode Architect → design your layout → copy shortcode → paste anywhere.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '🏛️',
        title: 'Vault — Catalog Without WooCommerce',
        summary: 'Display books without WooCommerce products. Perfect for libraries and catalogs.',
        usage: 'Library → Add to Vault → use [shelfsage_vault] shortcode or Architect with Vault source.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '📚',
        title: 'Smart Book Ingester',
        summary: 'Auto-fill book details (title, author, cover, description) from ISBN via Google Books.',
        usage: 'WooCommerce → Add Product → Smart Book Ingester tab → enter ISBN → auto-fill.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '🛍️',
        title: 'Amazon PA-API v5 Integration',
        summary: 'Fetch live prices and book data from Amazon using AWS Signature v4.',
        usage: 'Settings → Connect & Data → Amazon PA-API → enter credentials → use Amazon source in Architect.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '👁️',
        title: 'Look Inside (PDF/Image Preview)',
        summary: 'Show a book preview PDF or image in a modal when readers click "Look Inside".',
        usage: 'Product edit → Look Inside URL field → paste PDF or image URL → enable in Settings.',
      },
      {
        badge: 'NEW',
        category: 'Feature',
        icon: '🏷️',
        title: 'Book Taxonomies',
        summary: 'Author, Publisher, Genre, Translator, Series taxonomies with archive pages and filter widgets.',
        usage: 'Taxonomies auto-register on activation. Assign from the product edit screen or via import.',
      },
      {
        badge: 'NEW',
        category: 'Developer',
        icon: '⚛️',
        title: 'React + Vite Build Environment',
        summary: 'Full React 18 source with Vite build. All admin UI components editable in src/.',
        usage: 'npm install → npm run build (auto BOM-strip). Source: src/components/. Config: vite.config.js',
      },
    ],
  },
];
