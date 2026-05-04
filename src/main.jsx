import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import RelatedBooks from './components/RelatedBooks';
import ShelfTalker from './components/ShelfTalker';
import FilterApp from './components/FilterApp';
import SettingsApp from './components/SettingsApp';
import BooksShortcode from './components/BooksShortcode';
import ReadingListPage from './components/ReadingListPage';
import ReadingListButton from './components/ReadingListButton';
import './index.css';


// 1. Standalone Books Shortcodes ([shelfsage], [shelfsage_books])
function mountBooksShortcode(container) {
    if (container.dataset.ssMounted) return; // Prevent double rendering
    container.dataset.ssMounted = 'true';

    // Extract data attributes: use getAttribute for reliable values (dataset can have camelCase quirks)
    const props = {};
    for (const attr of container.attributes) {
        if (attr.name.startsWith('data-')) {
            const key = attr.name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            props[key] = attr.value;
        }
    }
    // Fallback: also merge dataset for any we might have missed
    Object.keys(container.dataset || {}).forEach((k) => {
        if (props[k] === undefined) props[k] = container.dataset[k];
    });
    // Force alignment and show_look_inside from data-* (saved design)
    const dataAlignment = container.getAttribute('data-alignment');
    if (dataAlignment != null && dataAlignment !== '') props.alignment = dataAlignment;
    const dataShowLookInside = container.getAttribute('data-show_look_inside');
    if (dataShowLookInside != null && dataShowLookInside !== '') props.show_look_inside = dataShowLookInside;
    // Merge nested design settings (3D shelf hover box: color_container, box_padding, shelf_hover_box_opacity)
    const designJson = container.getAttribute('data-design-json');
    if (designJson) {
        try {
            const design = JSON.parse(designJson);
            if (design && typeof design === 'object') Object.assign(props, design);
        } catch (_) { /* ignore */ }
    }

    try {
        ReactDOM.createRoot(container).render(
            <React.StrictMode>
                <BooksShortcode {...props} />
            </React.StrictMode>
        );
    } catch (err) {
        console.error(`ShelfSage: Error rendering shortcode:`, err);
    }
}

// Export for inline scripts (Gutenberg iframe fallback)
window.ShelfSageApp = window.ShelfSageApp || {};
window.ShelfSageApp.mountBooksShortcode = mountBooksShortcode;

// Initial mount on page load
const booksContainers = document.querySelectorAll('.rmss-books-container');
booksContainers.forEach(mountBooksShortcode);

// Global DOM Observer for Elementor / Gutenberg / Ajax compatibility
// Watches for dynamically inserted .rmss-books-container elements and mounts React on them
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === 1) { // ELEMENT_NODE
                    if (node.classList && node.classList.contains('rmss-books-container')) {
                        mountBooksShortcode(node);
                    }
                    if (node.querySelectorAll) {
                        const nested = node.querySelectorAll('.rmss-books-container');
                        nested.forEach(mountBooksShortcode);
                    }
                }
            });
        }
    });
});
observer.observe(document.body, { childList: true, subtree: true });

// 2. Main Search App
const appRoot = document.getElementById('rmss-app-root');
if (appRoot) {
    ReactDOM.createRoot(appRoot).render(
        <React.StrictMode>
            <App />
        </React.StrictMode>
    );
}

// 3. Filter App 
const filterRoot = document.getElementById('rmss-filter-app');
if (filterRoot) {
    ReactDOM.createRoot(filterRoot).render(
        <React.StrictMode>
            <FilterApp />
        </React.StrictMode>
    );
}

// 3b. Reading List / Wishlist page
const readingListRoot = document.getElementById('rmss-reading-list-app');
if (readingListRoot) {
    ReactDOM.createRoot(readingListRoot).render(
        <React.StrictMode>
            <ReadingListPage />
        </React.StrictMode>
    );
}

// 4. Related Books (single product page)
const relatedRoot = document.getElementById('rmss-related-books');
if (relatedRoot) {
    const productId = relatedRoot.dataset.productId || '';
    const limit = parseInt(relatedRoot.dataset.limit, 10) || 6;
    ReactDOM.createRoot(relatedRoot).render(
        <React.StrictMode>
            <RelatedBooks productId={productId ? Number(productId) : 0} limit={limit} />
        </React.StrictMode>
    );
}

// 4b. Single product reading-list buttons rendered by PHP hooks/templates
document.querySelectorAll('.ss-reading-list-single').forEach((container) => {
    if (container.dataset.ssMounted) return;
    container.dataset.ssMounted = 'true';
    const productId = Number(container.dataset.productId || 0);
    const book = {
        id: productId,
        title: container.dataset.title || '',
        thumbnail: container.dataset.thumbnail || '',
        image: container.dataset.image || container.dataset.thumbnail || '',
        authors: container.dataset.authors || '',
        price: container.dataset.price || '',
        permalink: container.dataset.permalink || '',
    };
    ReactDOM.createRoot(container).render(
        <React.StrictMode>
            <ReadingListButton book={book} />
        </React.StrictMode>
    );
});

// 5. Settings App (Admin)
const settingsRoot = document.getElementById('rmss-settings-root');
if (settingsRoot) {
    ReactDOM.createRoot(settingsRoot).render(
        <React.StrictMode>
            <SettingsApp />
        </React.StrictMode>
    );
}
