import React, { useState, useEffect } from 'react';
import PremiumLockedOverlay from './PremiumLockedOverlay';
import axios from 'axios';

const SettingsApp = ({ initialTab = 'general' }) => {
    const isPro = window.rmssAdminSettings?.isPro;
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showSecret, setShowSecret] = useState(false);

    // Sync active tab to URL parameter 'tab'
    useEffect(() => {
        const url = new URL(window.location);
        const currentTab = url.searchParams.get('tab');
        if (currentTab !== activeTab) {
            url.searchParams.set('tab', activeTab);
            window.history.pushState({ path: url.toString() }, '', url.toString());
        }
    }, [activeTab]);

    const [settings, setSettings] = useState({
        enable_custom_template: true,
        single_product_layout: 'style-1',
        vault_single_layout: 'style-1',
        default_book_image: '',
        primary_color: '#2563eb',
        accent_color: '#1d4ed8',
        enable_look_inside: true,
        pdf_reader_style: 'style-1',
        look_inside_btn_position: 'bottom-left',
        enable_affiliate: true,
        enable_schema: true,
        enable_custom_button: false,
        hide_add_to_cart: false,
        affiliates: [
            { label: 'Buy on Amazon', url: '' },
            { label: 'Buy on Rokomari', url: '' }
        ],
        // Amazon PA-API credentials
        amazon_access_key: '',
        amazon_secret_key: '',
        amazon_associate_tag: '',
        amazon_marketplace: 'www.amazon.com',
        // Google Books API
        enable_google_books: false,
        google_books_api_key: '',
        // WooCommerce Sync
        wc_sync_enabled: true,
        // Smart API Fallback
        smart_fallback_enabled: true,
        labels: {
            author: 'Author',
            publisher: 'Publisher',
            translator: 'Translator',
            series: 'Series',
            add_to_cart: 'Add to Cart',
            view_cart: 'View Cart',
            look_inside: 'Look Inside',
            isbn: 'ISBN',
            pages: 'Pages',
            edition: 'Edition',
            binding: 'Binding',
            related_books: 'Related Books',
            more_from_author: 'More from this Author',
        }
    });

    // Reveal states for secret inputs
    const [showGBKey, setShowGBKey] = useState(false);
    const [showAmzKey, setShowAmzKey] = useState(false);
    const [showGCBKey, setShowGCBKey] = useState(false);
    const [proSettings, setProSettings] = useState({
        google_books_api_key: ''
    });

    // Async UI states for Connect & Data tab
    const [testConnectionStatus, setTestConnectionStatus] = useState(null); // null | 'loading' | 'success' | 'error'
    const [testConnectionMsg, setTestConnectionMsg] = useState('');
    const [gbTestStatus, setGbTestStatus] = useState(null); // null | 'loading' | 'success' | 'error'
    const [gbTestMsg, setGbTestMsg] = useState('');
    const [gbTestLatency, setGbTestLatency] = useState(null);
    // Tools tab state
    const [toolRunning, setToolRunning] = useState(null); // null | 'slug_repair'
    const [toolResult, setToolResult] = useState(null);   // { ok, message }
    const [showConfirm, setShowConfirm] = useState(false);
    const [clearCacheStatus, setClearCacheStatus] = useState(null); // null | 'loading' | 'done'


    // Documentation State
    const [docSearch, setDocSearch] = useState('');
    const [activeDocSection, setActiveDocSection] = useState('getting-started');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // License Activation State
    const [licenseKey, setLicenseKey] = useState('');
    const [activationStatus, setActivationStatus] = useState(null); // null | 'loading' | 'success' | 'error'
    const [activationMsg, setActivationMsg] = useState('');

    // Media Uploader Handler
    const openMediaUploader = () => {
        if (window.wp && window.wp.media) {
            const editor = window.wp.media({
                title: 'Select Default Book Cover',
                button: { text: 'Use this image' },
                multiple: false
            });

            editor.on('select', () => {
                const attachment = editor.state().get('selection').first().toJSON();
                handleChange('default_book_image', attachment.url);
            });

            editor.open();
        } else {
            alert('WordPress Media Library is not available.');
        }
    };

    // Affiliate Handlers
    const addAffiliate = () => {
        setSettings(prev => ({
            ...prev,
            affiliates: [...prev.affiliates, { label: 'New Store', url: '' }]
        }));
    };

    const removeAffiliate = (index) => {
        setSettings(prev => ({
            ...prev,
            affiliates: prev.affiliates.filter((_, i) => i !== index)
        }));
    };

    const updateAffiliate = (index, field, value) => {
        setSettings(prev => {
            const newAffiliates = [...prev.affiliates];
            newAffiliates[index] = { ...newAffiliates[index], [field]: value };
            return { ...prev, affiliates: newAffiliates };
        });
    };

    // Fetch Settings on Mount
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                // Use wp.apiFetch if available (preferred in WP Admin), otherwise axios
                if (window.wp && window.wp.apiFetch) {
                    const data = await window.wp.apiFetch({ path: '/shelfsage/v1/settings' });
                    setSettings(prev => ({ ...prev, ...(data || {}) }));

                    // Fetch Pro Settings
                    if (isPro) {
                        try {
                            const proData = await window.wp.apiFetch({ path: '/shelfsage-pro/v1/settings/google-books' });
                            setProSettings(proData);
                        } catch (e) { console.warn('Pro settings fetch failed', e); }
                    }
                } else if (window.rmssAdminSettings) {
                    // Fallback using rmssAdminSettings which is localized in settings.php
                    const response = await axios.get(`${window.rmssAdminSettings.apiUrl}/settings`, {
                        headers: { 'X-WP-Nonce': window.rmssAdminSettings.nonce }
                    });
                    const data = response?.data?.settings ?? response?.data ?? {};
                    setSettings(prev => ({ ...prev, ...data }));

                    // Fetch Pro Settings (Axios fallback)
                    if (isPro) {
                        try {
                            const proResponse = await axios.get(`${window.rmssAdminSettings.restUrl?.replace('shelfsage/v1', 'shelfsage-pro/v1')}/settings/google-books`, {
                                headers: { 'X-WP-Nonce': window.rmssAdminSettings.nonce }
                            });
                            setProSettings(proResponse.data);
                        } catch (e) { console.warn('Pro settings fetch failed', e); }
                    }
                } else {
                    console.error("RMSS Settings Global not found");
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    /** Core save — no spinner/toast, used internally. Returns saved settings from server. */
    const handleSaveRaw = async () => {
        let savedSettings = null;
        if (window.wp && window.wp.apiFetch) {
            const response = await window.wp.apiFetch({
                path: '/shelfsage/v1/settings',
                method: 'POST',
                data: settings,
            });
            // API returns { success: true, settings: {...} }
            savedSettings = response?.settings || response;
        } else if (window.rmssAdminSettings) {
            const response = await axios.post(`${window.rmssAdminSettings.apiUrl}/settings`, settings, {
                headers: { 'X-WP-Nonce': window.rmssAdminSettings.nonce }
            });
            savedSettings = response?.data?.settings || response?.data;
        }

        // Sync React state with what the server actually saved (server-side sanitized values)
        if (savedSettings && typeof savedSettings === 'object') {
            setSettings(prev => ({ ...prev, ...savedSettings }));
        }

        // Sync window objects so admin previews pick up new values immediately
        const updatedStyle = savedSettings && savedSettings.pdf_reader_style ? savedSettings.pdf_reader_style : (settings.pdf_reader_style || 'style-1');
        const updatedPos = savedSettings && savedSettings.look_inside_btn_position ? savedSettings.look_inside_btn_position : (settings.look_inside_btn_position || 'bottom-left');
        if (window.rmssAdminSettings) {
            window.rmssAdminSettings.pdf_reader_style = updatedStyle;
            window.rmssAdminSettings.look_inside_btn_position = updatedPos;
        }
        if (window.rmssSettings) {
            window.rmssSettings.pdf_reader_style = updatedStyle;
            window.rmssSettings.look_inside_btn_position = updatedPos;
        }
        // Broadcast to other React roots on the same page
        window.dispatchEvent(new CustomEvent('shelfsage-settings-saved', {
            detail: { pdf_reader_style: updatedStyle, look_inside_btn_position: updatedPos }
        }));

        return savedSettings;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await handleSaveRaw();

            // Save Pro Settings
            if (isPro) {
                try {
                    if (window.wp && window.wp.apiFetch) {
                        await window.wp.apiFetch({
                            path: '/shelfsage-pro/v1/settings/google-books',
                            method: 'POST',
                            data: proSettings,
                        });
                    } else if (window.rmssAdminSettings) {
                        await axios.post(`${window.rmssAdminSettings.restUrl?.replace('shelfsage/v1', 'shelfsage-pro/v1')}/settings/google-books`, proSettings, {
                            headers: { 'X-WP-Nonce': window.rmssAdminSettings.nonce }
                        });
                    }
                } catch (e) { console.warn('Pro settings save failed', e); }
            }

            showToast('Settings saved! Reload your product/shortcode pages to see changes.', 'success', 5000);
        } catch (error) {
            console.error("Error saving settings:", error);
            showToast('Failed to save settings.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type, duration = 4000) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), duration);
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleProSettingsChange = (key, value) => {
        setProSettings(prev => ({ ...prev, [key]: value }));
    };

    /** Build nonce-signed repair URL (mirrors shelfsage.php trsss_bulk_repair_product_slugs) */
    const getRepairUrl = () => {
        const base = window.rmssAdminSettings?.adminUrl || '/wp-admin/admin.php';
        return base + '?action=trsss_repair_product_slugs&_wpnonce=' + (window.rmssAdminSettings?.repairNonce || '');
    };

    /** Run slug/title repair via form redirect */
    const runSlugRepair = () => {
        setShowConfirm(false);
        // Redirect to the action URL — WP processes it server-side
        window.location.href = getRepairUrl();
    };

    /** Test Google Books API key */
    const testGoogleBooksConnection = async () => {
        setGbTestStatus('loading');
        setGbTestMsg('');
        setGbTestLatency(null);
        try {
            const res = await fetch(`${window.rmssAdminSettings?.restUrl}/test-api-connection`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
                body: JSON.stringify({ api: 'google_books' }),
            });
            const data = await res.json();
            const d = data.ok !== undefined ? data : (data.data || data);
            setGbTestStatus(d.ok ? 'success' : 'error');
            setGbTestMsg(d.message || '');
            setGbTestLatency(d.latency_ms ?? null);
        } catch {
            setGbTestStatus('error');
            setGbTestMsg('Network error — could not reach the server.');
        }
        setTimeout(() => { setGbTestStatus(null); setGbTestMsg(''); setGbTestLatency(null); }, 7000);
    };

    /** Test Amazon PA-API credentials via proxy */
    const testAmazonConnection = async () => {
        setTestConnectionStatus('loading');
        setTestConnectionMsg('');
        try {
            // First save current settings, then do a minimal ASIN lookup
            await handleSaveRaw();
            const res = await fetch(`${window.rmssAdminSettings?.restUrl}/amazon-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
                body: JSON.stringify({ query: 'Harry Potter', search_type: 'keywords' }),
            });
            if (res.ok) {
                setTestConnectionStatus('success');
                setTestConnectionMsg('Connection successful! PA-API credentials are valid.');
            } else {
                const data = await res.json();
                setTestConnectionStatus('error');
                setTestConnectionMsg(data.message || 'Connection failed. Check your credentials.');
            }
        } catch {
            setTestConnectionStatus('error');
            setTestConnectionMsg('Network error. Could not reach Amazon API.');
        }
        setTimeout(() => setTestConnectionStatus(null), 6000);
    };

    /** Clear cached API transients */
    const clearCache = async () => {
        setClearCacheStatus('loading');
        try {
            await fetch(`${window.rmssAdminSettings?.restUrl}/clear-cache`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
            });
        } catch { /* silent */ }
        setClearCacheStatus('done');
        setTimeout(() => setClearCacheStatus(null), 3000);
    };

    /** Handle License Activation */
    const handleActivateLicense = async () => {
        if (!licenseKey.trim()) {
            setActivationStatus('error');
            setActivationMsg('Please enter a valid license key.');
            return;
        }

        setActivationStatus('loading');
        setActivationMsg('');

        try {
            const licenseUrl = (window.rmssAdminSettings?.restUrl || '').replace('shelfsage/v1', 'shelfsage-pro/v1');
            const response = await fetch(`${licenseUrl}/license/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
                body: JSON.stringify({ license_key: licenseKey }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setActivationStatus('success');
                setActivationMsg('License activated successfully! Reloading...');
                showToast('License activated! Welcome to Pro.', 'success');
                // Reload page after short delay to reflect Pro status
                setTimeout(() => window.location.reload(), 2000);
            } else {
                setActivationStatus('error');
                setActivationMsg(data.message || 'Activation failed. Invalid key.');
            }
        } catch (error) {
            setActivationStatus('error');
            setActivationMsg('Connection error. Please try again.');
        }
    };

    /** Handle License Deactivation */
    const handleDeactivateLicense = async () => {
        if (!confirm('Are you sure you want to deactivate your license? Pro features will be locked.')) return;

        try {
            const licenseUrl = (window.rmssAdminSettings?.restUrl || '').replace('shelfsage/v1', 'shelfsage-pro/v1');
            const response = await fetch(`${licenseUrl}/license/deactivate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
            });

            if (response.ok) {
                showToast('License deactivated.', 'success');
                setTimeout(() => window.location.reload(), 1000);
            } else {
                showToast('Failed to deactivate.', 'error');
            }
        } catch (error) {
            showToast('Connection error.', 'error');
        }
    };

    // Royal Purple Theme Constants
    const sidebarBg = 'bg-[#1a0b2e]';
    const sidebarBorder = 'border-purple-900/50';
    const sidebarText = 'text-purple-200';
    const sidebarActiveBg = 'bg-[#2d1b4e]';
    const sidebarHoverBg = 'hover:bg-[#2d1b4e]/50';

    if (loading) return (
        <div className="flex items-center justify-center h-screen bg-gray-50">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-purple-600"></div>
        </div>
    );

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-50 font-sans">
            {/* Top Header Bar - Matches Architect */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 relative shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                    <a href="admin.php?page=shelfsage-dashboard" className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-lg group" title="Back to Dashboard">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </a>
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                        <div className="flex items-center gap-2">
                            <span className="text-xl">⚙️</span>
                            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Settings Configuration</h1>
                        </div>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">v2.4</span>
                        {isPro && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider flex items-center gap-1">👑 PRO ACTIVE</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {activeTab !== 'documentation' && (
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className={`px-5 py-2 rounded-lg text-white font-medium transition-all text-sm flex items-center gap-2 ${saving ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-900/10'}`}
                        >
                            {saving ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar - Royal Purple Theme */}
                <div className={`w-64 ${sidebarBg} flex flex-col z-20 shadow-xl relative flex-shrink-0 pt-6`}>



                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
                        {[
                            { id: 'general', label: 'General', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> },
                            { id: 'appearance', label: 'Appearance', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
                            { id: 'features', label: 'Features', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg> },
                            { id: 'labels', label: 'Custom Labels', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg> },
                            { id: 'affiliates', label: 'Affiliates', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg> },
                            { id: 'connect_data', label: 'Connect & Data', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg> },
                            { id: 'library', label: 'Global Library', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
                            { id: 'pro_features', label: isPro ? 'License & Features' : 'Pro Features', icon: isPro ? <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> },
                            { id: 'tools', label: 'Tools', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
                            { id: 'documentation', label: 'Documentation', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === tab.id
                                    ? `${sidebarActiveBg} text-white shadow-md border border-purple-800`
                                    : `${sidebarText} ${sidebarHoverBg} hover:text-white`
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>

                    {/* Footer Link */}
                    <div className={`p-4 border-t ${sidebarBorder} bg-[#130722]/50 flex flex-col gap-3`}>
                        <a
                            href="https://shelfsage.com/docs"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 text-xs text-purple-400 hover:text-white transition-colors group"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                            Online Documentation
                        </a>
                    </div>
                </div>

                <main className="flex-1 overflow-y-auto bg-gray-50 flex flex-col">
                    <div className="p-8 max-w-5xl mx-auto w-full">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                            {activeTab === 'pro_features' ? 'ShelfSage Pro Features' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                            {activeTab === 'documentation' && <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded ml-2">Help Center</span>}
                        </h2>
                        {activeTab === 'general' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">General Options</h3>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="font-semibold text-gray-700 block">Enable Custom Product Template</label>
                                            <p className="text-sm text-gray-500 mt-1">Override WooCommerce default product template with ShelfSage design.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" checked={settings.enable_custom_template} onChange={e => handleChange('enable_custom_template', e.target.checked)} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                        </label>
                                    </div>

                                    {settings.enable_custom_template && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="font-semibold text-gray-700 block mb-1 flex items-center gap-2">
                                                Single Product Layout
                                                {!isPro && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">Pro Access</span>}
                                            </label>
                                            <p className="text-sm text-gray-500 mb-3">Choose the design style for single product pages.</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {[
                                                    { value: 'style-1', label: 'Style 1', desc: 'Standard layout', icon: '📄', proOnly: false },
                                                    { value: 'classic', label: 'Classic', desc: 'Original ShelfSage', icon: '📚', proOnly: true },
                                                    { value: 'style-2', label: 'Style 2', desc: 'Modern layout', icon: '✨', proOnly: true },
                                                    { value: 'style-3', label: 'Style 3', desc: 'Split view', icon: '🔲', proOnly: true },
                                                    { value: 'style-4', label: 'Style 4', desc: 'Editorial style', icon: '📰', proOnly: true },
                                                    { value: 'style-5', label: 'Style 5', desc: 'Detailed view', icon: '🔍', proOnly: true },
                                                ].map(layout => {
                                                    const locked = layout.proOnly && !isPro;
                                                    const isSelected = settings.single_product_layout === layout.value;
                                                    return (
                                                        <button
                                                            key={layout.value}
                                                            type="button"
                                                            disabled={locked}
                                                            onClick={() => !locked && handleChange('single_product_layout', layout.value)}
                                                            className={`relative p-3 rounded-xl border-2 text-left transition-all
                                                                ${locked ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-purple-400 bg-white'}
                                                                ${isSelected ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-gray-200'}`}
                                                        >
                                                            {layout.proOnly && (
                                                                <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {isPro ? 'Pro' : '🔒'}
                                                                </span>
                                                            )}
                                                            <div className="text-2xl mb-1 mt-2">{layout.icon}</div>
                                                            <div className="font-bold text-sm text-gray-800">{layout.label}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{layout.desc}</div>
                                                            {isSelected && !locked && (
                                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                                                                    <svg width="8" height="8" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {!isPro && <p className="text-xs text-amber-600 mt-2">🔒 Pro layouts require ShelfSage Pro.</p>}
                                            <p className="text-xs text-gray-400 mt-1">After saving, reload the product page (Ctrl+Shift+R) to apply.</p>
                                        </div>
                                    )}

                                    {isPro && (
                                        <div className="pt-4 border-t border-gray-100">
                                            <label className="font-semibold text-gray-700 block mb-1 flex items-center gap-2">
                                                Vault Single Layout
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 uppercase tracking-wider">Pro</span>
                                            </label>
                                            <p className="text-sm text-gray-500 mb-3">Choose the design style for ShelfSage Vault single pages.</p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                                {[
                                                    { value: 'style-1', label: 'Style 1', desc: 'Standard layout', icon: '📄', proOnly: false },
                                                    { value: 'classic', label: 'Classic', desc: 'Original ShelfSage', icon: '📚', proOnly: true },
                                                    { value: 'style-2', label: 'Style 2', desc: 'Modern layout', icon: '✨', proOnly: true },
                                                    { value: 'style-3', label: 'Style 3', desc: 'Split view', icon: '🔲', proOnly: true },
                                                    { value: 'style-4', label: 'Style 4', desc: 'Editorial style', icon: '📰', proOnly: true },
                                                    { value: 'style-5', label: 'Style 5', desc: 'Detailed view', icon: '🔍', proOnly: true },
                                                ].map(layout => {
                                                    const locked = layout.proOnly && !isPro;
                                                    const isSelected = (settings.vault_single_layout || 'style-1') === layout.value;
                                                    return (
                                                        <button
                                                            key={layout.value}
                                                            type="button"
                                                            disabled={locked}
                                                            onClick={() => !locked && handleChange('vault_single_layout', layout.value)}
                                                            className={`relative p-3 rounded-xl border-2 text-left transition-all
                                                                ${locked ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-purple-400 bg-white'}
                                                                ${isSelected ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-gray-200'}`}
                                                        >
                                                            {layout.proOnly && (
                                                                <span className={`absolute top-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                    {isPro ? 'Pro' : '🔒'}
                                                                </span>
                                                            )}
                                                            <div className="text-2xl mb-1 mt-2">{layout.icon}</div>
                                                            <div className="font-bold text-sm text-gray-800">{layout.label}</div>
                                                            <div className="text-xs text-gray-500 mt-0.5">{layout.desc}</div>
                                                            {isSelected && !locked && (
                                                                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center">
                                                                    <svg width="8" height="8" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                                </div>
                                                            )}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-xs text-gray-400 mt-1">Applies to Vault asset single pages when Fetch Data is set to ShelfSage Vault.</p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="font-semibold text-gray-700 block mb-2">Default Book Image URL</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={settings.default_book_image}
                                                onChange={e => handleChange('default_book_image', e.target.value)}
                                                placeholder="https://example.com/default-cover.jpg"
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                            />
                                            <button
                                                onClick={openMediaUploader}
                                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg border border-gray-300 transition-colors flex items-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                Upload
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-500 mt-1">Used when a book has no cover image.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'appearance' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Color Scheme</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="font-semibold text-gray-700 block mb-2">Primary Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={settings.primary_color}
                                                    onChange={e => handleChange('primary_color', e.target.value)}
                                                    className="h-10 w-10 p-0 border-0 rounded cursor-pointer ring-1 ring-gray-200"
                                                />
                                                <input
                                                    type="text"
                                                    value={settings.primary_color}
                                                    onChange={e => handleChange('primary_color', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg w-32 uppercase font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">Used for buttons, links, and highlights.</p>
                                        </div>

                                        <div>
                                            <label className="font-semibold text-gray-700 block mb-2">Accent Color</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={settings.accent_color}
                                                    onChange={e => handleChange('accent_color', e.target.value)}
                                                    className="h-10 w-10 p-0 border-0 rounded cursor-pointer ring-1 ring-gray-200"
                                                />
                                                <input
                                                    type="text"
                                                    value={settings.accent_color}
                                                    onChange={e => handleChange('accent_color', e.target.value)}
                                                    className="px-3 py-2 border border-gray-300 rounded-lg w-32 uppercase font-mono text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                                />
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">Used for hover states and secondary elements.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'features' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {/* Feature Toggles */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Feature Toggles</h3>
                                    {!settings.enable_custom_template && (
                                        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 mb-4 text-sm">
                                            ⚠️ Enable &quot;Use ShelfSage template&quot; in General for these features to apply on book product pages.
                                        </p>
                                    )}
                                    {[
                                        { key: 'enable_look_inside', label: 'Enable "Look Inside" Feature', desc: 'Allows users to preview PDF/Images of the book.' },
                                        { key: 'enable_affiliate', label: 'Enable Affiliate Buttons', desc: 'Show external buy buttons (Amazon, Rokomari) on product page.' },
                                        { key: 'enable_schema', label: 'Enable Schema Markup', desc: 'Output JSON-LD Schema for Book, Author, and Publisher (SEO).' },
                                        { key: 'enable_custom_button', label: 'Enable Custom Action Button', desc: 'Show a custom button (e.g. View Details) next to Add to Cart.' },
                                        { key: 'hide_add_to_cart', label: 'Hide Standard "Add to Cart"', desc: 'Disable the default WooCommerce Add to Cart button globally.' },
                                    ].map(feature => (
                                        <div key={feature.key} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors border-b last:border-0 border-gray-100">
                                            <div>
                                                <label className="font-semibold text-gray-700 block">{feature.label}</label>
                                                <p className="text-sm text-gray-500 mt-1">{feature.desc}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={!!settings[feature.key]}
                                                    onChange={e => handleChange(feature.key, e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>

                                {/* ── Look Inside Pro Settings ── */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 relative overflow-hidden">
                                    <div className="flex items-center gap-2 mb-1 border-b pb-3">
                                        <span className="text-lg">👁️</span>
                                        <h3 className="text-lg font-bold text-gray-800">Look Inside Reader Settings</h3>
                                        {!isPro && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 uppercase tracking-wider">Pro Only</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mb-5">Configure the PDF reader design used when visitors click the "Look Inside" button.</p>

                                    {/* PDF Reader Style — Style 1 free, Style 2 & 3 Pro */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-bold text-gray-700 mb-3">PDF Reader Design</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            {[
                                                { value: 'style-1', label: 'Style 1', desc: 'White card with header bar', icon: '🗒️', proOnly: false },
                                                { value: 'style-2', label: 'Style 2', desc: 'Minimal fullscreen dark', icon: '🌑', proOnly: true },
                                                { value: 'style-3', label: 'Style 3', desc: 'Split view with book info', icon: '📖', proOnly: true },
                                            ].map(style => {
                                                const locked = style.proOnly && !isPro;
                                                const isSelected = settings.pdf_reader_style === style.value;
                                                return (
                                                    <button
                                                        key={style.value}
                                                        type="button"
                                                        disabled={locked}
                                                        onClick={() => !locked && handleChange('pdf_reader_style', style.value)}
                                                        className={`relative p-4 rounded-xl border-2 text-left transition-all
                                                            ${locked ? 'opacity-60 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:border-purple-400 bg-white'}
                                                            ${isSelected ? 'border-purple-600 bg-purple-50 shadow-md' : 'border-gray-200'}`}
                                                    >
                                                        {/* Pro lock badge */}
                                                        {style.proOnly && (
                                                            <span className={`absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${isPro ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                                                                {isPro ? 'Pro' : '🔒 Pro'}
                                                            </span>
                                                        )}
                                                        <div className="text-2xl mb-2 mt-3">{style.icon}</div>
                                                        <div className="font-bold text-sm text-gray-800">{style.label}</div>
                                                        <div className="text-xs text-gray-500 mt-0.5">{style.desc}</div>
                                                        {isSelected && !locked && (
                                                            <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center">
                                                                <svg width="10" height="10" fill="white" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {!isPro && (
                                            <p className="text-xs text-amber-600 mt-2">🔒 Style 2 &amp; 3 are available with ShelfSage Pro.</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === 'labels' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                                    <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Frontend Label Customization</h3>
                                    <p className="text-sm text-gray-500">Customize the text displayed on the frontend. Leave blank to use default.</p>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                                        {/* Taxonomy Labels */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Taxonomies</h4>
                                            {['author', 'publisher', 'translator', 'series'].map(key => (
                                                <div key={key}>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1 capitalize">{key}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.labels?.[key] || ''}
                                                        onChange={e => handleChange('labels', { ...settings.labels, [key]: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        {/* Button Texts */}
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Buttons & Actions</h4>
                                            {[
                                                { key: 'add_to_cart', label: 'Add to Cart' },
                                                { key: 'view_cart', label: 'View Cart' },
                                                { key: 'look_inside', label: 'Look Inside' },
                                                { key: 'custom_button', label: 'Custom Button' }
                                            ].map(item => (
                                                <div key={item.key}>
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">{item.label}</label>
                                                    <input
                                                        type="text"
                                                        value={settings.labels?.[item.key] || ''}
                                                        onChange={e => handleChange('labels', { ...settings.labels, [item.key]: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'affiliates' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* ── Amazon PA-API Configuration ── */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-5 border-b pb-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🛍️</span>
                                            <h3 className="text-lg font-bold text-gray-800">Amazon PA-API Configuration</h3>
                                        </div>
                                        {/* Status badge */}
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${settings.amazon_access_key && settings.amazon_secret_key && settings.amazon_associate_tag
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {settings.amazon_access_key && settings.amazon_secret_key && settings.amazon_associate_tag
                                                ? '✓ Configured'
                                                : 'Not Configured'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Access Key */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Access Key ID</label>
                                            <input
                                                type="text"
                                                value={settings.amazon_access_key}
                                                onChange={e => handleChange('amazon_access_key', e.target.value)}
                                                placeholder="AKIAIOSFODNN7EXAMPLE"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none font-mono text-sm"
                                            />
                                        </div>

                                        {/* Secret Key */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Secret Access Key</label>
                                            <div className="relative">
                                                <input
                                                    type={showSecret ? 'text' : 'password'}
                                                    value={settings.amazon_secret_key}
                                                    onChange={e => handleChange('amazon_secret_key', e.target.value)}
                                                    placeholder="wJalrXUtnFEMI/K7MDENG"
                                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none font-mono text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowSecret(s => !s)}
                                                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                                                    title={showSecret ? 'Hide' : 'Show'}
                                                >
                                                    {showSecret
                                                        ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                        : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    }
                                                </button>
                                            </div>
                                        </div>

                                        {/* Associate Tag */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Associate Tag</label>
                                            <input
                                                type="text"
                                                value={settings.amazon_associate_tag}
                                                onChange={e => handleChange('amazon_associate_tag', e.target.value)}
                                                placeholder="myblog-20"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                                            />
                                            <p className="text-xs text-gray-400 mt-1">Your Amazon affiliate tag (e.g. myblog-20)</p>
                                        </div>

                                        {/* Marketplace */}
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1">Marketplace</label>
                                            <select
                                                value={settings.amazon_marketplace}
                                                onChange={e => handleChange('amazon_marketplace', e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
                                            >
                                                <option value="www.amazon.com">🇺🇸 amazon.com (US)</option>
                                                <option value="www.amazon.co.uk">🇬🇧 amazon.co.uk (UK)</option>
                                                <option value="www.amazon.de">🇩🇪 amazon.de (Germany)</option>
                                                <option value="www.amazon.co.jp">🇯🇵 amazon.co.jp (Japan)</option>
                                                <option value="www.amazon.ca">🇨🇦 amazon.ca (Canada)</option>
                                                <option value="www.amazon.com.au">🇦🇺 amazon.com.au (Australia)</option>
                                                <option value="www.amazon.in">🇮🇳 amazon.in (India)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
                                        <strong>🔒 Secure:</strong> Keys are stored server-side and never exposed to the browser. Requests are proxied through WordPress.
                                    </div>
                                </div>

                                {/* ── Affiliate Stores (existing) ── */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                    <div className="flex justify-between items-center mb-6 border-b pb-2">
                                        <h3 className="text-lg font-bold text-gray-800">Affiliate Stores</h3>
                                        <button onClick={addAffiliate} className="text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 font-bold flex items-center gap-1 transition-colors">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                            Add Store
                                        </button>
                                    </div>

                                    {settings.affiliates && settings.affiliates.map((affiliate, index) => (
                                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200 relative group mb-4">
                                            <button
                                                onClick={() => removeAffiliate(index)}
                                                className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                title="Remove"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                            </button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Store Label (Button Text)</label>
                                                    <input
                                                        type="text"
                                                        value={affiliate.label}
                                                        onChange={e => updateAffiliate(index, 'label', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                        placeholder="e.g. Buy on Amazon"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Default URL (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={affiliate.url}
                                                        onChange={e => updateAffiliate(index, 'url', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                                                        placeholder="https://..."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(!settings.affiliates || settings.affiliates.length === 0) && (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                            No affiliate stores configured. Add one to start.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══════════════════════════════════════════════════
                        CONNECT & DATA TAB
                    ══════════════════════════════════════════════════ */}
                        {activeTab === 'connect_data' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* ── PAGE HEADER ── */}
                                <div className="bg-gradient-to-r from-purple-700 to-indigo-700 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-3 mb-1">
                                        <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                                        <h3 className="text-xl font-bold">Connect & Data</h3>
                                    </div>
                                    <p className="text-purple-200 text-sm">Manage external API connections and data sources for your bookshelves.</p>
                                </div>

                                {/* ═══════════════════════════════════════
                                CARD 1: Google Books API Key (Global - for fetch-books endpoint)
                            ═══════════════════════════════════════ */}
                                <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 overflow-hidden">
                                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📚</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">Google Books API Key</h4>
                                            <p className="text-xs text-gray-500">Required for Shortcode Architect ISBN lookup & Smart Book Ingester. Stored securely in Settings.</p>
                                        </div>
                                    </div>
                                    <div className="px-6 py-5">
                                        <label className="block text-sm font-bold text-gray-700 mb-1">API Key</label>
                                        <div className="relative">
                                            <input
                                                type={showGCBKey ? 'text' : 'password'}
                                                value={settings.google_books_api_key || ''}
                                                onChange={e => handleChange('google_books_api_key', e.target.value)}
                                                placeholder="AIzaSy..."
                                                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                            />
                                            <button type="button" onClick={() => setShowGCBKey(v => !v)}
                                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                {showGCBKey
                                                    ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                }
                                            </button>
                                        </div>
                                        <p className="text-xs text-purple-600 font-bold mt-1.5">
                                            <a href="https://console.developers.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="hover:underline">Get your API Key from Google Cloud Console →</a>
                                        </p>

                                        {/* ── Test Connection ── */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <button
                                                type="button"
                                                onClick={testGoogleBooksConnection}
                                                disabled={gbTestStatus === 'loading' || !settings.google_books_api_key}
                                                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300
                                                    ${gbTestStatus === 'success'
                                                        ? 'bg-green-500 text-white shadow-lg shadow-green-400/50 ring-4 ring-green-300/50'
                                                        : gbTestStatus === 'error'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {gbTestStatus === 'loading' && (
                                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                    </svg>
                                                )}
                                                {gbTestStatus === 'success' && <span>✓</span>}
                                                {gbTestStatus === 'error' && <span>✕</span>}
                                                {gbTestStatus === 'loading' ? 'Testing...' : '🔗 Test Connection'}
                                            </button>
                                            {gbTestMsg && (
                                                <span className={`text-xs font-medium ${gbTestStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                    {gbTestMsg}{gbTestLatency != null ? ` (${gbTestLatency}ms)` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ═══════════════════════════════════════
                                CARD 2: Amazon PA-API  (PRO)
                            ═══════════════════════════════════════ */}
                                <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden relative ${isPro ? 'border-orange-300' : 'border-purple-200'
                                    }`}>


                                    {/* Card header */}
                                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                                        <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🛍️</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">Amazon PA-API</h4>
                                            <p className="text-xs text-gray-500">Fetch smart prices safely.</p>
                                        </div>
                                    </div>

                                    <PremiumLockedOverlay isPro={isPro} featureName="Amazon Associates API">
                                        <div className="px-6 py-5 space-y-5">

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {/* Access Key */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Access Key ID</label>
                                                    <input
                                                        type="text"
                                                        value={settings.amazon_access_key}
                                                        onChange={e => handleChange('amazon_access_key', e.target.value)}
                                                        placeholder="AKIAIOSFODNN7EXAMPLE"
                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                                                    />
                                                </div>

                                                {/* Secret Key */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Secret Access Key</label>
                                                    <div className="relative">
                                                        <input
                                                            type={showAmzKey ? 'text' : 'password'}
                                                            value={settings.amazon_secret_key}
                                                            onChange={e => handleChange('amazon_secret_key', e.target.value)}
                                                            placeholder="wJalrXUtnFEMI/K7MDENG"
                                                            className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-mono text-sm"
                                                        />
                                                        <button type="button" onClick={() => setShowAmzKey(v => !v)}
                                                            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                            {showAmzKey
                                                                ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                                : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            }
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Associate Tag */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Associate Tag</label>
                                                    <input
                                                        type="text"
                                                        value={settings.amazon_associate_tag}
                                                        onChange={e => handleChange('amazon_associate_tag', e.target.value)}
                                                        placeholder="myblog-20"
                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                                    />
                                                    <p className="text-xs text-gray-400 mt-1">Your associate tag is usually <code className="bg-gray-100 px-1 rounded">yourstore-20</code></p>
                                                </div>

                                                {/* Marketplace */}
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">Marketplace</label>
                                                    <select
                                                        value={settings.amazon_marketplace}
                                                        onChange={e => handleChange('amazon_marketplace', e.target.value)}
                                                        className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
                                                    >
                                                        <option value="www.amazon.com">🇺🇸 amazon.com (US)</option>
                                                        <option value="www.amazon.co.uk">🇬🇧 amazon.co.uk (UK)</option>
                                                        <option value="www.amazon.de">🇩🇪 amazon.de (Germany)</option>
                                                        <option value="www.amazon.co.jp">🇯🇵 amazon.co.jp (Japan)</option>
                                                        <option value="www.amazon.ca">🇨🇦 amazon.ca (Canada)</option>
                                                        <option value="www.amazon.com.au">🇦🇺 amazon.com.au (Australia)</option>
                                                        <option value="www.amazon.in">🇮🇳 amazon.in (India)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Test Connection button */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={testAmazonConnection}
                                                    disabled={testConnectionStatus === 'loading'}
                                                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${testConnectionStatus === 'success'
                                                        ? 'bg-green-500 text-white shadow-lg shadow-green-400/50 ring-4 ring-green-300/50'
                                                        : testConnectionStatus === 'error'
                                                            ? 'bg-red-500 text-white'
                                                            : 'bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg'
                                                        } disabled:opacity-60 disabled:cursor-wait`}
                                                >
                                                    {testConnectionStatus === 'loading' && (
                                                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                                    )}
                                                    {testConnectionStatus === 'success' && <span>✓</span>}
                                                    {testConnectionStatus === 'error' && <span>✕</span>}
                                                    {testConnectionStatus === 'loading' ? 'Testing...' : '🔌 Test Connection'}
                                                </button>
                                                {testConnectionMsg && (
                                                    <span className={`text-xs font-medium ${testConnectionStatus === 'success' ? 'text-green-600' : 'text-red-500'
                                                        }`}>{testConnectionMsg}</span>
                                                )}
                                            </div>

                                            {/* ── Smart Fallback Toggle ── */}
                                            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <span className="text-base">🔁</span>
                                                            <p className="text-sm font-bold text-gray-800">Enable Smart Fallback</p>
                                                        </div>
                                                        <p className="text-xs text-gray-500 leading-relaxed">
                                                            If Amazon data is incomplete, automatically fetch missing cover images, descriptions, and page counts from Google Books.
                                                        </p>
                                                        {settings.smart_fallback_enabled && (
                                                            <p className="text-[11px] text-blue-600 font-semibold mt-1.5 flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                Active — enriched data will be labelled in the Architect preview
                                                            </p>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleChange('smart_fallback_enabled', !settings.smart_fallback_enabled)}
                                                        className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none flex-shrink-0 mt-0.5 ${settings.smart_fallback_enabled ? 'bg-blue-500' : 'bg-gray-300'}`}
                                                        title={settings.smart_fallback_enabled ? 'Disable Smart Fallback' : 'Enable Smart Fallback'}
                                                    >
                                                        <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.smart_fallback_enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-700">
                                                <strong>🔒 Secure:</strong> Credentials are stored server-side only. Requests are proxied through WordPress — your keys never touch the browser.
                                            </div>
                                        </div>
                                    </PremiumLockedOverlay>
                                </div>

                                {/* ═══════════════════════════════════════
                                CARD 3: WooCommerce Sync
                            ═══════════════════════════════════════ */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Card header */}
                                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-fuchsia-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center text-xl">🛒</div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 text-sm">WooCommerce Sync</h4>
                                                <p className="text-xs text-gray-500">Keep book data in sync with your WooCommerce product catalog</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleChange('wc_sync_enabled', !settings.wc_sync_enabled)}
                                            className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${settings.wc_sync_enabled ? 'bg-purple-600' : 'bg-gray-300'
                                                }`}
                                        >
                                            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.wc_sync_enabled ? 'translate-x-5' : 'translate-x-0.5'
                                                }`} />
                                        </button>
                                    </div>

                                    <div className={`px-6 py-5 transition-opacity duration-300 ${settings.wc_sync_enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                            {[
                                                { icon: '🔄', title: 'Auto Sync', desc: 'Product data updates automatically on save' },
                                                { icon: '🏷️', title: 'ISBN Mapping', desc: 'ISBN meta linked to WC custom fields' },
                                                { icon: '📊', title: 'Sales Data', desc: 'Bestseller ranking uses WC order history' },
                                            ].map(f => (
                                                <div key={f.title} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                                                    <span className="text-xl">{f.icon}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-purple-800">{f.title}</p>
                                                        <p className="text-[11px] text-gray-500 mt-0.5">{f.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <p className="text-xs text-gray-400">WooCommerce must be active. ShelfSage reads product meta fields like <code className="bg-gray-100 px-1 rounded">_isbn</code>, <code className="bg-gray-100 px-1 rounded">_author</code>, etc.</p>
                                    </div>
                                </div>

                                {/* ═══════════════════════════════════════
                                CLEAR CACHE (bottom utility bar)
                            ═══════════════════════════════════════ */}
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-6 py-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-700">API Cache</h4>
                                            <p className="text-xs text-gray-400 mt-0.5">Clear all cached API responses (Google Books, Amazon) stored as WordPress transients.</p>
                                        </div>
                                        <button
                                            onClick={clearCache}
                                            disabled={clearCacheStatus === 'loading'}
                                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${clearCacheStatus === 'done'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : 'bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200'
                                                } disabled:opacity-60`}
                                        >
                                            {clearCacheStatus === 'loading' && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                                            {clearCacheStatus === 'done' ? '✓ Cache Cleared' : '🗑️ Clear Cache'}
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}

                        {activeTab === 'pro_features' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">

                                    <div className="text-center max-w-2xl mx-auto mb-10">
                                        <h3 className="text-2xl font-bold text-gray-800 mb-2">
                                            {isPro ? 'Your Professional License' : 'Upgrade to ShelfSage Pro'}
                                        </h3>
                                        <p className="text-gray-500">
                                            {isPro
                                                ? 'You have access to all premium features. Thank you for supporting ShelfSage!'
                                                : 'Unlock the full potential of your bookshelves with these advanced features.'}
                                        </p>
                                    </div>

                                    {isPro ? (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-10 flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-green-800 text-lg">License Active</h4>
                                                    <p className="text-green-600 text-sm font-mono mt-0.5">Thank you for supporting ShelfSage!</p>
                                                </div>
                                            </div>
                                            {window.rmssAdminSettings?.useFreemius && window.rmssAdminSettings?.freemiusAccountUrl ? (
                                                <a
                                                    href={window.rmssAdminSettings.freemiusAccountUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-sm font-medium text-green-700 hover:text-green-900 underline decoration-green-300 underline-offset-4"
                                                >
                                                    Manage subscription
                                                </a>
                                            ) : (
                                                <button
                                                    onClick={handleDeactivateLicense}
                                                    className="text-sm font-medium text-green-700 hover:text-green-900 underline decoration-green-300 underline-offset-4"
                                                >
                                                    Deactivate License
                                                </button>
                                            )}
                                        </div>
                                    ) : window.rmssAdminSettings?.useFreemius && window.rmssAdminSettings?.freemiusUpgradeUrl ? (
                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 mb-10 text-center max-w-xl mx-auto shadow-sm">
                                            <h4 className="font-bold text-purple-900 text-lg mb-4">Upgrade to ShelfSage Pro</h4>
                                            <p className="text-purple-600 text-sm mb-6">Purchase and activate Pro via your Freemius account.</p>
                                            <a
                                                href={window.rmssAdminSettings.freemiusUpgradeUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-xl"
                                            >
                                                View pricing & upgrade
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-8 mb-10 text-center max-w-xl mx-auto shadow-sm">
                                            <h4 className="font-bold text-purple-900 text-lg mb-4">Activate Your License</h4>
                                            <div className="bg-[#f5f3ff] border border-purple-200 rounded-xl p-6 shadow-sm ring-1 ring-purple-100/50">
                                                <input
                                                    type="text"
                                                    value={licenseKey}
                                                    onChange={(e) => setLicenseKey(e.target.value)}
                                                    placeholder="Enter your license key (e.g. SSSS-PRO-...)"
                                                    className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono text-center text-sm bg-white mb-3"
                                                />
                                                <button
                                                    onClick={handleActivateLicense}
                                                    disabled={activationStatus === 'loading'}
                                                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all shadow-md hover:shadow-xl disabled:opacity-70 disabled:cursor-wait flex items-center justify-center gap-2"
                                                >
                                                    {activationStatus === 'loading' && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                                    {activationStatus === 'loading' ? 'Activating...' : 'Activate License'}
                                                </button>
                                                {activationStatus && (
                                                    <p className={`text-xs font-bold mt-2 ${activationStatus === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                                                        {activationMsg}
                                                    </p>
                                                )}
                                            </div>

                                            <p className="text-xs text-purple-400 mt-4">
                                                Don't have a key? <a href="https://shelfsage.com/pricing" target="_blank" className="underline hover:text-purple-600">Get one here</a>.
                                            </p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {[
                                            { title: 'Masonry Layout', desc: 'Display books in a stunning masonry grid that adapts to any screen size.', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                                            { title: '3D Bookshelf', desc: 'A realistic wooden shelf view with 3D skewed book covers.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
                                            { title: 'Affiliate Integration', desc: 'Add Buy buttons for Amazon, Rokomari, and more directly on the shelf card.', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
                                            { title: 'Look Inside Viewer', desc: 'Allow readers to peek inside the book with a modal PDF/Image viewer.', icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' },
                                            { title: 'Advanced Filtering', desc: 'Let users filter books by genre, author, and rating dynamically.', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
                                            { title: 'Priority Support', desc: 'Get direct access to our developer team for help and customizations.', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z' }
                                        ].map((feature, i) => (
                                            <div key={i} className={`rounded-xl border p-6 flex flex-col items-center text-center relative overflow-hidden group transition-all ${isPro ? 'bg-white border-purple-100 hover:border-purple-300 hover:shadow-md' : 'bg-gray-50 border-gray-200'}`}>

                                                {!isPro && (
                                                    <div className="absolute top-3 right-3 text-gray-400 group-hover:text-purple-500 transition-colors">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                                    </div>
                                                )}

                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${isPro ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={feature.icon} /></svg>
                                                </div>

                                                <h4 className="font-bold text-gray-800 mb-2">{feature.title}</h4>
                                                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {!isPro && (
                                        <div className="mt-10 text-center">
                                            <button className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg px-8 py-4 rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-purple-200 shadow-xl">
                                                Get ShelfSage Pro - $39
                                            </button>
                                            <p className="text-gray-400 text-sm mt-3">30-day money-back guarantee. No questions asked.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ══════════════════════════════════════════════════
                            GLOBAL LIBRARY TAB (PRO)
                        ══════════════════════════════════════════════════ */}
                        {activeTab === 'library' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-3 mb-1">
                                        <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                        <h3 className="text-xl font-bold">Global Custom Books Library</h3>
                                    </div>
                                    <p className="text-blue-100 text-sm">Centralized repository for high-performance metadata and book ingestion.</p>
                                </div>

                                <div className={`bg-white rounded-2xl shadow-sm border-2 overflow-hidden relative ${isPro ? 'border-blue-300' : 'border-purple-200'}`}>
                                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center text-xl">📚</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                Google Books Engine (Server-Side)
                                                {isPro && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Active</span>}
                                            </h4>
                                            <p className="text-xs text-gray-500">Professional-grade metadata fetching via ShelfSage Pro</p>
                                        </div>
                                    </div>

                                    <PremiumLockedOverlay isPro={isPro} featureName="Server-Side Google Books Engine">
                                        <div className="px-6 py-5 space-y-5">
                                            <div>
                                                <label className="block text-sm font-bold text-gray-700 mb-1">Google Books API Key
                                                    <span className="ml-2 font-normal text-gray-400 text-xs">(PRO specific option - Uses `shelfsage_google_api_key`)</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showGCBKey ? 'text' : 'password'}
                                                        value={proSettings.google_books_api_key}
                                                        onChange={e => handleProSettingsChange('google_books_api_key', e.target.value)}
                                                        placeholder="AIzaSy..."
                                                        className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                                                    />
                                                    <button type="button" onClick={() => setShowGCBKey(v => !v)}
                                                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                                                        {showGCBKey
                                                            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                        }
                                                    </button>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1.5 line-through">
                                                    Enter your Google Cloud API key to use the server-side proxy. This prevents client-side IP blocking and ensures faster metadata matching.
                                                </p>
                                                <p className="text-xs text-purple-600 font-bold mt-1">
                                                    <a href="https://console.developers.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
                                                        className="hover:underline">Get your API Key from Google Cloud Console →
                                                    </a>
                                                </p>
                                            </div>


                                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 leading-relaxed">
                                                <div className="flex gap-2">
                                                    <span className="text-lg">🛡️</span>
                                                    <div>
                                                        <strong>Privacy & Security:</strong> Your API key is stored securely in the WordPress database (Standalone Option) and is only used by the server to fetch data. It is never exposed to visitors.
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </PremiumLockedOverlay>
                                </div>
                            </div>
                        )}

                        {/* DOCUMENTATION TAB */}
                        {activeTab === 'documentation' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                                {/* 1. Hero Search Area */}
                                <div className="bg-gradient-to-b from-purple-50 to-white border-b border-purple-100 py-16 px-8 text-center rounded-2xl mb-8">
                                    <h2 className="font-serif text-3xl md:text-4xl text-gray-900 mb-4 font-bold">How can we help you?</h2>
                                    <div className="relative max-w-2xl mx-auto">
                                        <input
                                            type="text"
                                            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 shadow-lg shadow-purple-900/5 focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none text-gray-700 text-lg transition-shadow"
                                            placeholder="Search for guides, shortcodes, or API setup..."
                                            value={docSearch}
                                            onChange={(e) => setDocSearch(e.target.value)}
                                        />
                                        <svg className="w-6 h-6 absolute left-4 top-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                    </div>
                                </div>

                                {/* 2. Category Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                                    {[
                                        { id: 'getting-started', label: 'Getting Started', icon: '🚀', color: 'bg-blue-100 text-blue-600' },
                                        { id: 'layout-guides', label: 'Layout Guides', icon: '🍱', color: 'bg-indigo-100 text-indigo-600' },
                                        { id: 'api-connections', label: 'API Connections', icon: '🔌', color: 'bg-amber-100 text-amber-600' },
                                        { id: 'pro-features', label: 'Pro Features', icon: '⭐', color: 'bg-purple-100 text-purple-600' },
                                    ].map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveDocSection(cat.id)}
                                            className={`p-4 rounded-xl border transition-all text-left flex items-center gap-4 group ${activeDocSection === cat.id ? 'bg-white border-purple-500 shadow-md ring-1 ring-purple-500' : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm hover:-translate-y-1'}`}
                                        >
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${cat.color}`}>{cat.icon}</div>
                                            <span className={`font-bold text-lg ${activeDocSection === cat.id ? 'text-purple-700' : 'text-gray-700 group-hover:text-purple-700'}`}>{cat.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* 3. Split Layout */}
                                <div className="flex flex-col lg:flex-row gap-12 items-start">
                                    {/* Left: Sticky Nav */}
                                    <div className="hidden lg:block w-64 flex-shrink-0 sticky top-8">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">On this page</h3>
                                        <nav className="space-y-1 border-l border-gray-200 ml-2">
                                            {[
                                                { id: 'getting-started', label: 'Getting Started' },
                                                { id: 'layout-guides', label: 'Layout Guides' },
                                                { id: 'api-connections', label: 'API Connections' },
                                                { id: 'pro-features', label: 'Pro Features' },
                                                { id: 'troubleshooting', label: 'Troubleshooting' },
                                            ].map(link => (
                                                <button
                                                    key={link.id}
                                                    onClick={() => setActiveDocSection(link.id)}
                                                    className={`block w-full text-left pl-4 py-2 text-sm border-l-2 -ml-[1px] transition-colors ${activeDocSection === link.id ? 'border-purple-600 text-purple-700 font-bold' : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'}`}
                                                >
                                                    {link.label}
                                                </button>
                                            ))}
                                        </nav>

                                        <div className="mt-8 bg-purple-50 rounded-xl p-5 border border-purple-100">
                                            <h4 className="font-bold text-purple-900 mb-2 flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                Need Support?
                                            </h4>
                                            <p className="text-xs text-purple-700 mb-3 leading-relaxed">Our team is ready to help you with any issues.</p>
                                            <a href="https://shelfsage.com/support" target="_blank" className="block w-full text-center bg-purple-600 text-white py-2.5 rounded-lg text-xs font-bold hover:bg-purple-700 transition-colors shadow-sm">Open Ticket</a>
                                        </div>
                                    </div>

                                    {/* Right: Content */}
                                    <div className="flex-1 space-y-12 min-h-[500px]">
                                        {/* Getting Started */}
                                        {(activeDocSection === 'getting-started' || !activeDocSection) && (
                                            <section className="space-y-6 animate-in fade-in duration-300">
                                                <div>
                                                    <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Getting Started</h2>
                                                    <p className="text-gray-500 text-sm">Everything you need to set up your first shelf.</p>
                                                </div>

                                                <p className="text-gray-600 leading-relaxed text-lg">
                                                    Welcome to ShelfSage! Displaying your books is as easy as 1-2-3. Ensure you have WooCommerce products created, then use the <strong>Architect</strong> to design your shelf.
                                                </p>

                                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-4 text-blue-800 text-sm">
                                                    <span className="text-2xl">💡</span>
                                                    <div>
                                                        <h4 className="font-bold mb-1">Pro Tip</h4>
                                                        <p>Use the "Shortcode Architect" tab to visually build your shelf and copy the code. It's much faster than typing parameters manually!</p>
                                                    </div>
                                                </div>

                                                <h3 className="font-serif text-xl font-bold text-gray-900 mt-8">Your First Shortcode</h3>
                                                <p className="text-gray-600">Use this standard shortcode to display a grid of your latest books on any page:</p>

                                                <div className="bg-[#1a0b2e] rounded-xl p-5 relative group overflow-hidden shadow-lg">
                                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                                                    <code className="font-mono text-purple-300 text-base">[shelfsage mode="grid" limit="6"]</code>
                                                    <button
                                                        onClick={() => { navigator.clipboard.writeText('[shelfsage mode="grid" limit="6"]'); showToast('Copied to clipboard!', 'success'); }}
                                                        className="absolute top-3 right-3 bg-white/10 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-white/20 transition-all border border-white/5"
                                                    >
                                                        Copy Code
                                                    </button>
                                                </div>

                                                <h3 className="font-serif text-xl font-bold text-gray-900 mt-8">Common Attributes</h3>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-left text-sm whitespace-nowrap">
                                                        <thead className="uppercase tracking-wider border-b border-gray-200 bg-gray-50 text-gray-500">
                                                            <tr>
                                                                <th scope="col" className="px-6 py-3">Attribute</th>
                                                                <th scope="col" className="px-6 py-3">Description</th>
                                                                <th scope="col" className="px-6 py-3">Example</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            <tr>
                                                                <td className="px-6 py-4 font-mono text-purple-600">mode</td>
                                                                <td className="px-6 py-4 text-gray-600">Layout style</td>
                                                                <td className="px-6 py-4 text-gray-400">"grid", "list", "masonry"</td>
                                                            </tr>
                                                            <tr className="bg-gray-50/50">
                                                                <td className="px-6 py-4 font-mono text-purple-600">limit</td>
                                                                <td className="px-6 py-4 text-gray-600">Number of books</td>
                                                                <td className="px-6 py-4 text-gray-400">"12"</td>
                                                            </tr>
                                                            <tr>
                                                                <td className="px-6 py-4 font-mono text-purple-600">genre</td>
                                                                <td className="px-6 py-4 text-gray-600">Filter by genre slug</td>
                                                                <td className="px-6 py-4 text-gray-400">"fantasy"</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </section>
                                        )}

                                        {/* Layout Guides */}
                                        {activeDocSection === 'layout-guides' && (
                                            <section className="space-y-6 animate-in fade-in duration-300">
                                                <div>
                                                    <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Layout Guides</h2>
                                                    <p className="text-gray-500 text-sm">Mastering the different display modes.</p>
                                                </div>

                                                <h3 className="font-serif text-xl font-bold text-gray-900 mt-6">Masonry Layout</h3>
                                                <p className="text-gray-600">Perfect for varying book cover heights. This layout eliminates gaps between rows, creating a pinterest-style wall of books.</p>
                                                <div className="bg-[#1a0b2e] rounded-xl p-4 relative">
                                                    <code className="font-mono text-purple-300 text-sm">[shelfsage mode="masonry" cols="3"]</code>
                                                </div>

                                                <h3 className="font-serif text-xl font-bold text-gray-900 mt-8">3D Flip Book</h3>
                                                <p className="text-gray-600">Enable the interactive 3D reading experience where users can flip the cover to see details on the back.</p>

                                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 flex gap-4 text-amber-800 text-sm my-4">
                                                    <span className="text-2xl">⚠️</span>
                                                    <div>
                                                        <h4 className="font-bold mb-1">Important Note</h4>
                                                        <p>3D Flip Book does not work well with "Masonry" mode because of the perspective calculations. Please use standard "Grid" mode.</p>
                                                    </div>
                                                </div>

                                                <div className="bg-[#1a0b2e] rounded-xl p-4 relative">
                                                    <code className="font-mono text-purple-300 text-sm">[shelfsage mode="grid" design="flip3d"]</code>
                                                </div>
                                            </section>
                                        )}

                                        {/* API Connections */}
                                        {activeDocSection === 'api-connections' && (
                                            <section className="space-y-6 animate-in fade-in duration-300">
                                                <div>
                                                    <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">API Connections</h2>
                                                    <p className="text-gray-500 text-sm">Power up your shelf with external data sources.</p>
                                                </div>

                                                <p className="text-gray-600">Connect to Amazon PA-API or Google Books to enrich your data automatically.</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div className="border border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center text-xl mb-4">🛒</div>
                                                        <h3 className="font-bold text-gray-900 mb-2">Amazon PA-API</h3>
                                                        <p className="text-sm text-gray-500 mb-4">Fetch prices, images, and buy links directly from Amazon.</p>
                                                        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                                                            <li>Go to <strong>Connect & Data</strong> tab.</li>
                                                            <li>Enter <strong>Access Key</strong> & <strong>Secret Key</strong>.</li>
                                                            <li>Add your <strong>Associate Tag</strong>.</li>
                                                        </ol>
                                                    </div>
                                                    <div className="border border-gray-200 rounded-xl p-6 hover:border-purple-300 transition-colors">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-xl mb-4">📚</div>
                                                        <h3 className="font-bold text-gray-900 mb-2">Google Books</h3>
                                                        <p className="text-sm text-gray-500 mb-4">Auto-fill book descriptions, authors, and page counts.</p>
                                                        <ol className="list-decimal pl-5 space-y-1 text-sm text-gray-600">
                                                            <li>Get a free API Key from Google Cloud Console.</li>
                                                            <li>Paste it in the <strong>Google Books</strong> section.</li>
                                                        </ol>
                                                    </div>
                                                </div>
                                            </section>
                                        )}

                                        {/* Pro Features */}
                                        {activeDocSection === 'pro-features' && (
                                            <section className="space-y-6 animate-in fade-in duration-300">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Pro Features</h2>
                                                        <p className="text-gray-500 text-sm">You are currently on the {isPro ? <span className="text-green-600 font-bold">Pro Plan</span> : <span className="text-gray-600 font-bold">Free Plan</span>}.</p>
                                                    </div>
                                                    {!isPro && <button className="bg-purple-600 text-white px-4 py-2 rounded-lg font-bold text-sm">Upgrade Now</button>}
                                                </div>

                                                <p className="text-gray-600">Upgrading unlocks the full potential of ShelfSage with these exclusive features:</p>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {[
                                                        { t: 'Masonry & Slider Layouts', d: 'Display books in flexible grid or smooth carousel.' },
                                                        { t: '3D Shelf & Brutalist Designs', d: 'Premium templates to match any brand style.' },
                                                        { t: 'Look Inside Viewer', d: 'Let readers preview pages before buying.' },
                                                        { t: 'Affiliate Buttons', d: 'Add "Buy from Amazon/Rokomari" buttons.' },
                                                        { t: 'Priority Support', d: 'Direct access to the developer team.' },
                                                        { t: 'AI Recommendations', d: 'Smart suggestions based on user history (Beta).' }
                                                    ].map(f => (
                                                        <div key={f.t} className="flex gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:shadow-sm transition-shadow">
                                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-bold text-gray-900 text-sm">{f.t}</h4>
                                                                <p className="text-xs text-gray-500 mt-1">{f.d}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </section>
                                        )}

                                        {/* Troubleshooting */}
                                        {activeDocSection === 'troubleshooting' && (
                                            <section className="space-y-6 animate-in fade-in duration-300">
                                                <div>
                                                    <h2 className="font-serif text-3xl font-bold text-gray-900 mb-2">Troubleshooting</h2>
                                                    <p className="text-gray-500 text-sm">Common issues and how to fix them.</p>
                                                </div>

                                                <div className="space-y-4">
                                                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                        <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-gray-800 hover:bg-gray-50">
                                                            Books are not showing up?
                                                            <svg className="w-5 h-5 text-gray-400group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        </summary>
                                                        <div className="p-4 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">
                                                            Check if your books are marked as <strong>"Published"</strong> in WooCommerce. Draft or Private products will not appear. Also ensure your shortcode limit isn't set to 0.
                                                        </div>
                                                    </details>
                                                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                        <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-gray-800 hover:bg-gray-50">
                                                            404 Error on Dashboard?
                                                            <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        </summary>
                                                        <div className="p-4 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">
                                                            Go to WordPress <strong>Settings {'>'} Permalinks</strong> and simply click "Save Changes" to flush the rewrite rules. This often fixes 404 errors with plugin pages.
                                                        </div>
                                                    </details>
                                                    <details className="group bg-white border border-gray-200 rounded-xl overflow-hidden">
                                                        <summary className="flex items-center justify-between p-4 cursor-pointer font-bold text-gray-800 hover:bg-gray-50">
                                                            Styles look broken?
                                                            <svg className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                                        </summary>
                                                        <div className="p-4 pt-0 text-gray-600 text-sm leading-relaxed border-t border-gray-100 bg-gray-50/50">
                                                            Try clearing your browser cache and any caching plugins (WP Rocket, LiteSpeed, etc.). If using the 3D Flip Book, ensure your container has enough width.
                                                        </div>
                                                    </details>
                                                </div>
                                            </section>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── TOOLS TAB ── */}
                        {activeTab === 'tools' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Header */}
                                <div className="bg-gradient-to-r from-slate-700 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
                                    <div className="flex items-center gap-3 mb-1">
                                        <svg className="w-6 h-6 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        <h3 className="text-xl font-bold">Maintenance Tools</h3>
                                    </div>
                                    <p className="text-slate-300 text-sm">Advanced tools for bulk operations. These actions modify live data — use with caution.</p>
                                </div>

                                {/* Tool Card — Slug & Title Repair */}
                                <div className="bg-white rounded-2xl shadow-sm border-2 border-amber-200 overflow-hidden">
                                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-orange-50">
                                        <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center text-xl">🔧</div>
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                                                Repair Book Slugs &amp; Titles
                                                <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Bulk Action</span>
                                            </h4>
                                            <p className="text-xs text-gray-500">Fix mojibake (encoding corruption) in titles and rebuild Unicode-safe slugs for all published/draft products.</p>
                                        </div>
                                    </div>

                                    <div className="px-6 py-5 space-y-4">
                                        {/* When to use */}
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            {[
                                                { icon: '❌', label: 'Corrupted titles', desc: 'Titles showing as garbled or wrong characters' },
                                                { icon: '🔗', label: 'Broken slugs', desc: 'Product URLs containing encoded or mismatched text' },
                                                { icon: '🌐', label: 'Unicode issues', desc: 'Bengali/Arabic book names not saved correctly' },
                                            ].map(c => (
                                                <div key={c.label} className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                                                    <span className="text-lg flex-shrink-0">{c.icon}</span>
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-800">{c.label}</p>
                                                        <p className="text-xs text-gray-500 mt-0.5">{c.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Warning banner */}
                                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                            <div>
                                                <p className="text-sm font-bold text-red-700">This modifies live database records</p>
                                                <p className="text-xs text-red-600 mt-0.5">All published and draft WooCommerce product slugs and titles will be updated. Take a database backup before proceeding.</p>
                                            </div>
                                        </div>

                                        {/* Action button */}
                                        <div className="flex items-center gap-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirm(true)}
                                                className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" /></svg>
                                                Run Slug &amp; Title Repair
                                            </button>
                                            <p className="text-xs text-gray-400 italic">You will see a confirmation before anything runs.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Placeholder for future tools */}
                                <div className="bg-white rounded-2xl shadow-sm border-2 border-dashed border-gray-200 overflow-hidden">
                                    <div className="px-6 py-8 text-center text-gray-400">
                                        <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
                                        <p className="text-sm font-medium">More tools coming soon</p>
                                        <p className="text-xs mt-1">Bulk ISBN import, cover image optimizer, taxonomy cleanup…</p>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Confirmation Modal */}
                    {showConfirm && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => setShowConfirm(false)}
                            />
                            {/* Dialog */}
                            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
                                {/* Icon */}
                                <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto mb-4">
                                    <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Run Bulk Slug Repair?</h3>
                                <p className="text-sm text-gray-600 text-center mb-1">
                                    This will update <strong>all WooCommerce product titles and slugs</strong>. The action cannot be automatically undone.
                                </p>
                                <p className="text-xs text-red-500 text-center font-medium mb-6">
                                    ⚠️ Take a database backup before proceeding.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm(false)}
                                        className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={runSlugRepair}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                                    >
                                        Yes, Run Repair
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Toast Notification */}
                    {
                        toast && (
                            <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-lg shadow-lg text-white transform transition-all duration-300 ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'} animate-slide-up z-50`}>
                                <div className="flex items-center gap-2">
                                    {toast.type === 'success' ? (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                    ) : (
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    )}
                                    {toast.message}
                                </div>
                            </div>
                        )
                    }
                </main >
            </div >
        </div >
    );
};

export default SettingsApp;
