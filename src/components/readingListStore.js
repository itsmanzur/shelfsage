const STORAGE_KEY = 'shelfsage_reading_list_v1';
const STATUS_LABELS = {
    wishlist: 'Wishlist',
    reading: 'Reading',
    finished: 'Finished',
};

export const readingListStatuses = Object.keys(STATUS_LABELS);
export const getReadingListStatusLabel = (status) => STATUS_LABELS[status] || STATUS_LABELS.wishlist;

export function getSettings() {
    if (typeof window !== 'undefined' && window.rmssSettings) return window.rmssSettings;
    if (typeof window !== 'undefined' && window.parent && window.parent.rmssSettings) return window.parent.rmssSettings;
    return {};
}

export function buildShelfSageApiUrl(endpoint = '') {
    const settings = getSettings();
    const base = settings.apiUrl || '/wp-json/shelfsage/v1';
    const path = endpoint ? `/${String(endpoint).replace(/^\/+/, '')}` : '';
    if (base.includes('rest_route=')) {
        try {
            const url = new URL(base, window.location.origin);
            const route = (url.searchParams.get('rest_route') || '/shelfsage/v1').replace(/\/+$/, '');
            url.searchParams.set('rest_route', `${route}${path}`);
            return url.toString();
        } catch (_) {
            return `${base}${path}`;
        }
    }
    return `${base.replace(/\/+$/, '')}${path}`;
}

function readLocalList() {
    if (typeof window === 'undefined') return {};
    try {
        const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
        return {};
    }
}

function writeLocalList(list) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list || {}));
    window.dispatchEvent(new CustomEvent('shelfsage-reading-list-updated', { detail: list || {} }));
}

export function getLocalReadingList() {
    return readLocalList();
}

export function getLocalReadingListEntry(productId) {
    const id = String(productId || '');
    return readLocalList()[id] || null;
}

export function saveLocalReadingListEntry(productId, status = 'wishlist', book = {}) {
    const id = String(productId || '');
    if (!id) return {};
    const list = readLocalList();
    const now = Math.floor(Date.now() / 1000);
    list[id] = {
        product_id: Number(productId),
        status,
        added_at: list[id]?.added_at || now,
        updated_at: now,
        title: book.title || '',
        thumbnail: book.image || book.thumbnail || '',
        authors: book.authors || '',
        price: book.price || '',
        permalink: book.permalink || '',
        summary: book.summary || '',
    };
    writeLocalList(list);
    return list[id];
}

export function removeLocalReadingListEntry(productId) {
    const id = String(productId || '');
    const list = readLocalList();
    delete list[id];
    writeLocalList(list);
}

export async function fetchRemoteReadingList() {
    const settings = getSettings();
    const res = await fetch(buildShelfSageApiUrl('/reading-list'), {
        headers: { 'X-WP-Nonce': settings.nonce || '' },
        credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('Could not load reading list');
    return res.json();
}

let remoteSyncPromise = null;
export function ensureRemoteReadingListSynced() {
    const settings = getSettings();
    if (!settings.isLoggedIn) return Promise.resolve(null);
    if (!remoteSyncPromise) {
        remoteSyncPromise = fetchRemoteReadingList()
            .then((data) => {
                const next = {};
                (data.items || []).forEach((item) => {
                    const id = String(item.product_id || item.id || '');
                    if (!id) return;
                    next[id] = {
                        product_id: Number(item.product_id || item.id),
                        status: item.status || 'wishlist',
                        added_at: item.added_at || Math.floor(Date.now() / 1000),
                        updated_at: item.updated_at || Math.floor(Date.now() / 1000),
                        title: item.title || '',
                        thumbnail: item.image || item.thumbnail || '',
                        authors: item.authors || '',
                        price: item.price || '',
                        permalink: item.permalink || '',
                        summary: item.summary || '',
                    };
                });
                writeLocalList(next);
                return data;
            })
            .catch(() => null);
    }
    return remoteSyncPromise;
}

export async function saveRemoteReadingListEntry(productId, status = 'wishlist') {
    const settings = getSettings();
    const res = await fetch(buildShelfSageApiUrl('/reading-list'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-WP-Nonce': settings.nonce || '',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ product_id: Number(productId), status }),
    });
    if (!res.ok) throw new Error('Could not save reading list item');
    const data = await res.json();
    window.dispatchEvent(new CustomEvent('shelfsage-reading-list-updated', { detail: data }));
    return data;
}

export async function removeRemoteReadingListEntry(productId) {
    const settings = getSettings();
    const res = await fetch(buildShelfSageApiUrl(`/reading-list/${Number(productId)}`), {
        method: 'DELETE',
        headers: { 'X-WP-Nonce': settings.nonce || '' },
        credentials: 'same-origin',
    });
    if (!res.ok) throw new Error('Could not remove reading list item');
    const data = await res.json();
    window.dispatchEvent(new CustomEvent('shelfsage-reading-list-updated', { detail: data }));
    return data;
}
