import React, { useState, useEffect } from 'react';
import ProBadge from './ProBadge';

const SavedShortcodesApp = () => {
    const [shortcodes, setShortcodes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'grid', 'list', 'masonry', 'slider'

    // Cloning State
    const [cloneModal, setCloneModal] = useState(null); // { id, title, settings }
    const [cloneName, setCloneName] = useState('');
    const [cloning, setCloning] = useState(false);

    // Copy Feedback
    const [copiedId, setCopiedId] = useState(null);

    useEffect(() => {
        fetchShortcodes();
    }, []);

    const fetchShortcodes = async () => {
        try {
            const nonce = window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce || window.rmssAdminSettings?.global?.nonce;
            const response = await fetch(`${window.rmssAdminSettings?.restUrl}/shortcodes`, {
                headers: { 'X-WP-Nonce': nonce }
            });
            if (!response.ok) throw new Error('Failed to fetch shortcodes');
            const data = await response.json();
            setShortcodes(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching shortcodes:', err);
            setError('Failed to load shortcodes. Please try again.');
            setShortcodes([]);
            setLoading(false);
        }
    };

    // Rebuild shortcode string
    const buildShortcode = (s) => {
        if (!s) return `[shelfsage]`;
        const layout = s.layout || 'grid';
        const colDesktop = parseInt(s.col_desktop) || 4;
        const colTablet = parseInt(s.col_tablet) || 3;
        const colMobile = parseInt(s.col_mobile) || 1;
        const limit = parseInt(s.limit) || 12;
        const borderRadius = parseInt(s.border_radius) || 12;
        const gridGap = parseInt(s.grid_gap) || 24;
        const imageHeight = parseInt(s.image_height) || 320;

        let sc = `[shelfsage mode="${layout}"`;
        if (s.design && s.design !== 'design-1') sc += ` design="${s.design}"`;
        if (colDesktop !== 4) sc += ` col="${colDesktop}"`;
        if (colTablet !== 3) sc += ` col_tablet="${colTablet}"`;
        if (colMobile !== 1) sc += ` col_mobile="${colMobile}"`;
        if (s.query_type && s.query_type !== 'latest') sc += ` query="${s.query_type}"`;
        if (limit !== 12) sc += ` limit="${limit}"`;
        if (s.query_type === 'genre' && s.genre) sc += ` genre="${s.genre}"`;
        if (s.query_type === 'author' && s.author) sc += ` author="${s.author}"`;
        if (s.query_type === 'publisher' && s.publisher) sc += ` publisher="${s.publisher}"`;
        if (s.query_type === 'category' && s.category) sc += ` category="${s.category}"`;
        const ids = s.selectedProducts || s.products;
        if (s.query_type === 'specific' && Array.isArray(ids) && ids.length > 0) sc += ` ids="${ids.join(',')}"`;

        // Styling params
        if (borderRadius !== 12) sc += ` radius="${borderRadius}"`;
        if (gridGap !== 24) sc += ` gap="${gridGap}"`;
        if (imageHeight !== 320) sc += ` img_height="${imageHeight}"`;

        // Toggles
        if (s.show_title === false) sc += ` title="off"`;
        if (s.show_price === false) sc += ` price="off"`;
        if (s.show_rating === false) sc += ` rating="off"`;
        if (s.show_image === false) sc += ` image="off"`;
        if (s.show_cart === false) sc += ` cart="off"`;
        if (s.show_author_badge) sc += ` author_badge="on"`;
        if (s.show_summary) sc += ` summary="on"`;

        sc += `]`;
        return sc;
    };

    const copyToClipboard = async (text, id) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
            } else {
                const el = document.createElement('textarea');
                el.value = text;
                el.style.position = 'fixed';
                el.style.opacity = '0';
                document.body.appendChild(el);
                el.focus();
                el.select();
                document.execCommand('copy');
                document.body.removeChild(el);
            }
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            alert('Copy failed: ' + text);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this shortcode?')) return;
        setShortcodes(shortcodes.filter(s => s.id !== id));
        try {
            await fetch(`${window.rmssAdminSettings?.restUrl}/shortcodes/${id}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce }
            });
        } catch (err) {
            console.error('Delete error:', err);
        }
    };

    const openCloneModal = (shortcode) => {
        setCloneModal(shortcode);
        setCloneName(`${shortcode.title} (Copy)`);
    };

    const handleClone = async () => {
        if (!cloneName.trim()) return;
        setCloning(true);
        try {
            const response = await fetch(`${window.rmssAdminSettings?.restUrl}/shortcodes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce
                },
                body: JSON.stringify({
                    title: cloneName,
                    settings: cloneModal.settings
                })
            });
            if (response.ok) {
                setCloneModal(null);
                setCloneName('');
                fetchShortcodes(); // Refresh list
            } else {
                const err = await response.json().catch(() => ({}));
                alert(err.message || 'Failed to clone');
            }
        } catch (err) {
            console.error('Clone error:', err);
            alert('Clone failed');
        } finally {
            setCloning(false);
        }
    };

    // Filter Logic
    const filteredShortcodes = shortcodes.filter(sc => {
        const matchesSearch = sc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sc.id.toString().includes(searchTerm);
        const matchesFilter = filterType === 'all' || (sc.settings?.layout || 'grid') === filterType;
        return matchesSearch && matchesFilter;
    });

    // Helper for Mini Preview
    const MiniPreview = ({ settings }) => {
        const layout = settings?.layout || 'grid';
        const primaryColor = settings?.primary_color || '#6d28d9';

        const renderContent = () => {
            if (layout === 'slider') {
                return (
                    <div className="relative w-28 h-20 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center justify-between px-2 group-hover:scale-105 transition-transform duration-500">
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <div className="w-16 h-12 rounded-md" style={{ backgroundColor: primaryColor, opacity: 0.1 }}></div>
                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                    </div>
                );
            }

            if (layout === 'list') {
                return (
                    <div className="flex flex-col gap-2 w-28 group-hover:scale-105 transition-transform duration-500">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-4 bg-white rounded-md shadow-sm border border-gray-100 flex items-center px-2 gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor, opacity: 0.4 }}></div>
                                <div className="w-16 h-1 bg-gray-100 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                );
            }

            // Default: Grid
            return (
                <div className="grid grid-cols-2 gap-2 w-24 group-hover:scale-105 transition-transform duration-500">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-10 bg-white rounded-md shadow-sm border border-gray-100 p-1">
                            <div className="w-full h-full rounded-[2px]" style={{ backgroundColor: primaryColor, opacity: 0.1 }}></div>
                        </div>
                    ))}
                </div>
            );
        };

        return (
            <div className="w-full h-full bg-[#f9fafb] flex items-center justify-center p-4 relative overflow-hidden">
                {/* Dotted Background Pattern */}
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#1a0b2e 1.5px, transparent 1.5px)', backgroundSize: '16px 16px' }}></div>
                <div className="relative z-10">
                    {renderContent()}
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">

            {/* 1. Standardized Sticky Header Bar */}
            <div className="h-16 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 z-30 sticky top-0 shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <a href="admin.php?page=shelfsage-dashboard" className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-lg group" title="Back to Dashboard">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </a>
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">📚</span>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Shortcode Hub</h1>
                        </div>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">v2.4</span>
                        {window.rmssAdminSettings?.isPro === '1' && (
                            <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider flex items-center gap-1">
                                👑 PRO ACTIVE
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="admin.php?page=shelfsage-architect"
                        className="bg-purple-600 text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/10 flex items-center gap-2 transform hover:scale-105"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Create New
                    </a>
                </div>
            </div>

            {/* 2. Filters & Search Bar */}
            <div className="bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                    {['all', 'grid', 'list', 'masonry', 'slider'].map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${filterType === type ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Search designs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
                    />
                    <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* 3. Grid Content */}
            <div className="flex-1 overflow-y-auto p-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-gray-400">
                        <svg className="w-8 h-8 animate-spin mr-3" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        Loading your library...
                    </div>
                ) : filteredShortcodes.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center">
                        <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center text-4xl mb-6">✨</div>
                        <h3 className="text-xl font-bold text-gray-900">Create your first design</h3>
                        <p className="text-gray-500 mt-2 mb-8 max-w-sm">Bring your bookshelves to life with custom layouts and beautiful display options.</p>
                        <a
                            href="admin.php?page=shelfsage-architect"
                            className="bg-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            Start Creating
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-12">
                        {filteredShortcodes.map(shortcode => {
                            const sc = buildShortcode(shortcode.settings);
                            const isCopied = copiedId === shortcode.id;

                            return (
                                <div
                                    key={shortcode.id}
                                    className="group bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden flex flex-col relative"
                                >
                                    {/* Thumbnail Area */}
                                    <div className="h-44 relative overflow-hidden bg-gray-50 border-b border-gray-100">
                                        <MiniPreview settings={shortcode.settings} />

                                        {/* Hover Actions Overlay */}
                                        <div className="absolute inset-0 bg-purple-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 z-20">
                                            <a
                                                href={`admin.php?page=shelfsage-architect&edit=${shortcode.id}`}
                                                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-all shadow-lg transform hover:scale-110 active:scale-95"
                                                title="Edit"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                            </a>
                                            <button
                                                onClick={() => openCloneModal(shortcode)}
                                                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-600 hover:bg-purple-100 hover:text-purple-600 transition-all shadow-lg transform hover:scale-110 active:scale-95"
                                                title="Duplicate"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" /></svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(shortcode.id)}
                                                className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 transition-all shadow-lg transform hover:scale-110 active:scale-95"
                                                title="Delete"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Meta Info */}
                                    <div className="p-5 pb-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="text-gray-900 font-bold text-lg leading-tight truncate pr-2">{shortcode.title}</h3>
                                            <span className="bg-purple-50 text-purple-600 text-[10px] font-bold px-2.5 py-1 rounded-md border border-purple-100 uppercase tracking-tighter">
                                                {shortcode.settings?.layout || 'grid'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
                                            <span>ID: {shortcode.id}</span>
                                            <span className="text-gray-300">•</span>
                                            <span>{shortcode.date}</span>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-purple-500/70">{shortcode.settings?.limit || 12} items</span>
                                        </div>
                                    </div>

                                    {/* Action Footer */}
                                    <div className="px-5 pb-5">
                                        <div
                                            onClick={() => copyToClipboard(sc, shortcode.id)}
                                            className="group/copy flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1.5 pl-3 cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all relative"
                                        >
                                            <code className="text-[11px] text-gray-500 font-mono truncate flex-1">{sc}</code>
                                            <div className={`p-1.5 rounded-lg transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-white text-gray-400 group-hover/copy:text-purple-600 shadow-sm border border-gray-100'}`}>
                                                {isCopied ? (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                ) : (
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" strokeWidth="2"></rect>
                                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" strokeWidth="2"></path>
                                                    </svg>
                                                )}
                                            </div>

                                            {/* Toast Notification */}
                                            {isCopied && (
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-3 py-1.5 rounded-full font-bold shadow-xl animate-bounce">
                                                    Copied!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Clone Modal - Styled */}
            {cloneModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Duplicate Design</h3>
                        <p className="text-sm text-gray-500 mb-6">Create a copy of <span className="font-semibold text-gray-700">{cloneModal.title}</span></p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">New Name</label>
                                <input
                                    type="text"
                                    value={cloneName}
                                    onChange={(e) => setCloneName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleClone()}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter name for copy..."
                                    autoFocus
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => { setCloneModal(null); setCloneName(''); }}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleClone}
                                    disabled={cloning || !cloneName.trim()}
                                    className={`px-5 py-2 text-sm font-bold text-white bg-purple-600 rounded-lg shadow hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all ${cloning ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                    {cloning ? 'Creating...' : 'Create Copy'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SavedShortcodesApp;
