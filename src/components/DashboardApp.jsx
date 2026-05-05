import React, { useState, useEffect } from 'react';
import VaultAssetCreator from './VaultAssetCreator';
import PremiumLockedOverlay from './PremiumLockedOverlay';
import LookInsideModal from './LookInsideModal';
import CsvImportModal from './CsvImportModal';

const getStockStatus = (asset) => asset.meta?._ss_vault_stock || asset.meta?._ss_vault_stock_status || 'instock';
const getStockLabel = (s) => ({ instock: 'In Stock', outofstock: 'Out of Stock', onbackorder: 'Low Stock' }[s] || 'In Stock');
const getStockClass = (s) => ({ instock: 'bg-green-50 text-green-700', outofstock: 'bg-red-50 text-red-600', onbackorder: 'bg-amber-50 text-amber-700' }[s] || 'bg-gray-50 text-gray-600');

const VaultStockBadge = ({ asset }) => {
    const s = getStockStatus(asset);
    return <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStockClass(s)}`}>{getStockLabel(s)}</span>;
};

const VaultCard = ({ asset, onQuickView, onEdit, onDuplicate, onCopyId, onDelete, onLookInside }) => (
    <div
        className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col relative cursor-pointer active:scale-[0.98]"
        onDoubleClick={() => onQuickView()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onQuickView(); } }}
    >
        <div className="aspect-[3/4] overflow-hidden bg-gray-50 relative">
            {asset._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                <img src={asset._embedded['wp:featuredmedia'][0].source_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={asset.title?.rendered} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📚</div>
            )}
            {asset.meta?._ss_vault_ribbon && (
                <div className="absolute top-2 left-0 bg-red-500 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 shadow-sm z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 90% 100%, 0 100%)' }}>{asset.meta._ss_vault_ribbon}</div>
            )}
            <button onClick={() => onQuickView()} className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-white/90 shadow-md flex items-center justify-center text-purple-600 hover:bg-purple-600 hover:text-white transition-all opacity-0 group-hover:opacity-100" title="Quick View">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
            </button>
        </div>
        <div className="p-3 flex-1 flex flex-col min-h-0">
            <h3 className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight">{asset.title?.rendered}</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate">{asset.meta?._ss_vault_author || '—'}</p>
            <div className="mt-1.5"><VaultStockBadge asset={asset} /></div>
            <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-600">{asset.meta?._ss_vault_price || 'Free'}</span>
                <div className="flex items-center gap-0.5 text-orange-400">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-[10px] font-bold text-gray-600">{asset.meta?._ss_vault_rating || '5.0'}</span>
                </div>
            </div>
        </div>
    </div>
);

const VaultListRow = ({ asset, onQuickView, onEdit, onDuplicate, onCopyId, onDelete, onLookInside }) => (
    <div
        className="flex items-center gap-4 p-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-purple-200"
        onDoubleClick={() => onQuickView()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onQuickView(); } }}
        role="button"
        tabIndex={0}
    >
        <div className="w-16 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
            {asset._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                <img src={asset._embedded['wp:featuredmedia'][0].source_url} className="w-full h-full object-cover" alt={asset.title?.rendered} />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📚</div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{asset.title?.rendered}</h3>
            <p className="text-xs text-gray-500 truncate">{asset.meta?._ss_vault_author || '—'}</p>
            <div className="flex items-center gap-2 mt-1">
                {asset.meta?._ss_vault_category && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-500 rounded">{asset.meta._ss_vault_category}</span>}
                <VaultStockBadge asset={asset} />
            </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-sm font-bold text-purple-600">{asset.meta?._ss_vault_price || 'Free'}</span>
            <div className="flex items-center gap-0.5 text-orange-400"><svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span className="text-xs font-bold text-gray-600">{asset.meta?._ss_vault_rating || '5.0'}</span></div>
            <button onClick={() => onQuickView()} className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center hover:bg-purple-100" title="Quick View"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" /></svg></button>
        </div>
    </div>
);

const DashboardApp = ({ initialTab = 'home' }) => {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
    const [vaultAssets, setVaultAssets] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [editAsset, setEditAsset] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [vaultViewMode, setVaultViewMode] = useState('grid'); // 'grid' | 'list'
    const [vaultCategoryFilter, setVaultCategoryFilter] = useState('');
    const [vaultStockFilter, setVaultStockFilter] = useState('');
    const [quickViewAsset, setQuickViewAsset] = useState(null);
    const [toast, setToast] = useState(null); // { message: '', type: 'success' | 'error' }
    // showChangelogModal removed — What's New lives at Settings → What's New tab
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [vaultLookInside, setVaultLookInside] = useState({ open: false, url: '', title: '', thumbnail: '', authors: '' });
    const [readerStyle, setReaderStyle] = useState(window.rmssAdminSettings?.pdf_reader_style || 'style-1');

    // Listen for settings updates from SettingsApp (cross-root communication via CustomEvent)
    useEffect(() => {
        const onSettingsUpdate = (e) => {
            if (e.detail?.pdf_reader_style) setReaderStyle(e.detail.pdf_reader_style);
        };
        window.addEventListener('shelfsage-settings-saved', onSettingsUpdate);
        return () => window.removeEventListener('shelfsage-settings-saved', onSettingsUpdate);
    }, []);

    const wpRestUrl = window.rmssAdminSettings?.wpRestUrl || '/wp-json/wp/v2';
    const ssApiUrl = window.rmssAdminSettings?.restUrl || '/wp-json/shelfsage/v1';
    const wpRestNonce = window.rmssAdminSettings?.nonce;

    // Sync active tab to URL parameter 'view'
    useEffect(() => {
        const url = new URL(window.location);
        const currentView = url.searchParams.get('view');
        if (currentView !== activeTab) {
            url.searchParams.set('view', activeTab);
            window.history.pushState({ path: url.toString() }, '', url.toString());
        }
    }, [activeTab]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Personalized greeting based on user's local time (updates every minute)
    const [greeting, setGreeting] = useState(() => {
        const hour = new Date().getHours();
        if (hour >= 0 && hour < 5)  return "Good Night";
        if (hour < 12)              return "Good Morning";
        if (hour < 17)              return "Good Afternoon";
        if (hour < 21)              return "Good Evening";
        return "Good Night";
    });
    useEffect(() => {
        const updateGreeting = () => {
            const hour = new Date().getHours();
            if (hour >= 0 && hour < 5)  setGreeting("Good Night");
            else if (hour < 12)         setGreeting("Good Morning");
            else if (hour < 17)         setGreeting("Good Afternoon");
            else if (hour < 21)         setGreeting("Good Evening");
            else                        setGreeting("Good Night");
        };
        const id = setInterval(updateGreeting, 60000); // every minute
        return () => clearInterval(id);
    }, []);

    // Fetch Vault Assets
    const fetchVaultAssets = async () => {
        setIsFetching(true);
        try {
            const response = await fetch(`${wpRestUrl}/ss_vault_assets?_embed&per_page=100`, {
                headers: { 'X-WP-Nonce': wpRestNonce }
            });
            if (response.ok) {
                const data = await response.json();
                setVaultAssets(data);
            }
        } catch (error) {
            console.error('Error fetching vault assets:', error);
        } finally {
            setIsFetching(false);
        }
    };

    React.useEffect(() => {
        if (activeTab === 'vault') {
            fetchVaultAssets();
        }
    }, [activeTab]);

    const handleDeleteAsset = async (id) => {
        if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) return;

        try {
            const wpRestUrl = window.rmssAdminSettings?.wpRestUrl || '/wp-json/wp/v2';
            const nonce = window.rmssAdminSettings?.nonce;
            const response = await fetch(`${wpRestUrl}/ss_vault_assets/${id}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': nonce }
            });
            if (response.ok) {
                setVaultAssets(prev => prev.filter(asset => asset.id !== id));
                showToast('Asset permanently deleted', 'success');
            }
        } catch (error) {
            console.error('Error deleting asset:', error);
        }
    };

    const handleDuplicateAsset = async (asset) => {
        try {
            const wpRestUrl = window.rmssAdminSettings?.wpRestUrl || '/wp-json/wp/v2';
            const nonce = window.rmssAdminSettings?.nonce;

            const response = await fetch(`${wpRestUrl}/ss_vault_assets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
                body: JSON.stringify({
                    title: `Copy of ${asset.title?.rendered || 'Asset'}`,
                    status: 'publish',
                    featured_media: asset.featured_media || 0,
                    meta: {
                        _ss_vault_subtitle: asset.meta?._ss_vault_subtitle || '',
                        _ss_vault_author: asset.meta?._ss_vault_author || '',
                        _ss_vault_publisher: asset.meta?._ss_vault_publisher || '',
                        _ss_vault_edition: asset.meta?._ss_vault_edition || '',
                        _ss_vault_pub_date: asset.meta?._ss_vault_pub_date || '',
                        _ss_vault_isbn: asset.meta?._ss_vault_isbn || '',
                        _ss_vault_pages: asset.meta?._ss_vault_pages || 0,
                        _ss_vault_price: asset.meta?._ss_vault_price || '',
                        _ss_vault_link: asset.meta?._ss_vault_link || '',
                        _ss_vault_rating: asset.meta?._ss_vault_rating || 5,
                        _ss_vault_button_text: asset.meta?._ss_vault_button_text || 'Buy Now',
                        _ss_vault_stock: asset.meta?._ss_vault_stock || asset.meta?._ss_vault_stock_status || 'instock',
                        _ss_vault_look_inside_url: asset.meta?._ss_vault_look_inside_url || '',
                    }
                })
            });

            if (response.ok) {
                showToast('Asset duplicated successfully!', 'success');
                fetchVaultAssets();
            } else {
                showToast('Failed to duplicate asset.', 'error');
            }
        } catch (error) {
            console.error('Error duplicating asset:', error);
            showToast('Error duplicating asset.', 'error');
        }
    };

    const handleCopyId = (id) => {
        navigator.clipboard.writeText(id.toString());
        showToast('Asset ID copied to clipboard!', 'success');
    };

    const openEditModal = (asset) => {
        setEditAsset(asset);
        setIsCreatorOpen(true);
    };

    const vaultCategories = [...new Set(vaultAssets.map(a => a.meta?._ss_vault_category).filter(Boolean))].sort();
    const filteredAssets = vaultAssets.filter(asset => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch = !q || 
            asset.title?.rendered?.toLowerCase().includes(q) ||
            asset.meta?._ss_vault_author?.toLowerCase().includes(q) ||
            asset.meta?._ss_vault_category?.toLowerCase().includes(q) ||
            asset.meta?._ss_vault_publisher?.toLowerCase().includes(q);
        const matchCat = !vaultCategoryFilter || (asset.meta?._ss_vault_category || '') === vaultCategoryFilter;
        const stockVal = asset.meta?._ss_vault_stock || asset.meta?._ss_vault_stock_status || 'instock';
        const matchStock = !vaultStockFilter || stockVal === vaultStockFilter;
        return matchSearch && matchCat && matchStock;
    });

    // Helper to get admin URL
    const getAdminUrl = (path) => {
        const adminBase = window.rmssAdminSettings?.adminUrl || 'admin.php';
        return `${adminBase}?page=${path}`;
    };

    const getTaxonomyUrl = (slug) => {
        const adminBase = window.rmssAdminSettings?.adminUrl || 'admin.php';
        const baseUrl = adminBase.replace('admin.php', 'edit-tags.php');
        return `${baseUrl}?taxonomy=${slug}&post_type=product`;
    };

    // Sidebar styles (Matched from SettingsApp/Architect)
    const sidebarBg = 'bg-[#1a0b2e]';
    const sidebarBorder = 'border-purple-900/50';
    const sidebarText = 'text-purple-200';
    const sidebarHoverBg = 'hover:bg-[#2d1b4e]/50';
    const sidebarActiveBg = 'bg-[#2d1b4e]';

    // Enriched Personalized Data from Backend
    const adminName = window.rmssAdminSettings?.adminName || 'Admin';
    const statsEnriched = window.rmssAdminSettings?.stats || {
        total_books: 0,
        total_vault: 0,
        total_shortcodes: 0,
        low_stock_count: 0,
        recent_activity: []
    };
    const analytics = window.rmssAdminSettings?.analytics || { mostViewed: [], searchTrends: [] };
    const apiStatus = window.rmssAdminSettings?.apiStatus || { googleBooks: false, amazonPA: false };
    const isPro = window.rmssAdminSettings?.isPro;

    const renderHome = () => {
        const googleStatus = apiStatus.googleBooks;
        const amazonStatus = apiStatus.amazonPA;
        const licenseActive = isPro;

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* ════════════════════════════════════════
                    ROW 1 — Welcome Header + License & API
                ════════════════════════════════════════ */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
                    {/* Left: Greeting */}
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-purple-200 flex-shrink-0">
                            📚
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {greeting}, <span className="text-purple-600">{adminName}!</span>
                            </h2>
                            <p className="text-sm text-gray-400 font-medium mt-0.5">Welcome back to your ShelfSage control center.</p>
                        </div>
                    </div>

                    {/* Center + Right: License badge + API status */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* License Badge — with pulsating Upgrade CTA + tooltip when inactive */}
                        <div className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 ${licenseActive ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${licenseActive ? 'bg-green-500' : 'bg-orange-400'}`}>
                                {licenseActive
                                    ? <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                    : <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                }
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">License</p>
                                <p className={`text-xs font-black ${licenseActive ? 'text-green-700' : 'text-orange-700'}`}>
                                    {licenseActive ? '✓ Pro Active' : '✗ Not Active'}
                                </p>
                            </div>
                            {/* Pulsating Upgrade text for inactive license — tooltip on hover */}
                            {!licenseActive && (
                                <div className="relative group/tooltip ml-1">
                                    <a
                                        href="https://shelfsage.com/pro"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block text-[9px] font-black text-purple-600 animate-pulse bg-purple-100/80 hover:bg-purple-200 px-2 py-0.5 rounded-full uppercase tracking-widest transition-all cursor-pointer"
                                        title="Unlock Auto-Ingest, Vault storage, and Premium Templates"
                                    >
                                        Upgrade
                                    </a>
                                    {/* Tooltip on hover */}
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-900 text-white text-[10px] font-medium px-3 py-2 rounded-xl shadow-2xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 pointer-events-none z-[100] text-center leading-snug">
                                        Unlock Auto-Ingest, Vault storage, and Premium Templates
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-10 bg-gray-100"></div>

                        {/* API Status Pills — clickable when Offline/Not Set */}
                        <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${googleStatus ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-red-400 animate-pulse'}`}></span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Google Books</span>
                                {googleStatus ? (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-50 text-green-600">Online</span>
                                ) : (
                                    <a
                                        href={`${getAdminUrl('shelfsage-settings')}&tab=connect_data`}
                                        title="Configure Google Books API key in Settings"
                                        className="text-[9px] font-black px-1.5 py-0.5 rounded bg-red-50 text-red-500 hover:bg-red-100 hover:underline cursor-pointer transition-colors"
                                    >
                                        Offline ↗
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${amazonStatus ? 'bg-green-500 shadow-[0_0_6px_#22c55e]' : 'bg-gray-300'}`}></span>
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Amazon PA-API</span>
                                {amazonStatus ? (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-green-50 text-green-600">Online</span>
                                ) : (
                                    <a
                                        href={`${getAdminUrl('shelfsage-settings')}&tab=connect_data`}
                                        title="Add Amazon PA-API credentials in Settings"
                                        className="text-[9px] font-black px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:underline cursor-pointer transition-colors"
                                    >
                                        Not Set ↗
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════════════
                    ROW 2 — 4 Quick Launch Cards
                ════════════════════════════════════════ */}
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4 pl-1">Quick Launch</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: 'Shortcode Creator',
                                desc: 'Build & customize book displays',
                                href: getAdminUrl('shelfsage-architect'),
                                color: 'from-purple-500 to-indigo-600',
                                glow: 'shadow-purple-200',
                                icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
                            },
                            {
                                label: 'Book Vault',
                                desc: 'Manage premium book assets',
                                onClick: () => setActiveTab('vault'),
                                color: 'from-violet-500 to-purple-600',
                                glow: 'shadow-violet-200',
                                icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>,
                            },
                            {
                                label: 'Settings',
                                desc: 'API keys, display & integrations',
                                href: getAdminUrl('shelfsage-settings'),
                                color: 'from-slate-600 to-gray-800',
                                glow: 'shadow-gray-200',
                                icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
                            },
                            {
                                label: 'Documentation',
                                desc: 'Guides, shortcodes & FAQs',
                                href: 'https://shelfsage.com/docs',
                                target: '_blank',
                                color: 'from-blue-500 to-cyan-500',
                                glow: 'shadow-blue-200',
                                icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
                            },
                        ].map((card, idx) => {
                            const Tag = card.href ? 'a' : 'button';
                            const tagProps = card.href ? { href: card.href, target: card.target || '_self' } : { onClick: card.onClick, type: 'button' };
                            return (
                                <Tag key={idx} {...tagProps} className="group bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 text-left w-full block">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-2xl flex items-center justify-center mb-4 shadow-lg ${card.glow} group-hover:scale-110 transition-transform duration-200`}>
                                        {card.icon}
                                    </div>
                                    <h4 className="font-black text-gray-900 text-sm mb-1 tracking-tight">{card.label}</h4>
                                    <p className="text-[11px] text-gray-400 font-medium leading-snug">{card.desc}</p>
                                </Tag>
                            );
                        })}
                    </div>

                    {/* ── Mini Stats Row (slim) ── */}
                    <div className="mt-4 grid grid-cols-3 gap-2">
                        {[
                            { label: 'Total Books in Vault', value: statsEnriched.total_vault ?? 0, icon: '🔐', color: 'text-violet-600' },
                            { label: 'Active Shortcodes', value: statsEnriched.total_shortcodes ?? 0, icon: '⚡', color: 'text-purple-600' },
                            { label: 'API Requests Today', value: statsEnriched.api_requests_today != null ? `${statsEnriched.api_requests_today} / 1,000` : '— / 1,000', icon: '📡', color: 'text-blue-600' },
                        ].map((stat, idx) => (
                            <div key={idx} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-sm">
                                <span className="text-base leading-none">{stat.icon}</span>
                                <div className="min-w-0">
                                    <p className={`text-xs font-black ${stat.color}`}>{stat.value}</p>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-wider truncate">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ════════════════════════════════════════
                    ROW 3 — Pro Power Section
                ════════════════════════════════════════ */}
                <div>
                    <div className="flex items-center justify-between mb-4 pl-1">
                        <div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em]">Pro Power Features</h3>
                            {!isPro && <p className="text-[10px] text-orange-500 font-bold mt-0.5">Activate ShelfSage Pro to unlock all features below</p>}
                        </div>
                        {!isPro && (
                            <a href="https://shelfsage.com/pro" target="_blank" className="text-[10px] font-black uppercase tracking-widest text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-all">
                                Upgrade →
                            </a>
                        )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[
                            {
                                icon: '🔐',
                                title: 'ShelfSage Vault',
                                subtitle: 'Premium Asset Manager',
                                desc: 'Store custom book assets with rich metadata — completely independent of WooCommerce. Create unique book collections and manage them via shortcode.',
                                badge: 'Storage',
                                iconBg: 'from-violet-600 to-purple-700',
                                glowColor: 'rgba(139,92,246,0.35)',
                                onClick: () => setActiveTab('vault'),
                            },
                            {
                                icon: '✨',
                                title: 'Smart Auto-Ingest',
                                subtitle: 'ISBN Metadata Engine',
                                desc: 'Enter any ISBN or book title and instantly pull cover art, author, description, and pricing from Google Books. Zero manual entry.',
                                badge: 'Automation',
                                iconBg: 'from-blue-600 to-indigo-600',
                                glowColor: 'rgba(99,102,241,0.35)',
                                onClick: () => window.open(getAdminUrl('shelfsage-architect'), '_self'),
                            },
                            {
                                icon: '🔗',
                                title: 'Affiliate Link Engine',
                                subtitle: 'Amazon PA-API v5',
                                desc: 'Connect your Amazon Associates account to automatically inject affiliate links and display live pricing on all your book showcases.',
                                badge: 'Monetize',
                                iconBg: 'from-orange-500 to-red-500',
                                glowColor: 'rgba(249,115,22,0.35)',
                                onClick: () => window.open(getAdminUrl('shelfsage-settings'), '_self'),
                            },
                        ].map((feature, idx) => (
                            <div
                                key={idx}
                                className={`relative rounded-3xl border overflow-hidden transition-all duration-300 group
                                    ${isPro
                                        ? 'bg-white border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                        : 'bg-white border-purple-100 shadow-sm cursor-pointer'
                                    }`}
                                onClick={isPro ? feature.onClick : undefined}
                            >
                                {/* Hover overlay for free users — soft blur + gold-to-purple CTA */}
                                {!isPro && (
                                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/20 backdrop-blur-md rounded-3xl">
                                        <a
                                            href="https://shelfsage.com/pro"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={e => e.stopPropagation()}
                                            className="flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm text-white shadow-2xl transition-all hover:scale-105 border border-white/20"
                                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 25%, #7c3aed 75%, #8b5cf6 100%)' }}
                                        >
                                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                            Learn More &amp; Upgrade
                                        </a>
                                    </div>
                                )}

                                <div className={`p-6 transition-all duration-300 ${!isPro ? 'group-hover:blur-sm group-hover:opacity-60' : ''}`}>
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        {/* Icon with subtle gradient glow */}
                                        <div className="relative">
                                            <div
                                                className="absolute -inset-2 rounded-3xl blur-xl opacity-60 scale-110"
                                                style={{ background: `radial-gradient(circle at 50% 50%, ${feature.glowColor} 0%, transparent 65%)` }}
                                            />
                                            <div
                                                className="absolute -inset-1 rounded-2xl blur-sm opacity-80"
                                                style={{ background: `linear-gradient(135deg, ${feature.glowColor} 0%, transparent 50%)` }}
                                            />
                                            <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/50`}>
                                                {feature.icon}
                                            </div>
                                        </div>
                                        {/* PRO badge — Architect style with Star */}
                                        {!isPro && (
                                            <div className="flex items-center gap-1 bg-yellow-500 text-black text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-widest shadow-md border border-amber-600/20">
                                                <svg className="w-2.5 h-2.5 fill-current flex-shrink-0" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                PRO
                                            </div>
                                        )}
                                        {/* Badge type label for Pro users */}
                                        {isPro && (
                                            <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg bg-gray-50 text-gray-400 border border-gray-100">{feature.badge}</span>
                                        )}
                                    </div>

                                    <h4 className="font-black text-gray-900 text-sm tracking-tight">{feature.title}</h4>
                                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-2">{feature.subtitle}</p>
                                    <p className="text-[11px] text-gray-500 leading-relaxed">{feature.desc}</p>

                                    {/* CTA row */}
                                    {isPro ? (
                                        <div className="mt-4 flex items-center gap-1 text-[10px] font-black text-purple-600 group-hover:text-purple-700">
                                            Open Feature
                                            <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    ) : (
                                        <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                                            {/* Modern sleek lock — premium feel */}
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span>Requires Pro license</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ════════════════════════════════════════
                    ROW 4 — Explore Our Tools
                ════════════════════════════════════════ */}
                <div>
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.25em] mb-4 pl-1">Explore Our Tools</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {/* ShelfSage Free — with social proof */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">📚</div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h5 className="text-xs font-black text-gray-900 truncate">ShelfSage Free</h5>
                                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-green-50 text-green-600 flex-shrink-0">Installed</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight">Core book display plugin</p>
                                </div>
                            </div>
                            {/* Social proof — honest messaging until install base grows */}
                            <div className="flex items-center gap-2 mt-1.5 pl-0.5">
                                <div className="flex text-amber-400" aria-label="5 out of 5 stars">
                                    {[1, 2, 3, 4, 5].map(i => (
                                        <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                    ))}
                                </div>
                                <span className="text-[9px] font-bold text-gray-500">Growing Community</span>
                            </div>
                        </div>

                        {/* ShelfSage Pro */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">⭐</div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="text-xs font-black text-gray-900 truncate">ShelfSage Pro</h5>
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full flex-shrink-0 ${isPro ? 'bg-purple-50 text-purple-600' : 'bg-orange-50 text-orange-600'}`}>{isPro ? 'Active' : 'Upgrade'}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight truncate">Advanced features &amp; vault</p>
                            </div>
                        </div>

                        {/* Coming soon tools */}
                        {[
                            { icon: '📊', name: 'Analytics Add-on', desc: 'Book click & sales tracking' },
                            { icon: '🤖', name: 'AI Recommendations', desc: 'Smart book suggestions' },
                        ].map((tool, idx) => (
                            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-sm opacity-70">
                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">{tool.icon}</div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h5 className="text-xs font-black text-gray-900 truncate">{tool.name}</h5>
                                        <span className="text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gray-50 text-gray-400 flex-shrink-0">Soon</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-medium mt-0.5 leading-tight truncate">{tool.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ════════════════════════════════════════
                    FOOTER — Links + What's New
                ════════════════════════════════════════ */}
                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* What's New snippet */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest">Latest</span>
                                <a
                                    href={`${getAdminUrl('shelfsage-settings')}&tab=whats_new`}
                                    className="text-[9px] font-medium text-gray-500 hover:text-purple-600 underline decoration-dotted decoration-purple-400/50 transition-colors"
                                >
                                    What&apos;s New
                                </a>
                            </div>
                            <p className="text-[11px] text-gray-600 font-medium">Features, fixes &amp; usage guides</p>
                        </div>
                    </div>

                    {/* Footer Links */}
                    <div className="flex items-center gap-6">
                        <a href="https://community.shelfsage.com" target="_blank" className="text-[10px] font-black text-gray-400 hover:text-purple-600 uppercase tracking-wider transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Community
                        </a>
                        <a href="https://shelfsage.com/support" target="_blank" className="text-[10px] font-black text-gray-400 hover:text-purple-600 uppercase tracking-wider transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            Support
                        </a>
                        <a href="https://shelfsage.com/changelog" target="_blank" className="text-[10px] font-black text-gray-400 hover:text-purple-600 uppercase tracking-wider transition-colors flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            Changelog
                        </a>
                    </div>
                </div>

            </div>
        );
    };

    const renderInsights = () => {
        const mostViewed = analytics.mostViewed || [];
        const searchTrends = analytics.searchTrends || [];
        const totalViews = mostViewed.reduce((sum, item) => sum + (Number(item.views) || 0), 0);
        const totalSearches = searchTrends.reduce((sum, item) => sum + (Number(item.count) || 0), 0);
        const topSearchCount = Math.max(1, ...searchTrends.map(item => Number(item.count) || 0));

        return (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                <div className="bg-white rounded-[32px] p-8 border border-gray-100 shadow-sm">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.25em] mb-2">Analytics Dashboard</p>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Most Viewed Books & Search Trends</h2>
                            <p className="text-sm text-gray-500 font-medium mt-2 max-w-2xl">Track which books readers open most and what they search for inside ShelfSage-powered book discovery.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 min-w-[280px]">
                            <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest">Tracked Views</p>
                                <p className="text-2xl font-black text-purple-900 mt-1">{totalViews}</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                                <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Tracked Searches</p>
                                <p className="text-2xl font-black text-blue-900 mt-1">{totalSearches}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Most Viewed</h3>
                                <p className="text-xs text-gray-400 font-medium mt-1">Ranked by product page visits.</p>
                            </div>
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 uppercase tracking-widest">Live</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {mostViewed.length > 0 ? mostViewed.map((book, idx) => (
                                <a key={book.id || idx} href={book.editUrl || book.url || '#'} className="flex items-center gap-4 p-3 rounded-2xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/40 transition-all group">
                                    <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center text-xs font-black flex-shrink-0">#{idx + 1}</div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-gray-900 truncate group-hover:text-purple-700">{book.title || 'Untitled Book'}</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product ID: {book.id}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-black text-purple-600">{book.views || 0}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Views</p>
                                    </div>
                                </a>
                            )) : (
                                <div className="text-center py-12 px-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 mx-auto mb-3 flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7z" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">No product views tracked yet.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">Search Trends</h3>
                                <p className="text-xs text-gray-400 font-medium mt-1">Top terms from ShelfSage search requests.</p>
                            </div>
                            <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 uppercase tracking-widest">Terms</span>
                        </div>
                        <div className="p-4 space-y-3">
                            {searchTrends.length > 0 ? searchTrends.map((trend, idx) => {
                                const width = `${Math.max(12, Math.round(((Number(trend.count) || 0) / topSearchCount) * 100))}%`;
                                return (
                                    <div key={`${trend.term}-${idx}`} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50">
                                        <div className="flex items-center justify-between gap-3 mb-2">
                                            <p className="text-sm font-black text-gray-900 truncate">{trend.term}</p>
                                            <span className="text-xs font-black text-blue-600 flex-shrink-0">{trend.count || 0} searches</span>
                                        </div>
                                        <div className="h-2 rounded-full bg-white overflow-hidden border border-gray-100">
                                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width }}></div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-12 px-4">
                                    <div className="w-12 h-12 rounded-2xl bg-gray-50 mx-auto mb-3 flex items-center justify-center text-gray-400">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                    <p className="text-sm font-bold text-gray-500">No search trends tracked yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    const renderOverview = () => {
        const totalAssets = (statsEnriched.total_books || 0) + (statsEnriched.total_vault || 0);
        const googleStatus = apiStatus.googleBooks;
        const amazonStatus = apiStatus.amazonPA;
        const isApiHealthy = googleStatus || amazonStatus;

        return (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
                {/* Hero Greeting Section */}
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">
                            {greeting}, <span className="text-purple-600">{adminName}!</span>
                        </h2>
                        <p className="text-gray-500 font-medium italic">Your bookstore is thriving today.</p>
                    </div>

                    {/* Setup Completion Bar - Extracted from Screenshot */}
                    <div className="bg-white/50 p-4 rounded-2xl border border-gray-100 min-w-[280px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Setup Completion</span>
                            <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">85%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full" style={{ width: '85%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Insights Row: 3 Stats + Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Total Books */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-6 right-6 px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md">Warehouse</div>
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <h4 className="text-3xl font-black text-gray-900 mb-1">{statsEnriched.total_books || 0}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Books</p>
                    </div>

                    {/* Active Shortcodes */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-6 right-6 px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-md">Live</div>
                        <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <h4 className="text-3xl font-black text-gray-900 mb-1">{statsEnriched.total_shortcodes || 0}</h4>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Shortcodes</p>
                    </div>

                    {/* Low Stock Items */}
                    <div className="bg-orange-50/50 p-6 rounded-[32px] border border-orange-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-6 right-6 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-md">Urgent</div>
                        <div className="w-12 h-12 bg-orange-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-orange-500/20">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h4 className="text-3xl font-black text-gray-900 mb-1">{statsEnriched.low_stock_count || 0}</h4>
                        <p className="text-xs font-bold text-orange-600/60 uppercase tracking-widest">Low Stock Items</p>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Activity</h5>
                            <button className="text-gray-300 hover:text-purple-600 transition-colors">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                            </button>
                        </div>
                        <div className="space-y-4">
                            {(statsEnriched.recent_activity || []).length > 0 ? statsEnriched.recent_activity.map((item, idx) => (
                                <div key={idx} className="flex flex-col">
                                    <span className="text-[11px] font-extrabold text-gray-800 line-clamp-1 truncate">• {item.title}</span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter mt-0.5">{item.type} • {item.time}</span>
                                </div>
                            )) : (
                                <p className="text-[10px] text-gray-400 italic">No recent activity detected.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Navigation Tiles - The Big Four */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Create Design */}
                    <a href={getAdminUrl('shelfsage-architect')} className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="w-14 h-14 bg-purple-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2">Create Design</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Launch our powerful Shortcode Creator for your next showcase.</p>
                    </a>

                    {/* Inventory Control */}
                    <button onClick={() => setActiveTab('inventory')} className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                        <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2">Inventory Control</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Manage stock levels, sources, and status for all your assets.</p>
                    </button>

                    {/* Design Library */}
                    <a href={getAdminUrl('shelfsage-saved-designs')} className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                        <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-2">Design Library</h4>
                        <p className="text-xs text-gray-500 leading-relaxed font-medium">Review and manage your collection of saved shortcode designs.</p>
                    </a>

                    {/* API Connectivity Status Card */}
                    <div className="bg-white p-8 rounded-[40px] border border-gray-50 shadow-sm relative group overflow-hidden">
                        <div className="w-14 h-14 bg-gray-900 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                        </div>
                        <h4 className="text-xl font-black text-gray-900 mb-4">API Connectivity</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Google Books</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${googleStatus ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{googleStatus ? 'Online' : 'Offline'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amazon PA-API</span>
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${amazonStatus ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{amazonStatus ? 'Online' : 'Offline'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Simple Horizontal Footer Links */}
                <div className="flex items-center justify-center gap-12 pt-10 border-t border-gray-100 opacity-80">
                    <a href="https://shelfsage.com/docs" target="_blank" className="text-[10px] font-black text-gray-400 hover:text-purple-600 uppercase tracking-[0.2em] transition-colors">Documentation</a>
                    <a href="https://community.shelfsage.com" target="_blank" className="text-[10px] font-black text-gray-400 hover:text-purple-600 uppercase tracking-[0.2em] transition-colors">Join Community</a>
                    <a href="https://shelfsage.com/support" target="_blank" className="text-[10px] font-black text-gray-400 hover:text-purple-600 uppercase tracking-[0.2em] transition-colors">Priority Support</a>
                </div>
            </div>
        );
    };

    return (
        <>
        <LookInsideModal
            isOpen={vaultLookInside.open}
            onClose={() => setVaultLookInside(prev => ({ ...prev, open: false }))}
            url={vaultLookInside.url}
            title={vaultLookInside.title}
            thumbnail={vaultLookInside.thumbnail}
            authors={vaultLookInside.authors}
            readerStyle={readerStyle}
        />

        {/* Quick View Modal */}
        {quickViewAsset && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }} onClick={() => setQuickViewAsset(null)}>
                <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col sm:flex-row">
                        <div className="w-full sm:w-40 flex-shrink-0 aspect-[3/4] sm:aspect-auto sm:h-72 bg-gray-100">
                            {quickViewAsset._embedded?.['wp:featuredmedia']?.[0]?.source_url ? (
                                <img src={quickViewAsset._embedded['wp:featuredmedia'][0].source_url} className="w-full h-full object-cover" alt={quickViewAsset.title?.rendered} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">📚</div>
                            )}
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto max-h-[70vh]">
                            <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-lg font-bold text-gray-900 leading-tight">{quickViewAsset.title?.rendered}</h3>
                                <button onClick={() => setQuickViewAsset(null)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 flex-shrink-0"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
                            </div>
                            <p className="text-sm text-gray-500 mb-3">{quickViewAsset.meta?._ss_vault_author || '—'}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {quickViewAsset.meta?._ss_vault_category && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-purple-50 text-purple-600 rounded">{quickViewAsset.meta._ss_vault_category}</span>}
                                {quickViewAsset.meta?._ss_vault_edition && <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-gray-100 text-gray-600 rounded">{quickViewAsset.meta._ss_vault_edition}</span>}
                                <VaultStockBadge asset={quickViewAsset} />
                            </div>
                            <div className="flex items-center gap-4 mb-4">
                                <span className="text-lg font-bold text-purple-600">{quickViewAsset.meta?._ss_vault_price || 'Free'}</span>
                                <div className="flex items-center gap-1 text-orange-400"><svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg><span className="text-sm font-bold text-gray-700">{quickViewAsset.meta?._ss_vault_rating || '5.0'}</span></div>
                            </div>
                            {quickViewAsset.excerpt?.rendered && <div className="text-sm text-gray-600 mb-4 line-clamp-4" dangerouslySetInnerHTML={{ __html: quickViewAsset.excerpt.rendered }} />}
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => { openEditModal(quickViewAsset); setQuickViewAsset(null); }} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Edit</button>
                                <button onClick={() => { handleDuplicateAsset(quickViewAsset); setQuickViewAsset(null); }} className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Duplicate</button>
                                <button onClick={() => { handleCopyId(quickViewAsset.id); }} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>Copy ID</button>
                                {quickViewAsset.meta?._ss_vault_look_inside_url && <button onClick={() => { setVaultLookInside({ open: true, url: quickViewAsset.meta._ss_vault_look_inside_url, title: quickViewAsset.title?.rendered || '', thumbnail: quickViewAsset._embedded?.['wp:featuredmedia']?.[0]?.source_url || '', authors: quickViewAsset.meta?._ss_vault_author || '' }); setQuickViewAsset(null); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7z" /></svg>Look Inside</button>}
                                <button onClick={() => { handleDeleteAsset(quickViewAsset.id); setQuickViewAsset(null); }} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans selection:bg-purple-100 selection:text-purple-900">
            {/* Mesh Gradient Background Layer */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-40">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-300 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute top-[20%] -right-[5%] w-[35%] h-[35%] bg-blue-200 rounded-full blur-[100px] animate-pulse duration-1000"></div>
                <div className="absolute bottom-[10%] left-[20%] w-[45%] h-[45%] bg-indigo-100 rounded-full blur-[150px] animate-pulse duration-700"></div>
            </div>

            {/* Top Header Bar - Exact Match to Screenshot */}
            <div className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200/50 flex items-center justify-between px-6 z-30 relative flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl drop-shadow-sm">📚</span>
                        <h1 className="text-lg font-black text-purple-600 tracking-tighter uppercase">SHEELFSAGE <span className="text-gray-900">CONTROL CENTER</span></h1>
                        <div className="flex items-center gap-2 ml-4">
                            {isPro && (
                                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-md tracking-widest uppercase shadow-sm">PRO ACTIVE</span>
                            )}
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">v1.0</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab === 'vault' ? (
                        <button
                            onClick={() => { setEditAsset(null); setIsCreatorOpen(true); }}
                            className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all text-xs flex items-center gap-2 shadow-lg shadow-gray-900/10"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            Add Vault Asset
                        </button>
                    ) : (
                        <a
                            href="post-new.php?post_type=product"
                            className="px-4 py-2 rounded-xl bg-gray-900 text-white font-bold hover:bg-black transition-all text-xs flex items-center gap-2 shadow-lg shadow-gray-900/10"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                            Quick Add Product
                        </a>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden z-10 relative">
                {/* Side Navigation - Royal Purple */}
                <div className={`w-64 ${sidebarBg} flex flex-col z-20 shadow-2xl relative flex-shrink-0 pt-8`}>
                    <nav className="flex-1 overflow-y-auto px-4 space-y-2">
                        {/* Home */}
                        <button
                            onClick={() => setActiveTab('home')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'home' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40 border border-purple-500' : 'text-purple-300 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            Home
                        </button>
                        {/* Insights */}
                        <button
                            onClick={() => setActiveTab('insights')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'insights' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40 border border-purple-500' : 'text-purple-300 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Insights
                        </button>
                        {/* Library Center — SPA: no full-page refresh */}
                        <button
                            onClick={() => setActiveTab('overview')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all text-left ${activeTab === 'overview' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40 border border-purple-500' : 'text-purple-300 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            Library Center
                        </button>
                        <button
                            onClick={() => setActiveTab('vault')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'vault' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40 border border-purple-500' : 'text-purple-300 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                            The Vault
                        </button>
                        <button
                            onClick={() => setActiveTab('inventory')}
                            className={`w-full flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl transition-all ${activeTab === 'inventory' ? 'bg-purple-600 text-white shadow-xl shadow-purple-900/40 border border-purple-500' : 'text-purple-300 hover:bg-white/5 hover:text-white'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            Inventory
                        </button>
                    </nav>

                    {/* Growth & Ecosystem — Mini Stats + What's New */}
                    <div className="px-4 pb-4 pt-2 border-t border-purple-900/30 mt-4">
                        <p className="text-[9px] font-black text-purple-400/80 uppercase tracking-[0.2em] mb-3 pl-1">Growth & Ecosystem</p>
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-purple-300/80">Vault</span>
                                <span className="font-black text-white">{statsEnriched.total_vault ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-purple-300/80">Shortcodes</span>
                                <span className="font-black text-white">{statsEnriched.total_shortcodes ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-purple-300/80">API Today</span>
                                <span className="font-black text-white">{statsEnriched.api_requests_today != null ? `${statsEnriched.api_requests_today}/1k` : '—'}</span>
                            </div>
                        </div>
                        <a
                            href={`${getAdminUrl('shelfsage-settings')}&tab=whats_new`}
                            className="w-full text-left text-[10px] font-bold text-purple-400 hover:text-white transition-colors flex items-center gap-1.5"
                        >
                            <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            What&apos;s New
                        </a>
                    </div>

                    <div className="p-4 pt-0">
                        <a href={getAdminUrl('shelfsage-settings')} className="flex items-center gap-3 px-5 py-3.5 text-xs font-black uppercase tracking-widest rounded-2xl text-purple-400 hover:bg-white/5 hover:text-white transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            Settings
                        </a>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto flex flex-col pt-10 pb-20 px-4 md:px-10">
                    <div className="max-w-6xl mx-auto w-full">
                        {activeTab === 'home' ? renderHome() : activeTab === 'insights' ? renderInsights() : activeTab === 'overview' ? renderOverview() : activeTab === 'vault' ? (
                            <PremiumLockedOverlay isPro={isPro} featureName="ShelfSage Vault" mode="replacement">
                                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="mb-6">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 mb-1">ShelfSage Vault</h2>
                                                <p className="text-sm text-gray-500">Manage premium book assets and custom collections.</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    onClick={() => setIsImportOpen(true)}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-xl text-sm font-bold hover:bg-purple-50 transition-all shadow-sm"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 4v12m0-12l-4 4m4-4l4 4" /></svg>
                                                    Import CSV/Excel
                                                </button>
                                                <button
                                                    onClick={() => { setEditAsset(null); setIsCreatorOpen(true); }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                    Add Asset
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ── Filter Bar: Prominent Search + Category + View Toggle ── */}
                                    <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-xl border border-gray-100 shadow-sm shadow-gray-200/50">
                                        <div className="flex-1 relative">
                                            <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            <input
                                                type="text"
                                                placeholder="Search by title, author, category..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none text-sm bg-gray-50/50 hover:bg-white transition-colors"
                                            />
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Category:</span>
                                            <button onClick={() => setVaultCategoryFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!vaultCategoryFilter ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                                            {vaultCategories.map(cat => (
                                                <button key={cat} onClick={() => setVaultCategoryFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vaultCategoryFilter === cat ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
                                            ))}
                                            <div className="h-6 w-px bg-gray-200 mx-1" />
                                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Stock:</span>
                                            <button onClick={() => setVaultStockFilter('')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${!vaultStockFilter ? 'bg-purple-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
                                            <button onClick={() => setVaultStockFilter('instock')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vaultStockFilter === 'instock' ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>In Stock</button>
                                            <button onClick={() => setVaultStockFilter('outofstock')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vaultStockFilter === 'outofstock' ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Out</button>
                                            <button onClick={() => setVaultStockFilter('onbackorder')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${vaultStockFilter === 'onbackorder' ? 'bg-amber-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Low</button>
                                            <div className="h-6 w-px bg-gray-200 mx-1" />
                                            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                                <button onClick={() => setVaultViewMode('grid')} className={`p-2 ${vaultViewMode === 'grid' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`} title="Grid view"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg></button>
                                                <button onClick={() => setVaultViewMode('list')} className={`p-2 ${vaultViewMode === 'list' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`} title="List view"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg></button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Result count + interactivity hint */}
                                    {!isFetching && vaultAssets.length > 0 && (
                                        <p className="text-xs text-gray-500 mb-3">
                                            Showing <span className="font-bold text-gray-700">{filteredAssets.length}</span> of {vaultAssets.length} assets
                                            {(searchQuery || vaultCategoryFilter || vaultStockFilter) && ' (filtered)'}
                                            <span className="ml-2 text-gray-400">· Double-click a card for Quick View</span>
                                        </p>
                                    )}

                                    {isFetching && vaultAssets.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                                            <svg className="animate-spin h-10 w-10 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            <p className="font-medium">Loading your library...</p>
                                        </div>
                                    ) : filteredAssets.length > 0 ? (
                                        vaultViewMode === 'grid' ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                                                {filteredAssets.map(asset => (
                                                    <VaultCard key={asset.id} asset={asset} onQuickView={() => setQuickViewAsset(asset)} onEdit={openEditModal} onDuplicate={handleDuplicateAsset} onCopyId={handleCopyId} onDelete={handleDeleteAsset} onLookInside={(a) => setVaultLookInside({ open: true, url: a.meta?._ss_vault_look_inside_url, title: a.title?.rendered || '', thumbnail: a._embedded?.['wp:featuredmedia']?.[0]?.source_url || '', authors: a.meta?._ss_vault_author || '' })} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {filteredAssets.map(asset => (
                                                    <VaultListRow key={asset.id} asset={asset} onQuickView={() => setQuickViewAsset(asset)} onEdit={openEditModal} onDuplicate={handleDuplicateAsset} onCopyId={handleCopyId} onDelete={handleDeleteAsset} onLookInside={(a) => setVaultLookInside({ open: true, url: a.meta?._ss_vault_look_inside_url, title: a.title?.rendered || '', thumbnail: a._embedded?.['wp:featuredmedia']?.[0]?.source_url || '', authors: a.meta?._ss_vault_author || '' })} />
                                                ))}
                                            </div>
                                        )
                                    ) : (
                                        <div className="bg-white border border-gray-200 border-dashed rounded-2xl p-16 text-center shadow-sm max-w-2xl mx-auto">
                                            <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center text-6xl mx-auto mb-8 animate-pulse">
                                                🔒
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-4">{(searchQuery || vaultCategoryFilter || vaultStockFilter) ? 'No matching assets' : 'Your Vault is Empty'}</h3>
                                            <p className="text-gray-500 mb-8 text-lg">
                                                {(searchQuery || vaultCategoryFilter || vaultStockFilter)
                                                    ? `We couldn't find any assets matching your filters.`
                                                    : 'Start adding your custom book assets! These aren\'t in your store but can be unlocked through special shortcodes.'}
                                            </p>
                                            <button
                                                onClick={() => { if (searchQuery || vaultCategoryFilter || vaultStockFilter) { setSearchQuery(''); setVaultCategoryFilter(''); setVaultStockFilter(''); } else { setEditAsset(null); setIsCreatorOpen(true); } }}
                                                className="px-12 py-4 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 shadow-xl shadow-purple-200 transition-all transform hover:-translate-y-1"
                                            >
                                                {(searchQuery || vaultCategoryFilter || vaultStockFilter) ? 'Clear Filters' : '+ Add Your First Asset'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </PremiumLockedOverlay>
                        ) : activeTab === 'wc-manager' ? (
                            <WCManagerView
                                wpRestUrl={wpRestUrl}
                                ssApiUrl={ssApiUrl}
                                wpRestNonce={wpRestNonce}
                                showToast={showToast}
                                refreshVault={fetchVaultAssets}
                            />
                        ) : activeTab === 'inventory' ? (
                            <PremiumLockedOverlay isPro={isPro} featureName="Pro Inventory Management" mode="replacement">
                                <InventoryDashboardView
                                    wpRestUrl={wpRestUrl}
                                    ssApiUrl={ssApiUrl}
                                    wpRestNonce={wpRestNonce}
                                    showToast={showToast}
                                />
                            </PremiumLockedOverlay>
                        ) : null}
                    </div>
                </main>
            </div>

            {/* Modals */}
            <VaultAssetCreator
                isOpen={isCreatorOpen}
                editData={editAsset}
                onClose={() => { setIsCreatorOpen(false); setEditAsset(null); }}
                onSave={(message) => {
                    fetchVaultAssets();
                    setEditAsset(null);
                    showToast(message || 'Asset saved successfully');
                }}
            />

            <CsvImportModal
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                apiUrl={ssApiUrl}
                nonce={wpRestNonce}
                onImportComplete={(count, target) => {
                    fetchVaultAssets();
                    showToast(`${count} books imported to ${target === 'woocommerce' ? 'WooCommerce' : 'Vault'} successfully`);
                }}
            />

            {/* ── Changelog Modal ── */}
            {/* Changelog modal removed — What's New now lives at Settings → What's New tab */}

            {/* Toast Notification */}
            {
                toast && (
                    <div className={`fixed bottom-8 right-8 z-[200] px-6 py-3 rounded-xl shadow-2xl border flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-purple-100 text-purple-700'}`}>
                        {toast.type === 'success' ? (
                            <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        ) : (
                            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        )}
                        <span className="font-bold text-sm tracking-tight">{toast.message}</span>
                    </div>
                )
            }
        </div >
        </>
    );
};

/**
 * WC Manager View Component
 * Logic for fetching WC products and syncing to Vault will be added here.
 */
const WCManagerView = ({ wpRestUrl, ssApiUrl, wpRestNonce, showToast, refreshVault }) => {
    const [products, setProducts] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [syncingId, setSyncingId] = useState(null);

    const fetchProducts = async () => {
        setIsFetching(true);
        try {
            const response = await fetch(`${ssApiUrl}/products?search=${searchQuery}`, {
                headers: { 'X-WP-Nonce': wpRestNonce }
            });
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            showToast('Failed to fetch products', 'error');
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSync = async (productId) => {
        setSyncingId(productId);
        try {
            const response = await fetch(`${ssApiUrl}/sync-to-vault`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': wpRestNonce
                },
                body: JSON.stringify({ product_id: productId })
            });
            const data = await response.json();
            if (data.success) {
                showToast(data.message, 'success');
                if (refreshVault) refreshVault();
            } else {
                showToast(data.message || 'Sync failed', 'error');
            }
        } catch (error) {
            showToast('Sync request failed', 'error');
        } finally {
            setSyncingId(null);
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">WooCommerce Manager</h2>
                    <p className="text-gray-500">Sync products from your store directly to your <span className="text-purple-600 font-medium">ShelfSage Vault</span>.</p>
                </div>
                <div className="relative">
                    <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-4.35-4.35M16.65 11a5.65 5.65 0 11-11.3 0 5.65 5.65 0 0111.3 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none w-64 bg-white"
                    />
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Product</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Library Data</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isFetching ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-14 bg-gray-100 rounded-md"></div>
                                            <div className="space-y-2">
                                                <div className="h-4 w-40 bg-gray-100 rounded"></div>
                                                <div className="h-3 w-24 bg-gray-50 rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="h-4 w-20 bg-gray-50 rounded mx-auto"></div>
                                    </td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="h-9 w-28 bg-gray-100 rounded-lg ml-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : products.length > 0 ? (
                            products.map((product) => (
                                <tr key={product.id} className="hover:bg-purple-50/30 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <img draggable="false" className="w-10 h-14 object-cover rounded-md shadow-sm bg-gray-50" src={product.thumbnail} alt="" />
                                            <div>
                                                <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{product.title}</h4>
                                                <p className="text-xs text-gray-500">{product.author || 'No Author Set'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">ISBN</span>
                                            <code className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600 font-mono">
                                                {product.isbn || '0000000000'}
                                            </code>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-sm font-bold text-purple-600" dangerouslySetInnerHTML={{ __html: product.price }}></span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleSync(product.id)}
                                            disabled={syncingId === product.id}
                                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ml-auto ${syncingId === product.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-100 hover:shadow-purple-200'}`}
                                        >
                                            {syncingId === product.id ? (
                                                <>
                                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                    Syncing...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 12l-3-3m3 3l3-3M3 16h18" /></svg>
                                                    Sync to Vault
                                                </>
                                            )}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-20 text-center">
                                    <div className="text-4xl mb-4">🛒</div>
                                    <h3 className="text-lg font-bold text-gray-900">No products found</h3>
                                    <p className="text-gray-500">We couldn't find any WooCommerce products matching your search.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

/**
 * Inventory Dashboard View Component
 * Unified table for WC & Vault assets.
 */
const InventoryDashboardView = ({ wpRestUrl, ssApiUrl, wpRestNonce, showToast }) => {
    const [items, setItems] = useState([]);
    const [isFetching, setIsFetching] = useState(true);
    const [editingId, setEditingId] = useState(null); // { id, source }
    const [editValue, setEditValue] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    // Advanced Filters State
    const [searchQuery, setSearchQuery] = useState('');
    const [filterSource, setFilterSource] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchData = async () => {
        setIsFetching(true);
        try {
            // Fetch both WC products and Vault assets
            const [wcRes, vaultRes] = await Promise.all([
                fetch(`${ssApiUrl}/products`, { headers: { 'X-WP-Nonce': wpRestNonce } }),
                fetch(`${wpRestUrl}/ss_vault_assets?_embed&per_page=100`, { headers: { 'X-WP-Nonce': wpRestNonce } })
            ]);

            const wcData = await wcRes.json();
            const vaultData = await vaultRes.json();

            // Normalize and merge
            const normalizedWc = wcData.map(p => ({
                id: p.id,
                title: p.title,
                thumbnail: p.thumbnail,
                stock: p.stock_quantity || 0,
                status: p.stock_status || 'instock',
                source: 'wc'
            }));

            const normalizedVault = vaultData.map(v => ({
                id: v.id,
                title: v.title?.rendered || 'Untitled',
                thumbnail: v._embedded?.['wp:featuredmedia']?.[0]?.source_url || '',
                stock: parseInt(v.meta?._ss_vault_stock_quantity || 0),
                status: v.meta?._ss_vault_stock_status || 'instock',
                source: 'vault'
            }));

            setItems([...normalizedWc, ...normalizedVault]);
        } catch (error) {
            showToast('Failed to load inventory data', 'error');
        } finally {
            setIsFetching(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Filter Logic
    const filteredItems = items.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSource = filterSource === 'all' || item.source === filterSource;
        const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
        return matchesSearch && matchesSource && matchesStatus;
    });

    // CSV Export Logic
    const handleExportCSV = () => {
        const headers = ['Title', 'Source', 'Stock', 'Status'];
        const rows = filteredItems.map(item => [
            `"${item.title.replace(/"/g, '""')}"`,
            item.source === 'wc' ? 'WooCommerce' : 'Vault',
            item.stock,
            item.status
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `shelfsage-inventory-export-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Inventory exported to CSV', 'success');
    };

    const stats = {
        total: items.length,
        lowStock: items.filter(i => i.stock > 0 && i.stock < 5).length,
        outOfStock: items.filter(i => i.stock === 0).length
    };

    const handleUpdateStock = async (id, source) => {
        setIsSaving(true);
        try {
            // Determine status based on quantity
            let newStatus = 'instock';
            if (editValue <= 0) newStatus = 'outofstock';
            else if (editValue <= 5) newStatus = 'onbackorder'; // Or low stock logic

            const response = await fetch(`${ssApiUrl}/update-stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': wpRestNonce
                },
                body: JSON.stringify({
                    id: id,
                    source: source,
                    quantity: editValue,
                    status: newStatus
                })
            });

            const data = await response.json();
            if (data.success) {
                showToast('Stock updated successfully', 'success');
                setItems(prev => prev.map(item =>
                    (item.id === id && item.source === source)
                        ? { ...item, stock: editValue, status: newStatus }
                        : item
                ));
                setEditingId(null);
            } else {
                showToast(data.message || 'Update failed', 'error');
            }
        } catch (error) {
            showToast('Update request failed', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'instock': return 'bg-green-100 text-green-700 border-green-200';
            case 'outofstock': return 'bg-red-100 text-red-700 border-red-200';
            case 'onbackorder': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Pro Inventory Dashboard</h2>
                    <p className="text-gray-500">Monitor and manage stock levels across all your <span className="text-purple-600 font-medium">ShelfSage</span> assets.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Refresh Data"
                >
                    <svg className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                        </div>
                        <span className="text-gray-500 font-medium">Total Books</span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                        </div>
                        <span className="text-gray-500 font-medium">Low Stock</span>
                    </div>
                    <div className="text-3xl font-bold text-orange-600">{stats.lowStock}</div>
                </div>
                <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        </div>
                        <span className="text-gray-500 font-medium">Out of Stock</span>
                    </div>
                    <div className="text-3xl font-bold text-red-600">{stats.outOfStock}</div>
                </div>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <select
                        value={filterSource}
                        onChange={(e) => setFilterSource(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                    >
                        <option value="all">All Sources</option>
                        <option value="wc">WooCommerce</option>
                        <option value="vault">Vault</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium"
                    >
                        <option value="all">All Status</option>
                        <option value="instock">In Stock</option>
                        <option value="onbackorder">Low Stock</option>
                        <option value="outofstock">Out of Stock</option>
                    </select>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-lg shadow-gray-200"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Asset</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Stock Level</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>
                            <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Quick Update</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isFetching && items.length === 0 ? (
                            [1, 2, 3, 4, 5].map((i) => (
                                <tr key={i} className="animate-pulse">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg"></div>
                                            <div className="h-4 w-32 bg-gray-100 rounded"></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-50 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-100 rounded"></div></td>
                                    <td className="px-6 py-4"><div className="h-5 w-20 bg-gray-50 rounded-full"></div></td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="h-8 w-24 bg-gray-100 rounded-lg ml-auto"></div>
                                    </td>
                                </tr>
                            ))
                        ) : filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <tr key={`${item.source}-${item.id}`} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            {item.thumbnail ? (
                                                <img draggable="false" className="w-10 h-10 object-cover rounded-lg shadow-sm" src={item.thumbnail} alt="" />
                                            ) : (
                                                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-400 text-xs font-bold">
                                                    {item.title.charAt(0)}
                                                </div>
                                            )}
                                            <span className="font-medium text-gray-900 text-sm line-clamp-1">{item.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.source === 'wc' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                                            {item.source === 'wc' ? 'WooCommerce' : 'Vault'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {editingId?.id === item.id && editingId?.source === item.source ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <input
                                                    type="number"
                                                    autoFocus
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleUpdateStock(item.id, item.source);
                                                        if (e.key === 'Escape') setEditingId(null);
                                                    }}
                                                    className="w-20 px-2 py-1 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm font-bold text-center"
                                                />
                                                <button
                                                    onClick={() => handleUpdateStock(item.id, item.source)}
                                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    title="Save"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                onClick={() => { setEditingId({ id: item.id, source: item.source }); setEditValue(item.stock); }}
                                                className="text-sm font-bold text-gray-700 cursor-pointer hover:text-purple-600 hover:scale-110 transition-all"
                                                title="Click to edit stock"
                                            >
                                                {item.stock}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-colors ${getStatusStyle(item.status)}`}>
                                            {item.status === 'instock' ? 'High Stock' : item.status === 'outofstock' ? 'Out of Stock' : 'Low Stock'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => { setEditingId({ id: item.id, source: item.source }); setEditValue(item.stock); }}
                                            className="px-4 py-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 border border-gray-100 hover:border-purple-200 rounded-lg text-xs font-bold transition-all ml-auto block"
                                        >
                                            Adjust
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="px-6 py-20 text-center">
                                    <div className="text-4xl mb-4">📋</div>
                                    <h3 className="text-lg font-bold text-gray-900">Inventory is empty</h3>
                                    <p className="text-gray-500">Sync WooCommerce products or add Vault assets to see them here.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DashboardApp;
