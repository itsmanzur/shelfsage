import React, { useEffect, useState } from 'react';
import {
    ensureRemoteReadingListSynced,
    getLocalReadingListEntry,
    getReadingListStatusLabel,
    getSettings,
    removeLocalReadingListEntry,
    removeRemoteReadingListEntry,
    saveLocalReadingListEntry,
    saveRemoteReadingListEntry,
} from './readingListStore';

const ReadingListButton = ({ book, compact = false }) => {
    const [status, setStatus] = useState('');
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState(false);
    const productId = Number(book?.id || book?.product_id || 0);
    const settings = getSettings();
    const isLoggedIn = !!settings.isLoggedIn;

    useEffect(() => {
        const hydrate = () => {
            const entry = getLocalReadingListEntry(productId);
            setStatus(entry?.status || '');
        };
        hydrate();
        if (isLoggedIn) ensureRemoteReadingListSynced().then(hydrate);
        const onUpdate = () => hydrate();
        window.addEventListener('shelfsage-reading-list-updated', onUpdate);
        return () => window.removeEventListener('shelfsage-reading-list-updated', onUpdate);
    }, [productId, isLoggedIn]);

    const save = async (nextStatus) => {
        if (!productId) return;
        setBusy(true);
        setStatus(nextStatus);
        saveLocalReadingListEntry(productId, nextStatus, book);
        try {
            if (isLoggedIn) await saveRemoteReadingListEntry(productId, nextStatus);
        } catch (_) {
            // Local copy remains as a graceful fallback.
        } finally {
            setBusy(false);
            setOpen(false);
        }
    };

    const remove = async () => {
        if (!productId) return;
        setBusy(true);
        setStatus('');
        removeLocalReadingListEntry(productId);
        try {
            if (isLoggedIn) await removeRemoteReadingListEntry(productId);
        } catch (_) {
            // Already removed locally; keep UI responsive.
        } finally {
            setBusy(false);
            setOpen(false);
        }
    };

    if (!productId) return null;

    const active = !!status;
    const label = active ? getReadingListStatusLabel(status) : 'Save';

    return (
        <div className="ss-reading-list-control relative inline-flex">
            <button
                type="button"
                disabled={busy}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(v => !v); }}
                className={`ss-reading-list-btn inline-flex items-center justify-center gap-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 ${compact ? 'px-2.5 py-1.5' : 'px-3.5 py-2'} ${active ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' : 'bg-white/95 border-gray-200 text-gray-700 hover:border-rose-200 hover:text-rose-700'}`}
                title={active ? `Saved to ${label}` : 'Save to reading list'}
            >
                <svg className={`${compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} ${active ? 'fill-current' : ''}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a3 3 0 013-3h8a3 3 0 013 3v16l-7-4-7 4V5z" />
                </svg>
                {!compact && <span>{label}</span>}
            </button>
            {open && (
                <div className="absolute right-0 bottom-full mb-2 z-50 w-44 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden text-left">
                    {[
                        ['wishlist', 'Wishlist'],
                        ['reading', 'Currently Reading'],
                        ['finished', 'Finished'],
                    ].map(([key, text]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); save(key); }}
                            className={`w-full px-3 py-2 text-xs font-bold text-left hover:bg-rose-50 ${status === key ? 'text-rose-700 bg-rose-50' : 'text-gray-700'}`}
                        >
                            {text}
                        </button>
                    ))}
                    {active && (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); remove(); }}
                            className="w-full px-3 py-2 text-xs font-bold text-left text-gray-500 hover:bg-gray-50 border-t border-gray-100"
                        >
                            Remove
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ReadingListButton;
