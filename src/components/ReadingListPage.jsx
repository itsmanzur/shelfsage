import React, { useEffect, useMemo, useState } from 'react';
import {
    fetchRemoteReadingList,
    getLocalReadingList,
    getReadingListStatusLabel,
    getSettings,
    removeLocalReadingListEntry,
    removeRemoteReadingListEntry,
    saveLocalReadingListEntry,
    saveRemoteReadingListEntry,
} from './readingListStore';

const tabs = [
    { key: 'wishlist', label: 'Wishlist' },
    { key: 'reading', label: 'Reading' },
    { key: 'finished', label: 'Finished' },
];

function localItemsToArray(list) {
    return Object.values(list || {}).sort((a, b) => (b.updated_at || 0) - (a.updated_at || 0));
}

const ReadingListPage = () => {
    const settings = getSettings();
    const [items, setItems] = useState([]);
    const [activeTab, setActiveTab] = useState('wishlist');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const load = async () => {
        setLoading(true);
        setMessage('');
        if (settings.isLoggedIn) {
            try {
                const data = await fetchRemoteReadingList();
                setItems(Array.isArray(data.items) ? data.items : []);
            } catch (_) {
                setItems(localItemsToArray(getLocalReadingList()));
                setMessage('Showing the saved list from this browser.');
            } finally {
                setLoading(false);
            }
            return;
        }
        setItems(localItemsToArray(getLocalReadingList()));
        setLoading(false);
    };

    useEffect(() => {
        load();
        const onUpdate = () => load();
        window.addEventListener('shelfsage-reading-list-updated', onUpdate);
        return () => window.removeEventListener('shelfsage-reading-list-updated', onUpdate);
    }, []);

    const counts = useMemo(() => tabs.reduce((acc, tab) => {
        acc[tab.key] = items.filter(item => item.status === tab.key).length;
        return acc;
    }, {}), [items]);

    const visibleItems = items.filter(item => item.status === activeTab);

    const moveItem = async (item, nextStatus) => {
        saveLocalReadingListEntry(item.product_id || item.id, nextStatus, item);
        if (settings.isLoggedIn) {
            try {
                const data = await saveRemoteReadingListEntry(item.product_id || item.id, nextStatus);
                setItems(Array.isArray(data.items) ? data.items : []);
                return;
            } catch (_) {
                setMessage('Saved in this browser. It will sync when the server accepts the request.');
            }
        }
        await load();
    };

    const removeItem = async (item) => {
        removeLocalReadingListEntry(item.product_id || item.id);
        if (settings.isLoggedIn) {
            try {
                const data = await removeRemoteReadingListEntry(item.product_id || item.id);
                setItems(Array.isArray(data.items) ? data.items : []);
                return;
            } catch (_) {
                setMessage('Removed from this browser.');
            }
        }
        await load();
    };

    return (
        <div className="ss-reading-list-page max-w-6xl mx-auto px-4 py-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-600 mb-2">ShelfSage</p>
                    <h2 className="text-3xl font-black text-gray-950 tracking-tight">My Reading List</h2>
                    <p className="text-sm text-gray-500 mt-2">{settings.isLoggedIn ? 'Synced with your account.' : 'Saved in this browser. Log in to keep it synced across devices.'}</p>
                </div>
                {!settings.isLoggedIn && settings.loginUrl && (
                    <a href={settings.loginUrl} className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gray-950 text-white text-sm font-bold hover:bg-gray-800 transition-colors">Log in to sync</a>
                )}
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab.key ? 'bg-rose-600 text-white shadow-md shadow-rose-100' : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-200 hover:text-rose-700'}`}
                    >
                        {tab.label} <span className="opacity-70">({counts[tab.key] || 0})</span>
                    </button>
                ))}
            </div>

            {message && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">{message}</div>}

            {loading ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-500">Loading your list...</div>
            ) : visibleItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a3 3 0 013-3h8a3 3 0 013 3v16l-7-4-7 4V5z" /></svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900">No books in {getReadingListStatusLabel(activeTab)} yet</h3>
                    <p className="mt-2 text-sm text-gray-500">Use the Save button on any ShelfSage book card to build this list.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {visibleItems.map(item => (
                        <div key={item.product_id || item.id} className="flex flex-col sm:flex-row gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                            <a href={item.permalink || '#'} className="w-24 h-32 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                {item.image || item.thumbnail ? <img src={item.image || item.thumbnail} alt={item.title} className="h-full w-full object-cover" /> : <div className="h-full w-full bg-gray-100" />}
                            </a>
                            <div className="min-w-0 flex-1">
                                <a href={item.permalink || '#'} className="text-lg font-black text-gray-950 hover:text-rose-700">{item.title}</a>
                                {item.authors && <p className="mt-1 text-sm text-gray-500">{item.authors}</p>}
                                {item.summary && <p className="mt-2 text-sm text-gray-600 line-clamp-2">{item.summary}</p>}
                                {item.price && <div className="mt-3 text-sm font-bold text-gray-900" dangerouslySetInnerHTML={{ __html: item.price }} />}
                            </div>
                            <div className="flex sm:flex-col gap-2 sm:items-end sm:justify-between">
                                <select value={item.status} onChange={(e) => moveItem(item, e.target.value)} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700">
                                    {tabs.map(tab => <option key={tab.key} value={tab.key}>{tab.label}</option>)}
                                </select>
                                <button type="button" onClick={() => removeItem(item)} className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:border-rose-200 hover:text-rose-700">Remove</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ReadingListPage;
