import React, { useState, useEffect, useRef } from 'react';
import PremiumLockedOverlay from './PremiumLockedOverlay';
import ProBadge from './ProBadge';
import LookInsideModal from './LookInsideModal';

/**
 * ── Font Picker Dropdown Component ─────────────────────────────────────────────
 * A proper React component (not an IIFE) so hooks are called at the top level.
 */
const GOOGLE_FONTS = [
    'Default (System)',
    'Hind Siliguri', 'Tiro Bangla',
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Poppins', 'Nunito', 'Raleway', 'Oswald', 'Merriweather',
    'Playfair Display', 'Lora', 'PT Serif', 'Libre Baskerville',
    'EB Garamond', 'Crimson Text', 'Cormorant Garamond',
    'DM Serif Display', 'Abril Fatface', 'Josefin Sans',
    'Quicksand', 'Comfortaa', 'Pacifico', 'Dancing Script',
    'Lobster', 'Righteous', 'Bebas Neue', 'Anton',
    'Fjalla One', 'Source Serif 4', 'Spectral',
    'IBM Plex Serif', 'Space Grotesk', 'DM Sans',
    'Plus Jakarta Sans', 'Sora', 'Manrope', 'Outfit',
    'Urbanist', 'Lexend', 'Figtree', 'Mulish',
];

function FontPickerDropdown({ currentFont, onChange }) {
    const [fontSearch, setFontSearch] = useState('');
    const [fontOpen, setFontOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Load all curated fonts once so preview renders instantly
    useEffect(() => {
        const id = 'ss-font-picker-preload';
        if (!document.getElementById(id)) {
            const families = GOOGLE_FONTS
                .filter(f => f !== 'Default (System)')
                .map(f => `family=${f.replace(/ /g, '+')}:wght@400;700`)
                .join('&');
            const link = document.createElement('link');
            link.rel = 'stylesheet'; // Changed from 'preload' to 'stylesheet' to avoid "unused preload" warning
            link.id = id;
            link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
            // link.as = 'style'; // No longer needed for rel=stylesheet
            document.head.appendChild(link);
        }
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setFontOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const filtered = GOOGLE_FONTS.filter(f =>
        f.toLowerCase().includes(fontSearch.toLowerCase())
    );

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setFontOpen(o => !o)}
                className="w-full flex items-center justify-between bg-[#2d1b4e] border border-purple-800/50 rounded-lg px-3 py-2 text-xs text-purple-200 hover:border-purple-500 transition-colors"
                style={{ fontFamily: currentFont ? `'${currentFont}', sans-serif` : 'inherit' }}
            >
                <span>{currentFont || 'Default (System)'}</span>
                <svg className={`w-3.5 h-3.5 text-purple-400 transition-transform ${fontOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>

            {/* Dropdown panel */}
            {fontOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-[#1a0b2e] border border-purple-700/60 rounded-xl shadow-2xl overflow-hidden">
                    {/* Search box */}
                    <div className="p-2 border-b border-purple-900/40">
                        <input
                            autoFocus
                            type="text"
                            value={fontSearch}
                            onChange={e => setFontSearch(e.target.value)}
                            placeholder="Search fonts…"
                            className="w-full bg-[#2d1b4e] text-purple-200 text-[11px] border border-purple-800/40 rounded-lg px-2.5 py-1.5 outline-none focus:border-purple-500 placeholder:text-gray-600"
                        />
                    </div>
                    {/* Font list — each item renders in its own typeface */}
                    <div className="overflow-y-auto max-h-48 py-1">
                        {filtered.map(font => (
                            <button
                                key={font}
                                type="button"
                                onClick={() => {
                                    onChange(font === 'Default (System)' ? '' : font);
                                    setFontOpen(false);
                                    setFontSearch('');
                                }}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-purple-900/50 ${(currentFont === font || (font === 'Default (System)' && !currentFont))
                                    ? 'bg-purple-800/60 text-white'
                                    : 'text-gray-300'
                                    }`}
                                style={{ fontFamily: font !== 'Default (System)' ? `'${font}', sans-serif` : 'inherit' }}
                            >
                                {font}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <p className="text-center text-gray-600 text-[10px] py-4">No fonts found</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

/** Mini vertical-bars thumbnail for design template (book-spine style). */
function DesignTemplateThumb({ active = true, style = {} }) {
    const color = active ? '#c084fc' : 'rgba(148,163,184,0.5)';
    const heights = [10, 14, 8];
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 14, ...style }}>
            {heights.map((h, i) => (
                <div key={i} style={{ width: 3, height: h, backgroundColor: color, borderRadius: 1 }} />
            ))}
        </div>
    );
}

/** Mini grid thumbnail: up to 4 cells for column count. */
function MiniGridThumb({ cols, active = true }) {
    const n = Math.min(Math.max(1, parseInt(cols, 10) || 1), 4);
    const color = active ? '#c084fc' : 'rgba(148,163,184,0.5)';
    return (
        <div style={{ display: 'flex', gap: 2, alignItems: 'stretch', height: 14 }}>
            {Array.from({ length: n }).map((_, i) => (
                <div key={i} style={{ flex: 1, minWidth: 4, backgroundColor: color, borderRadius: 2 }} />
            ))}
        </div>
    );
}

/**
 * ── Column Selector (Desktop / Tablet / Mobile) ─────────────────────────────────
 * Dropdown per device: presets 1–8 + custom 9+, mini grid thumbnail, close on outside click.
 */
function ColumnSelector({ settings, setSettings, disabled }) {
    const [open, setOpen] = useState(null); // 'desktop' | 'tablet' | 'mobile' | null
    const [customVal, setCustomVal] = useState(''); // local custom input for 9+
    const panelRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const keys = [
        { key: 'col_desktop', label: 'DESKTOP', icon: '💻' },
        { key: 'col_tablet', label: 'TABLET', icon: '📱' },
        { key: 'col_mobile', label: 'MOBILE', icon: '📲' },
    ];
    const presets = [1, 2, 3, 4, 5, 6, 7, 8];
    const summary = `${settings.col_desktop} / ${settings.col_tablet} / ${settings.col_mobile}`;

    const setCol = (key, value) => {
        const v = Math.max(1, Math.min(24, parseInt(value, 10) || 1));
        setSettings(prev => ({ ...prev, [key]: v }));
        setCustomVal('');
        if (open) setOpen(null);
    };

    const currentVal = open ? (settings[open] || 1) : 1;
    const isCustom = currentVal > 8;

    const containerStyle = {
        background: '#1a1030',
        border: '1px solid rgba(168,85,247,0.12)',
        borderRadius: 10,
        padding: '10px 12px',
        fontFamily: '"DM Sans", sans-serif',
    };
    const headerStyle = { fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
    const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 8 };
    const rowStyleLast = { ...rowStyle, marginBottom: 0 };
    const labelStyle = { fontSize: 10, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 6 };
    const triggerStyle = {
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
        background: 'rgba(45,27,78,0.8)', border: '1px solid rgba(168,85,247,0.2)', cursor: disabled ? 'not-allowed' : 'pointer',
        minWidth: 120, color: '#c084fc', fontSize: 11, fontFamily: '"DM Sans", sans-serif',
    };
    const triggerNumStyle = { fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' };

    if (disabled) {
        return (
            <div style={containerStyle}>
                <div style={headerStyle}>
                    <span>COLUMNS</span>
                    <span style={{ color: '#c084fc', ...triggerNumStyle }}>{summary}</span>
                </div>
                {keys.map(({ key, label, icon }, i) => (
                    <div key={key} style={i < keys.length - 1 ? rowStyle : rowStyleLast}>
                        <span style={labelStyle}>{icon} {label}</span>
                        <div style={{ ...triggerStyle, opacity: 0.6 }}><MiniGridThumb cols={settings[key]} active={false} /><span style={triggerNumStyle}>{settings[key]} columns</span></div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={containerStyle} ref={panelRef}>
            <div style={headerStyle}>
                <span>COLUMNS</span>
                <span style={{ color: '#c084fc', ...triggerNumStyle }}>{summary}</span>
            </div>
            {keys.map(({ key, label, icon }, rowIndex) => {
                const isOpen = open === key;
                const val = settings[key] || 1;
                return (
                    <div key={key} style={rowIndex < keys.length - 1 ? rowStyle : rowStyleLast}>
                        <span style={labelStyle}>{icon} {label}</span>
                        <div style={{ position: 'relative' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    if (isOpen) setOpen(null);
                                    else { setCustomVal(''); setOpen(key); }
                                }}
                                style={triggerStyle}
                            >
                                <MiniGridThumb cols={val} active />
                                <span style={triggerNumStyle}>{val} column{val !== 1 ? 's' : ''}</span>
                                <svg style={{ width: 12, height: 12, marginLeft: 4, opacity: 0.8 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                            </button>
                            {isOpen && (
                                <div
                                    style={{
                                        position: 'absolute', right: 0, top: '100%', marginTop: 4, zIndex: 50,
                                        background: '#1a1030', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
                                        minWidth: 160, padding: 8, fontFamily: '"DM Sans", sans-serif',
                                    }}
                                >
                                    {presets.map((n) => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setCol(key, n)}
                                            style={{
                                                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', background: val === n ? 'rgba(192,132,252,0.2)' : 'transparent', color: val === n ? '#c084fc' : '#d1d5db', fontSize: 11, textAlign: 'left', fontFamily: 'inherit',
                                            }}
                                        >
                                            <MiniGridThumb cols={n} active={val === n} />
                                            <span style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' }}>{n} column{n !== 1 ? 's' : ''}</span>
                                            {val === n && <span style={{ marginLeft: 'auto', color: '#c084fc' }}>✓</span>}
                                        </button>
                                    ))}
                                    <div style={{ borderTop: '1px solid rgba(168,85,247,0.15)', marginTop: 6, paddingTop: 6 }}>
                                        <label style={{ fontSize: 10, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Custom (9+)</label>
                                        <input
                                            type="number"
                                            min={9}
                                            max={24}
                                            value={customVal !== '' ? customVal : (isCustom ? String(currentVal) : '')}
                                            onChange={(e) => {
                                                const v = e.target.value;
                                                setCustomVal(v);
                                                const num = parseInt(v, 10);
                                                if (!isNaN(num) && num >= 9) setSettings(prev => ({ ...prev, [key]: num }));
                                            }}
                                            placeholder="9–24"
                                            style={{
                                                width: '100%', boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(45,27,78,0.6)', color: '#e2e8f0', fontSize: 11, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace',
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/** Mini book-spine thumbnail: 5 vertical bars of varying heights, colorful. */
const SPINE_COLORS = ['#a78bfa', '#c084fc', '#e879f9', '#f472b6', '#818cf8']; // violet, purple, fuchsia, pink, indigo
function BookSpineThumb({ active = true, style = {} }) {
    const heights = [12, 18, 14, 20, 10];
    const opacity = active ? 1 : 0.6;
    return (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 20, ...style }}>
            {heights.map((h, i) => (
                <div key={i} style={{ width: 3, height: h, backgroundColor: SPINE_COLORS[i % SPINE_COLORS.length], opacity, borderRadius: 1 }} />
            ))}
        </div>
    );
}

/**
 * ── Books to Show dropdown ─────────────────────────────────────────────────────
 * Trigger: book-spine thumbnail + "12 books" or "Show All". Panel: Show All row, preset grid (4,6,8,12,16,24), custom input.
 */
function BooksToShowDropdown({ settings, setSettings }) {
    const [open, setOpen] = useState(false);
    const [customInput, setCustomInput] = useState('');
    const panelRef = useRef(null);
    const showAll = settings.show_all === true || settings.show_all === 'true' || settings.show_all === 'yes';
    const limit = Math.max(1, parseInt(settings.limit, 10) || 12);
    const presets = [4, 6, 8, 12, 16, 24];
    const isPreset = presets.includes(limit);

    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const summary = showAll ? 'All' : `${limit} books`;
    const containerStyle = { background: '#1a1030', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '10px 12px', fontFamily: '"DM Sans", sans-serif' };
    const headerStyle = { fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
    const triggerStyle = {
        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, width: '100%', boxSizing: 'border-box',
        background: 'rgba(30,19,53,0.9)', border: '1px solid rgba(168,85,247,0.2)', cursor: 'pointer', color: '#e2e8f0', fontSize: 11, fontFamily: '"DM Sans", sans-serif',
    };
    const numStyle = { fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' };

    return (
        <div style={containerStyle} ref={panelRef}>
            <div style={headerStyle}>
                <span>BOOKS TO SHOW</span>
                <span style={{ color: '#c084fc', ...numStyle }}>{showAll ? 'All' : `${limit} books`}</span>
            </div>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                style={triggerStyle}
            >
                <BookSpineThumb active />
                <span style={numStyle}>{summary}</span>
                <svg style={{ width: 12, height: 12, marginLeft: 'auto', opacity: 0.8, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div
                    style={{
                        marginTop: 8, padding: 10, borderRadius: 10, background: '#1e1335', border: '1px solid rgba(168,85,247,0.2)', fontFamily: '"DM Sans", sans-serif',
                    }}
                >
                    {/* Show All row */}
                    <button
                        type="button"
                        onClick={() => { setSettings((prev) => ({ ...prev, show_all: true })); setCustomInput(''); }}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: showAll ? 'rgba(192,132,252,0.2)' : 'transparent', color: showAll ? '#c084fc' : '#e2e8f0', fontSize: 12, textAlign: 'left', fontFamily: 'inherit',
                        }}
                    >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <BookSpineThumb active={showAll} />
                            <span style={{ fontSize: 16, marginLeft: 4 }}>∞</span>
                        </span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>Show All</div>
                            <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>Display every book.</div>
                        </div>
                        {showAll && <span style={{ color: '#c084fc' }}>✓</span>}
                    </button>
                    {/* Preset grid */}
                    <div style={{ fontSize: 10, color: '#9ca3af', letterSpacing: '0.06em', marginTop: 12, marginBottom: 6 }}>PRESET</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        {presets.map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => { setCustomInput(''); setSettings((prev) => ({ ...prev, show_all: false, limit: n })); }}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 6px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                    background: !showAll && limit === n ? 'rgba(192,132,252,0.25)' : 'transparent', color: !showAll && limit === n ? '#c084fc' : '#d1d5db', fontSize: 11, fontFamily: 'inherit',
                                }}
                            >
                                <BookSpineThumb active={!showAll && limit === n} />
                                <span style={numStyle}>{n}</span>
                            </button>
                        ))}
                    </div>
                    {/* Custom input */}
                    <div style={{ borderTop: '1px solid rgba(168,85,247,0.15)', marginTop: 10, paddingTop: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <label style={{ fontSize: 11, color: '#e2e8f0' }}>Custom:</label>
                            <input
                                type="number"
                                min={1}
                                max={999}
                                value={showAll ? '' : (customInput !== '' ? customInput : (isPreset ? '' : String(limit)))}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setCustomInput(v);
                                    const num = parseInt(v, 10);
                                    if (!isNaN(num) && num >= 1) setSettings((prev) => ({ ...prev, show_all: false, limit: Math.min(999, num) }));
                                }}
                                placeholder="e.g. 30"
                                style={{
                                    width: 80, boxSizing: 'border-box', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(168,85,247,0.3)', background: 'rgba(45,27,78,0.6)', color: '#e2e8f0', fontSize: 11, fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace',
                                }}
                            />
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>books</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/** Display mode options with SVG icon key. */
const DISPLAY_MODES = [
    { id: 'grid', label: 'Grid', icon: 'grid' },
    { id: 'list', label: 'List', icon: 'list' },
    { id: 'masonry', label: 'Masonry', icon: 'masonry' },
    { id: 'slider', label: 'Slider', icon: 'slider' },
];

/** Design template options per layout. badge: 'PRO' | 'NEW' | undefined */
const DESIGN_TEMPLATES_BY_LAYOUT = {
    grid: [
        { value: 'design-1', label: 'Classic Card' },
        { value: 'design-2', label: 'Modern Clean', badge: 'PRO' },
        { value: 'design-3', label: 'Minimalist', badge: 'PRO' },
        { value: 'design-3d-shelf', label: '3D Shelf Perspective', badge: 'PRO' },
        { value: 'design-slide-out', label: 'Dynamic Slide-Out', badge: 'PRO' },
        { value: 'design-negative-space', label: 'Negative Space', badge: 'PRO' },
        { value: 'design-brutalist', label: 'Brutalist Contrast', badge: 'PRO' },
        { value: 'design-flip3d', label: '3D Flip Book', badge: 'PRO' },
    ],
    list: [
        { value: 'design-1', label: 'Standard List' },
        { value: 'design-2', label: 'Compact Row', badge: 'PRO' },
    ],
    masonry: [
        { value: 'design-1', label: 'Pinterest Style', badge: 'PRO' },
        { value: 'design-2', label: 'Metro Grid', badge: 'PRO' },
    ],
    slider: [
        { value: 'design-1', label: 'Carousel', badge: 'PRO' },
        { value: 'design-2', label: 'Cover Flow', badge: 'PRO' },
    ],
};

/**
 * ── Display Mode + Design Template (two sections) ───────────────────────────────
 * Display Mode: header + 4 card-style buttons (Grid, List, Masonry, Slider) with SVG icons.
 * Design Template: header (+ PRO badge if current is PRO) + custom dropdown with mini thumbnail.
 * Inline styles only; closes on outside click.
 */
function DisplayModeAndTemplate({ settings, setSettings, isPro, onLayoutChange }) {
    const [templateOpen, setTemplateOpen] = useState(false);
    const templateRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (templateRef.current && !templateRef.current.contains(e.target)) setTemplateOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const layout = settings.layout || 'grid';
    const design = settings.design || 'design-1';
    const templates = DESIGN_TEMPLATES_BY_LAYOUT[layout] || DESIGN_TEMPLATES_BY_LAYOUT.grid;
    const currentTemplate = templates.find((t) => t.value === design) || templates[0];
    const currentTemplateIsPro = currentTemplate && currentTemplate.badge === 'PRO' && !isPro;

    const bg = '#1a1030';
    const panelBg = '#1e1335';
    const accent = '#c084fc';
    const border = 'rgba(168,85,247,0.12)';
    const fontFamily = '"DM Sans", sans-serif';
    const headerStyle = { fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 };
    const modeNameStyle = { fontSize: 11, color: accent, fontFamily: 'ui-monospace, monospace', textTransform: 'none' };

    const setDesign = (value) => {
        setSettings((prev) => ({ ...prev, design: value }));
        setTemplateOpen(false);
    };

    return (
        <div style={{ fontFamily }}>
            {/* DISPLAY MODE */}
            <div style={{ marginBottom: 16 }}>
                <div style={headerStyle}>
                    <span>DISPLAY MODE</span>
                    <span style={modeNameStyle}>{DISPLAY_MODES.find((m) => m.id === layout)?.label || layout}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {DISPLAY_MODES.map((mode) => {
                        const isActive = layout === mode.id;
                        return (
                            <button
                                key={mode.id}
                                type="button"
                                onClick={() => onLayoutChange(mode.id)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                                    padding: '10px 6px', borderRadius: 10, border: `1px solid ${isActive ? accent : border}`,
                                    background: isActive ? `linear-gradient(180deg, rgba(192,132,252,0.25) 0%, rgba(192,132,252,0.08) 100%)` : panelBg,
                                    boxShadow: isActive ? `0 0 12px ${accent}40` : 'none',
                                    cursor: 'pointer', color: isActive ? '#fff' : '#9ca3af', fontSize: 10, fontWeight: 600, fontFamily,
                                    position: 'relative', minHeight: 56,
                                }}
                                onMouseEnter={(e) => {
                                    if (isActive) return;
                                    e.currentTarget.style.borderColor = accent;
                                    e.currentTarget.style.background = 'rgba(192,132,252,0.08)';
                                }}
                                onMouseLeave={(e) => {
                                    if (isActive) return;
                                    e.currentTarget.style.borderColor = border;
                                    e.currentTarget.style.background = panelBg;
                                }}
                            >
                                {isActive && (
                                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '60%', height: 2, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, borderRadius: 1 }} />
                                )}
                                {mode.icon === 'grid' && (
                                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                                )}
                                {mode.icon === 'list' && (
                                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" /></svg>
                                )}
                                {mode.icon === 'masonry' && (
                                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="6" height="8" rx="1" /><rect x="3" y="13" width="6" height="8" rx="1" /><rect x="15" y="3" width="6" height="14" rx="1" /></svg>
                                )}
                                {mode.icon === 'slider' && (
                                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="16" height="12" rx="1" /><path d="M18 12h4" /><path d="M18 9v6" /></svg>
                                )}
                                <span>{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* DESIGN TEMPLATE */}
            <div style={{ position: 'relative' }} ref={templateRef}>
                <div style={headerStyle}>
                    <span>DESIGN TEMPLATE</span>
                    {currentTemplateIsPro && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#0f172a', padding: '3px 8px', borderRadius: 9999, letterSpacing: '0.02em' }}>PRO</span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={() => setTemplateOpen((o) => !o)}
                    style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
                        background: panelBg, border: `1px solid ${border}`, cursor: 'pointer', color: '#e2e8f0', fontSize: 12, fontFamily,
                    }}
                >
                    <DesignTemplateThumb active />
                    <span style={{ flex: 1, textAlign: 'left' }}>{currentTemplate?.label || design}</span>
                    {currentTemplate?.badge === 'PRO' && !isPro && (
                        <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#0f172a', padding: '3px 8px', borderRadius: 9999, letterSpacing: '0.02em' }}>PRO</span>
                    )}
                    <svg style={{ width: 14, height: 14, opacity: 0.8, transform: templateOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                {templateOpen && (
                    <div
                        style={{
                            position: 'absolute', left: 0, right: 0, top: '100%', marginTop: 6, zIndex: 50,
                            background: panelBg, border: `1px solid ${border}`, borderRadius: 10, boxShadow: '0 10px 25px rgba(0,0,0,0.4)', overflow: 'hidden', fontFamily,
                        }}
                    >
                        {templates.map((t) => {
                            const isActive = design === t.value;
                            const locked = t.badge === 'PRO' && !isPro;
                            return (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => !locked && setDesign(t.value)}
                                    style={{
                                        width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', border: 'none', cursor: locked ? 'not-allowed' : 'pointer',
                                        background: isActive ? 'rgba(192,132,252,0.2)' : 'transparent', color: isActive ? accent : '#e2e8f0', fontSize: 12, textAlign: 'left', fontFamily: 'inherit',
                                        opacity: locked ? 0.5 : 1,
                                    }}
                                >
                                    <DesignTemplateThumb active={isActive} />
                                    <span style={{ flex: 1 }}>{t.label}</span>
                                    {t.badge === 'PRO' && !isPro && (
                                        <span style={{ fontSize: 10, fontWeight: 700, background: '#f59e0b', color: '#0f172a', padding: '3px 8px', borderRadius: 9999, letterSpacing: '0.02em' }}>PRO</span>
                                    )}
                                    {t.badge === 'NEW' && (
                                        <span style={{ fontSize: 10, fontWeight: 700, background: '#4ade80', color: '#052e16', padding: '3px 8px', borderRadius: 9999, letterSpacing: '0.02em' }}>NEW</span>
                                    )}
                                    {isActive && <span style={{ color: accent }}>✓</span>}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

/**
 * ── Universal Data Normalizer ──────────────────────────────────────────────────
 * Maps raw data from any of the 4 sources into a standard shape.
 * The card renderer ONLY reads standard_* fields so styling is source-agnostic.
 */
function getNormalizedData(raw, source, options = {}) {
    const defaultImg = window.rmssAdminSettings?.default_book_image || '';
    switch (source) {
        case 'vault': {
            const lab = options?.labels || window.rmssAdminSettings?.labels || {};
            const viewDetailsLabel = lab.view_details || lab.custom_button || 'View Details';
            return {
                id: raw.id,
                standard_title: raw.title?.rendered || raw.title || 'Untitled',
                standard_author: raw.meta?._ss_vault_author || raw.author || '',
                standard_price: raw.meta?._ss_vault_price || raw.price || '',
                standard_image: raw._embedded?.['wp:featuredmedia']?.[0]?.source_url || raw.image || defaultImg,
                standard_rating: raw.meta?._ss_vault_rating || raw.rating || 0,
                standard_summary: raw.meta?._ss_vault_subtitle || raw.summary || '',
                old_price: raw.meta?._ss_vault_old_price || raw.old_price || '',
                ribbon: raw.meta?._ss_vault_ribbon || raw.ribbon || '',
                enriched_by: raw.enriched_by || null,
                asin: raw.asin || null,
                isbn: raw.isbn || null,
                standard_permalink: raw.link || '#',
                standard_button_text: viewDetailsLabel,
                standard_button_link: raw.link || '#',
                look_inside_url: raw.meta?._ss_vault_look_inside_url || '',
            };
        }
        case 'google_books':
            return {
                id: raw.id,
                standard_title: raw.ss_book_title || raw.title || 'Unknown Title',
                standard_author: raw.ss_book_author || raw.author || '',
                standard_price: raw.price || '',
                standard_image: raw.ss_book_cover_url || raw.image || defaultImg,
                standard_rating: raw.rating || 0,
                standard_summary: raw.ss_book_summary || raw.summary || '',
                enriched_by: raw.enriched_by || null,
                isbn: raw.ss_book_isbn || raw.isbn || null,
                pages: raw.ss_book_pages || raw.pageCount || null,
                genre: raw.ss_book_genre || null,
                year: raw.ss_published_year || null,
                full_summary: raw.full_summary || raw.summary || '',
                standard_permalink: raw.button_link || raw.link || '#',
                standard_button_text: raw.button_text || 'Buy Now',
                standard_button_link: raw.button_link || raw.link || '',
            };
        case 'amazon':
            const asin = raw.asin || raw.id;
            const tag = options.amazon_associate_tag || '';
            const amazonLink = asin ? `https://www.amazon.com/dp/${asin}${tag ? `?tag=${tag}` : ''}` : '';
            return {
                id: asin,
                standard_title: raw.title || '',
                standard_author: raw.author || '',
                standard_price: raw.price || '',
                standard_image: raw.image || defaultImg,
                standard_rating: raw.rating || 0,
                standard_summary: raw.summary || '',
                enriched_by: raw.enriched_by || null,
                asin: asin,
                standard_permalink: amazonLink,
                standard_button_text: 'Buy on Amazon',
                standard_button_link: amazonLink,
            };
        default: { // woocommerce
            const baseUrl = raw.permalink || raw.link || '#';
            const addToCartUrl = baseUrl !== '#' ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}add-to-cart=${raw.id}` : '#';
            return {
                id: raw.id,
                standard_title: raw.title || '',
                standard_author: raw.author || raw.authors || '',
                standard_price: raw.price || '',
                standard_image: raw.image || raw.thumbnail || defaultImg,
                standard_rating: raw.rating || 0,
                standard_summary: raw.summary || '',
                enriched_by: raw.enriched_by || null,
                standard_permalink: baseUrl,
                standard_button_text: 'Add to Cart',
                standard_button_link: addToCartUrl,
                look_inside_url: raw.look_inside_url || '',
                regular_price: raw.regular_price != null ? Number(raw.regular_price) : null,
                sale_price: raw.sale_price != null ? Number(raw.sale_price) : null,
                ribbon: raw.badge || raw.ribbon || '',
            };
        }
    }
}

const generateDynamicCSS = () => {
    return `
    /* ── Glow Effect for Selected Book ── */
    @keyframes focus-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(124, 58, 237, 0.2), 0 0 10px rgba(124, 58, 237, 0.1); border-color: rgba(124, 58, 237, 0.4); }
        50% { box-shadow: 0 0 20px rgba(124, 58, 237, 0.6), 0 0 35px rgba(124, 58, 237, 0.3); border-color: rgba(124, 58, 237, 0.8); }
    }
    .ss-focused-item {
        animation: focus-glow 2s infinite ease-in-out !important;
        outline: 2px solid rgba(124, 58, 237, 0.5) !important;
        outline-offset: 4px;
        z-index: 20 !important;
        position: relative;
    }
    `;
};

const stripHtmlTags = (str) => {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '');
};

/** Margin object/number → CSS value "Tpx Rpx Bpx Lpx". */
function marginToCss(m) {
    if (m == null) return '0 0 0 0';
    if (typeof m === 'number') return `${m}px ${m}px ${m}px ${m}px`;
    const same = m.sameForAll !== false;
    const t = m.top ?? 0, r = m.right ?? 0, b = m.bottom ?? 0, l = m.left ?? 0;
    if (same) return `${t}px ${t}px ${t}px ${t}px`;
    return `${t}px ${r}px ${b}px ${l}px`;
}

/** Padding object/number → CSS value "Tpx Rpx Bpx Lpx". */
function paddingToCss(p) {
    if (p == null) return '16px 16px 16px 16px';
    if (typeof p === 'number') return `${p}px ${p}px ${p}px ${p}px`;
    const same = p.sameForAll !== false;
    const t = p.top ?? 16, r = p.right ?? 16, b = p.bottom ?? 16, l = p.left ?? 16;
    if (same) return `${t}px ${t}px ${t}px ${t}px`;
    return `${t}px ${r}px ${b}px ${l}px`;
}

/** Border-radius object/number → CSS value "TLpx TRpx BRpx BLpx". */
function radiusToCss(r) {
    if (r == null) return '12px 12px 12px 12px';
    if (typeof r === 'number') return `${r}px ${r}px ${r}px ${r}px`;
    const same = r.sameForAll !== false;
    const tl = r.topLeft ?? 12, tr = r.topRight ?? 12, br = r.bottomRight ?? 12, bl = r.bottomLeft ?? 12;
    if (same) return `${tl}px ${tl}px ${tl}px ${tl}px`;
    return `${tl}px ${tr}px ${br}px ${bl}px`;
}

/** Border-width object/number → CSS value "Tpx Rpx Bpx Lpx". */
function borderWidthToCss(b) {
    if (b == null) return '0 0 0 0';
    if (typeof b === 'number') return `${b}px ${b}px ${b}px ${b}px`;
    const same = b.sameForAll !== false;
    const t = b.top ?? 0, r = b.right ?? 0, b_ = b.bottom ?? 0, l = b.left ?? 0;
    if (same) return `${t}px ${t}px ${t}px ${t}px`;
    return `${t}px ${r}px ${b_}px ${l}px`;
}

/** Get badge text: ribbon first, else auto discount % from regular_price/sale_price or parsed price. */
function getBadgeText(product) {
    if (!product) return null;
    const ribbon = (product.ribbon || product.standard_ribbon || '').toString().trim();
    if (ribbon) return ribbon;
    return getDiscountBadgeText(product);
}

/** Discount % only (from prices). Used so discount badge shows even when product has a ribbon. */
function getDiscountBadgeText(product) {
    if (!product) return null;
    const regularNum = product.regular_price != null ? Number(product.regular_price) : null;
    const saleNum = product.sale_price != null ? Number(product.sale_price) : null;
    if (regularNum != null && saleNum != null && regularNum > saleNum && regularNum > 0) {
        const pct = Math.round(((regularNum - saleNum) / regularNum) * 100);
        if (pct > 0) return pct + '% OFF';
    }
    const priceStr = (product.standard_price || product.price || '').toString();
    const oldPriceVal = parseFloat(String(product.old_price || '').replace(/[^\d.-]/g, '')) || null;
    let regular = oldPriceVal;
    let sale = null;
    if (priceStr) {
        const nums = priceStr.replace(/<[^>]+>/g, ' ').replace(/[^\d.\s]/g, ' ').split(/\s+/).map(s => parseFloat(s)).filter(n => !isNaN(n) && n > 0);
        if (nums.length >= 2) {
            regular = regular ?? Math.max(nums[0], nums[1]);
            sale = Math.min(nums[0], nums[1]);
        } else if (nums.length === 1) {
            sale = nums[0];
        }
    }
    if (regular != null && sale != null && regular > sale && regular > 0) {
        const pct = Math.round(((regular - sale) / regular) * 100);
        if (pct > 0) return pct + '% OFF';
    }
    return null;
}

const ShortcodeArchitect = () => {
    const isPro = !!window.rmssAdminSettings?.isPro;
    const shelfSage_license_status = isPro ? 'active' : 'inactive';

    // ── Components ──
    const SkeletonCard = ({ layout }) => {
        const isGrid = layout === 'grid' || layout === 'masonry';
        return (
            <div className={`ss-card-container ss-skeleton opacity-60 rounded-2xl ${isGrid ? 'aspect-[2/3]' : 'h-40 w-full flex gap-4'}`}>
                {!isGrid && <div className="w-32 h-64 bg-gray-200/20 rounded-xl ss-skeleton" />}
                <div className="flex-1 space-y-4 py-4 px-2">
                    <div className="h-4 bg-gray-200/30 rounded w-3/4 ss-skeleton" />
                    <div className="h-3 bg-gray-200/20 rounded w-1/2 ss-skeleton" />
                    <div className="mt-8 space-y-2">
                        <div className="h-2 bg-gray-200/10 rounded w-full ss-skeleton" />
                        <div className="h-2 bg-gray-200/10 rounded w-full ss-skeleton" />
                    </div>
                </div>
            </div>
        );
    };

/** Get dominant color from image URL (for Negative Space color flood). Returns hex string or fallback. */
function getDominantColorFromUrl(url) {
    return new Promise((resolve) => {
        if (!url) { resolve('#8b7355'); return; }
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                const size = 32;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve('#8b7355'); return; }
                ctx.drawImage(img, 0, 0, size, size);
                const data = ctx.getImageData(0, 0, size, size).data;
                let r = 0, g = 0, b = 0, count = 0;
                for (let i = 0; i < data.length; i += 4) {
                    const a = data[i + 3];
                    if (a > 128) {
                        r += data[i];
                        g += data[i + 1];
                        b += data[i + 2];
                        count++;
                    }
                }
                if (count === 0) { resolve('#8b7355'); return; }
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                const hex = '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
                resolve(hex);
            } catch (_) {
                resolve('#8b7355');
            }
        };
        img.onerror = () => resolve('#8b7355');
        img.src = url;
    });
}

    // Initial data_source from URL (persist across reload)
    const getInitialDataSource = () => {
        const fromPhp = window.rmssAdminSettings?.currentScreen?.source;
        if (fromPhp && ['woocommerce', 'google_books', 'amazon', 'vault', 'smart_ingester'].includes(fromPhp)) return fromPhp;
        const params = new URLSearchParams(window.location.search);
        const fromUrl = params.get('source');
        if (fromUrl && ['woocommerce', 'google_books', 'amazon', 'vault', 'smart_ingester'].includes(fromUrl)) return fromUrl;
        return 'woocommerce';
    };

    // State
    const [settings, setSettings] = useState({
        layout: 'grid',
        design: 'design-1',
        col_desktop: 4,
        col_tablet: 3,
        col_mobile: 1,
        masonry_cols: 3,
        query_type: 'latest', // now represents 'Source Type'
        term_slug: '', // stores the selected term slug (e.g. 'fiction', 'tolkien')
        limit: 12,
        show_all: false,
        products: [], // Specific IDs
        selectedProducts: [],
        sort_by: 'date',     // date | title | modified | price | rating | rand
        sort_order: 'desc',  // asc | desc

        // Removed separate genre/author/publisher/category strings in favor of generic term_slug
        // but keeping them might be safer for backward compat if needed, 
        // OR we just map query_type + term_slug to the shortcode params.

        // Styling Defaults (box_padding, border_radius, box_border_width as 4-value objects below)
        grid_gap: 24,
        image_width: 100,
        image_width_unit: '%',
        image_height: 100,
        image_height_unit: '%',

        // 3D Flip Book Settings
        flip3d_depth: 30,
        flip3d_perspective: 1200,
        flip3d_page_color: '#fffef7',
        flip3d_finish: 'glossy',

        // Data Source
        data_source: getInitialDataSource(), // 'woocommerce' | 'google_books' | 'amazon' | 'vault' | 'smart_ingester'
        isbn_input: '',
        isbn_results: [],           // books fetched via Google Books ISBN lookup
        auto_create_product: false, // PRO: auto-create WC draft product on ISBN fetch

        // Amazon
        amazon_query: '',
        amazon_search_type: 'keywords', // 'keywords' | 'asin'
        amazon_associate_tag: '',
        amazon_results: [],

        // Vault Query (Author, Publisher, Category, Genre - text filter)
        vault_query_author: '',
        vault_query_publisher: '',
        vault_query_category: '',
        vault_query_genre: '',

        // Toggles
        show_title: true,
        show_price: true,
        show_rating: true,
        show_image: true,
        show_cart: true,
        show_author_badge: true,
        show_look_inside: true,

        // Ingested Data Sync
        ingested_data: null,
        show_summary: false,

        // ── Universal Typography (per element) ─────────────────────────────────
        typo_title: { font: '', size: 16, weight: '700', lineHeight: 1.3, textTransform: 'none' },
        typo_author: { font: '', size: 12, weight: '400', lineHeight: 1.4, textTransform: 'none' },
        typo_price: { font: '', size: 15, weight: '700', lineHeight: 1.2, textTransform: 'none' },
        typo_button: { font: '', size: 13, weight: '700', textTransform: 'none' },
        typo_look_inside: { font: '', size: 12, weight: '700', lineHeight: 1.2, textTransform: 'none' },

        // ── Universal Color States (per element) ───────────────────────────────
        color_title: { text: '#111827', hoverText: '#7c3aed', bg: 'transparent', hoverBg: 'transparent' },
        color_author: { text: '#6b7280', hoverText: '#7c3aed', bg: 'transparent', hoverBg: 'transparent' },
        color_price: { text: '#7c3aed', oldText: '#9ca3af', hoverText: '#ffffff', bg: 'transparent', hoverBg: '#7c3aed' },
        color_button: { text: '#ffffff', hoverText: '#ffffff', bg: '#2563eb', hoverBg: '#1d4ed8' },
        color_look_inside: { text: '#2563eb', hoverText: '#ffffff', bg: 'rgba(255,255,255,0.92)', hoverBg: '#eff6ff' },
        color_container: { bg: '#ffffff', hoverBg: '#f9f5ff' },
        shelf_hover_box_opacity: 0.96, // 3D Shelf hover popup background opacity (0–1)

        // ── Box Model (containers) ─────────────────────────────────────────────
        button_border: { top: 0, right: 0, bottom: 0, left: 0, unit: 'px', color: 'transparent', sameForAll: true },
        button_radius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12, unit: 'px', sameForAll: true },
        look_inside_padding: { top: 8, right: 8, bottom: 8, left: 8, sameForAll: true },
        look_inside_radius: { topLeft: 9999, topRight: 9999, bottomRight: 9999, bottomLeft: 9999, sameForAll: true },
        look_inside_border: { top: 1, right: 1, bottom: 1, left: 1, unit: 'px', color: 'rgba(37,99,235,0.3)', sameForAll: true },
        look_inside_icon_size: 12,
        look_inside_icon_color: { text: '', hoverText: '' }, // '' = inherit from button text color
        look_inside_icon_gap: 4,
        box_padding: { top: 16, right: 16, bottom: 16, left: 16, sameForAll: true },
        box_margin: 0,
        border_radius: { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12, sameForAll: true },
        box_border_width: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },

        // ── Element margins (per element: same or T/R/B/L) ─────────────────────
        margin_title: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
        margin_author: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
        margin_price: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
        margin_rating: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
        margin_image: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
        margin_cart: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
        margin_look_inside: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
        margin_badge: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
        margin_summary: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },

        // ── One-click content alignment (Designer) ─────────────────────────────
        card_alignment: 'center', // 'left' | 'center' | 'right'

        // ── Look Inside button position (Pro) ─────────────────────────────────
        look_inside_btn_position: window.rmssAdminSettings?.look_inside_btn_position || 'bottom-left',
        look_inside_btn_width: 'full', // 'full' | 'inline' — full = w-full, inline = content width
        look_inside_btn_align: 'center', // 'left' | 'center' | 'right' — text alignment when full width

        // ── Discount Badge (% OFF) — independent ─────────────────────────────
        show_badge: true,
        badge_design: 'scalloped',
        badge_position: 'top-right', // discount often top-right
        badge_bg_color: '#dc2626',
        badge_text_color: '#ffffff',
        // ── Ribbon Badge (New / custom ribbon) — independent, full styling ──
        show_ribbon_badge: true,
        ribbon_position: 'top-left',
        typo_ribbon: { font: '', size: 12, weight: '700', lineHeight: 1.2, textTransform: 'none' },
        color_ribbon: { text: '#ffffff', hoverText: '#ffffff', bg: '#dc2626', hoverBg: '#b91c1c' },
        ribbon_border: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true, color: 'transparent', unit: 'px' },
        ribbon_radius: 8,
    });

    const [activeSection, setActiveSection] = useState('fetch');
    const [previewDevice, setPreviewDevice] = useState('desktop');
    const [previewProducts, setPreviewProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveTitle, setSaveTitle] = useState('');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [currentShortcodeId, setCurrentShortcodeId] = useState(null);
    const [saveStatus, setSaveStatus] = useState(null);
    const [saveError, setSaveError] = useState('');
    const [lastSavedShortcode, setLastSavedShortcode] = useState('');

    // 3D Flip Book
    const [flippedCardId, setFlippedCardId] = useState(null);

    // Negative Space: dominant color per product (from cover) for hover color flood
    const [negativeSpaceColors, setNegativeSpaceColors] = useState({});
    const negativeSpaceRequestedRef = useRef({});

    // Look Inside preview modal
    const [previewLookInside, setPreviewLookInside] = useState({ open: false, url: '', title: '', thumbnail: '', authors: '' });
    const [previewReaderStyle, setPreviewReaderStyle] = useState(window.rmssAdminSettings?.pdf_reader_style || 'style-1');
    const [previewBtnPosition, setPreviewBtnPosition] = useState(window.rmssAdminSettings?.look_inside_btn_position || 'bottom-left');

    // Keep reader style + button position in sync when SettingsApp saves new settings
    useEffect(() => {
        const onSettingsUpdate = (e) => {
            if (e.detail?.pdf_reader_style) setPreviewReaderStyle(e.detail.pdf_reader_style);
            if (e.detail?.look_inside_btn_position) setPreviewBtnPosition(e.detail.look_inside_btn_position);
        };
        window.addEventListener('shelfsage-settings-saved', onSettingsUpdate);
        return () => window.removeEventListener('shelfsage-settings-saved', onSettingsUpdate);
    }, []);

    // Persist data_source to URL so reload keeps the selected source
    useEffect(() => {
        const url = new URL(window.location.href);
        const current = url.searchParams.get('source');
        if (settings.data_source !== current) {
            if (settings.data_source === 'woocommerce') {
                url.searchParams.delete('source');
            } else {
                url.searchParams.set('source', settings.data_source);
            }
            window.history.replaceState({}, '', url.toString());
        }
    }, [settings.data_source]);

    // Google Books ISBN lookup
    const [isbnLoading, setIsbnLoading] = useState(false);
    const [isbnError, setIsbnError] = useState('');

    // Amazon search
    const [amazonLoading, setAmazonLoading] = useState(false);
    const [amazonError, setAmazonError] = useState('');

    // Smart Refresh
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Smart Book Ingester State
    const [ingesterQuery, setIngesterQuery] = useState('');
    const [ingesterMaxResults, setIngesterMaxResults] = useState(1);
    const [ingesterLoading, setIngesterLoading] = useState(false);
    const [ingesterError, setIngesterError] = useState('');
    const [ingesterSelectedIndex, setIngesterSelectedIndex] = useState(0);
    const [applyLinkToAll, setApplyLinkToAll] = useState(false);

    // Terms State for Dropdowns
    const [availableTerms, setAvailableTerms] = useState([]);
    const [termsLoading, setTermsLoading] = useState(false);

    // ── VAULT STATE ──
    const [vaultAssets, setVaultAssets] = useState([]);
    const [vaultSearch, setVaultSearch] = useState('');
    const [vaultSelectedIds, setVaultSelectedIds] = useState([]);
    const [vaultLoading, setVaultLoading] = useState(false);

    // ── SPECIFIC ITEMS (WC product picker) STATE ──
    const [specificSearch, setSpecificSearch] = useState('');
    const [specificResults, setSpecificResults] = useState([]);
    const [specificSearching, setSpecificSearching] = useState(false);

    // ── UNIVERSAL DESIGN ENGINE STATE ──
    const [activeStylingTab, setActiveStylingTab] = useState('typography'); // 'typography' | 'colors' | 'boxmodel'
    const [activeStylingElement, setActiveStylingElement] = useState('title'); // 'title' | 'author' | 'price' | 'container'
    const [marginElementKey, setMarginElementKey] = useState('margin_title'); // which element's margin we're editing
    const googleFontsLinkRef = useRef(null);

    // Inject Google Fonts <link> dynamically whenever a font is set
    useEffect(() => {
        const fonts = [settings.typo_title.font, settings.typo_author.font, settings.typo_price.font, settings.typo_button?.font]
            .filter(Boolean)
            .map(f => f.trim().replace(/ /g, '+'));
        if (fonts.length === 0) return;
        const href = `https://fonts.googleapis.com/css2?${fonts.map(f => `family=${f}:wght@300;400;500;600;700;800;900`).join('&')}&display=swap`;
        if (!googleFontsLinkRef.current) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.id = 'ss-architect-google-fonts';
            link.href = href;
            document.head.appendChild(link);
            googleFontsLinkRef.current = link;
        } else {
            googleFontsLinkRef.current.href = href;
        }
        return () => { }; // keep the link alive across re-renders
    }, [settings.typo_title.font, settings.typo_author.font, settings.typo_price.font, settings.typo_button?.font]);

    // Negative Space: extract dominant color from each product cover when design is negative-space
    useEffect(() => {
        if (settings.design !== 'design-negative-space' || settings.layout !== 'grid' || !previewProducts.length) return;
        previewProducts.forEach((product) => {
            const url = product.standard_image;
            const key = `${product.id}-${url || ''}`;
            if (!url || negativeSpaceRequestedRef.current[key]) return;
            negativeSpaceRequestedRef.current[key] = true;
            getDominantColorFromUrl(url).then((color) => {
                setNegativeSpaceColors((prev) => ({ ...prev, [product.id]: color }));
            });
        });
    }, [settings.design, settings.layout, previewProducts]);

    /**
     * ── Dynamic CSS Generator ────────────────────────────────────────────────
     * Generates a <style> block for .ss-card-* classes from current settings.
     * Injected directly before the preview grid so changes are instant.
     */
    const generateDynamicCSS = () => {
        const { typo_title, typo_author, typo_price, typo_button, typo_look_inside, typo_ribbon,
            color_title, color_author, color_price, color_button, color_look_inside, color_container, color_ribbon,
            box_padding, border_radius, box_border_width, box_border_color, button_border, button_radius,
            look_inside_padding, look_inside_radius, look_inside_border,
            look_inside_icon_size, look_inside_icon_color, look_inside_icon_gap,
            margin_title, margin_author, margin_price, margin_rating, margin_image,
            margin_cart, margin_look_inside, margin_badge, margin_summary,
            ribbon_border, ribbon_radius } = settings;

        const fontRule = (font) => font ? `font-family: '${font}', sans-serif;` : '';
        const tb = typo_button || { font: '', size: 13, weight: '700', textTransform: 'none' };
        const cb = color_button || { text: '#ffffff', hoverText: '#ffffff', bg: '#2563eb', hoverBg: '#1d4ed8' };
        // Button border: support old (width) and new (top,right,bottom,left) format
        const bb = button_border || {};
        const bbUnit = bb.unit || 'px';
        const bbTop = bb.top ?? bb.width ?? 0;
        const bbRight = bb.right ?? bb.width ?? 0;
        const bbBottom = bb.bottom ?? bb.width ?? 0;
        const bbLeft = bb.left ?? bb.width ?? 0;
        const bbColor = bb.color || 'transparent';
        const bbSame = (bbTop === bbRight && bbRight === bbBottom && bbBottom === bbLeft);
        const bbCss = bbSame && bbTop === 0 ? '' : `border-style: solid !important; border-color: ${bbColor} !important; border-width: ${bbTop}${bbUnit} ${bbRight}${bbUnit} ${bbBottom}${bbUnit} ${bbLeft}${bbUnit} !important;`;
        // Button radius: support old (number) and new (object with 4 corners) format
        const br = button_radius;
        const brUnit = (typeof br === 'object' && br?.unit) ? br.unit : 'px';
        const brTL = (typeof br === 'object' ? br?.topLeft : null) ?? br ?? 12;
        const brTR = (typeof br === 'object' ? br?.topRight : null) ?? br ?? 12;
        const brBR = (typeof br === 'object' ? br?.bottomRight : null) ?? br ?? 12;
        const brBL = (typeof br === 'object' ? br?.bottomLeft : null) ?? br ?? 12;
        const brCss = `border-radius: ${brTL}${brUnit} ${brTR}${brUnit} ${brBR}${brUnit} ${brBL}${brUnit} !important;`;

        const boxPad = paddingToCss(box_padding);
        const boxRad = radiusToCss(border_radius);
        const boxBw = borderWidthToCss(box_border_width);
        const boxBc = (box_border_color && /^#[0-9A-Fa-f]{6}$/.test(box_border_color)) ? box_border_color : '#e5e7eb';
        const hasBoxBorder = (() => {
            const w = box_border_width;
            if (typeof w === 'number') return w > 0;
            if (w && (w.top > 0 || w.right > 0 || w.bottom > 0 || w.left > 0)) return true;
            return false;
        })();

        return `
            .ss-card-container {
                background-color: ${color_container.bg};
                padding: ${boxPad};
                border-radius: ${boxRad};
                ${hasBoxBorder ? `border: solid ${boxBc}; border-width: ${boxBw};` : ''}
                transition: background-color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), box-shadow 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), border-color 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                will-change: transform;
            }
            .ss-card-container:hover {
                background-color: ${color_container.hoverBg};
            }
            .ss-card-title {
                ${fontRule(typo_title.font)}
                font-size: ${typo_title.size}px !important;
                font-weight: ${typo_title.weight} !important;
                line-height: ${typo_title.lineHeight} !important;
                text-transform: ${typo_title.textTransform || 'none'} !important;
                color: ${color_title.text} !important;
                background-color: ${color_title.bg};
                transition: color 0.3s ease, background-color 0.3s ease;
                margin: ${marginToCss(margin_title)} !important;
            }
            .ss-card-title:hover {
                color: ${color_title.hoverText} !important;
                background-color: ${color_title.hoverBg};
            }
            .ss-card-author {
                ${fontRule(typo_author.font)}
                font-size: ${typo_author.size}px !important;
                font-weight: ${typo_author.weight} !important;
                line-height: ${typo_author.lineHeight} !important;
                text-transform: ${typo_author.textTransform || 'none'} !important;
                color: ${color_author.text} !important;
                background-color: ${color_author.bg};
                transition: color 0.3s ease, background-color 0.3s ease;
                margin: ${marginToCss(margin_author)} !important;
            }
            .ss-card-author:hover {
                color: ${color_author.hoverText} !important;
                background-color: ${color_author.hoverBg};
            }
            .ss-card-price {
                ${fontRule(typo_price.font)}
                font-size: ${typo_price.size}px !important;
                font-weight: ${typo_price.weight} !important;
                line-height: ${typo_price.lineHeight} !important;
                text-transform: ${typo_price.textTransform || 'none'} !important;
                color: ${color_price.text} !important;
                background-color: ${color_price.bg};
                transition: color 0.3s ease, background-color 0.3s ease;
                display: inline-block;
                margin: ${marginToCss(margin_price)} !important;
            }
            .ss-card-price del,
            .ss-card-price del * {
                color: ${color_price.oldText ?? '#9ca3af'} !important;
                text-decoration: line-through !important;
            }
            .ss-card-price:hover {
                color: ${color_price.hoverText} !important;
                background-color: ${color_price.hoverBg};
            }
            .ss-cart-button {
                ${fontRule(tb.font)}
                font-size: ${tb.size}px !important;
                font-weight: ${tb.weight} !important;
                text-transform: ${tb.textTransform || 'none'} !important;
                color: ${cb.text} !important;
                background-color: ${cb.bg} !important;
                ${bbCss}
                ${brCss}
                margin: ${marginToCss(margin_cart)} !important;
                transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease !important;
            }
            .ss-cart-button:hover {
                color: ${cb.hoverText} !important;
                background-color: ${cb.hoverBg} !important;
            }
            .ss-look-inside-btn {
                ${fontRule((typo_look_inside || {}).font)}
                font-size: ${(typo_look_inside || {}).size ?? 12}px !important;
                font-weight: ${(typo_look_inside || {}).weight ?? '700'} !important;
                line-height: ${(typo_look_inside || {}).lineHeight ?? 1.2} !important;
                text-transform: ${(typo_look_inside || {}).textTransform || 'none'} !important;
                color: ${(color_look_inside || {}).text ?? '#2563eb'} !important;
                background-color: ${(color_look_inside || {}).bg ?? 'rgba(255,255,255,0.92)'} !important;
                margin: ${marginToCss(margin_look_inside)} !important;
                padding: ${(() => { const p = look_inside_padding; const n = typeof p === 'number'; return `${n ? p : (p?.top ?? 8)}px ${n ? p : (p?.right ?? 8)}px ${n ? p : (p?.bottom ?? 8)}px ${n ? p : (p?.left ?? 8)}px`; })()} !important;
                border-radius: ${(() => { const r = look_inside_radius; if (typeof r === 'number') return r + 'px'; const tl = r?.topLeft ?? 9999, tr = r?.topRight ?? 9999, br = r?.bottomRight ?? 9999, bl = r?.bottomLeft ?? 9999; return `${tl}px ${tr}px ${br}px ${bl}px`; })()} !important;
                ${(() => {
                    const lb = look_inside_border || {};
                    const lbUnit = lb.unit || 'px';
                    const lbTop = lb.top ?? lb.width ?? 1;
                    const lbRight = lb.right ?? lb.width ?? 1;
                    const lbBottom = lb.bottom ?? lb.width ?? 1;
                    const lbLeft = lb.left ?? lb.width ?? 1;
                    const lbColor = lb.color || 'rgba(37,99,235,0.3)';
                    return lbTop === 0 && lbRight === 0 && lbBottom === 0 && lbLeft === 0 ? '' : `border-style: solid !important; border-color: ${lbColor} !important; border-width: ${lbTop}${lbUnit} ${lbRight}${lbUnit} ${lbBottom}${lbUnit} ${lbLeft}${lbUnit} !important;`;
                })()}
                display: inline-flex !important;
                align-items: center !important;
                justify-content: ${(settings.look_inside_btn_align === 'left' ? 'flex-start' : settings.look_inside_btn_align === 'right' ? 'flex-end' : 'center')} !important;
                gap: ${look_inside_icon_gap ?? 4}px !important;
                cursor: pointer !important;
                white-space: nowrap !important;
                backdrop-filter: blur(4px);
                transition: color 0.2s ease, background-color 0.2s ease, border-color 0.2s ease !important;
            }
            .ss-look-inside-btn svg {
                width: ${look_inside_icon_size ?? 12}px !important;
                height: ${look_inside_icon_size ?? 12}px !important;
                flex-shrink: 0;
                color: ${(look_inside_icon_color || {}).text || 'currentColor'} !important;
                transition: color 0.2s ease !important;
            }
            .ss-look-inside-btn:hover {
                color: ${(color_look_inside || {}).hoverText ?? '#ffffff'} !important;
                background-color: ${(color_look_inside || {}).hoverBg ?? '#eff6ff'} !important;
            }
            .ss-look-inside-btn:hover svg {
                color: ${(look_inside_icon_color || {}).hoverText || 'currentColor'} !important;
            }
            .ss-card-rating { margin: ${marginToCss(margin_rating)} !important; }
            .ss-card-image { margin: ${marginToCss(margin_image)} !important; }
            .ss-card-summary { margin: ${marginToCss(margin_summary)} !important; }
            .ss-card-badge,
            .ss-badge { margin: ${marginToCss(margin_badge)} !important; }
            .ss-discount-badge { margin: ${marginToCss(margin_badge)} !important; }
            .ss-ribbon-badge {
                ${fontRule((typo_ribbon || {}).font)}
                font-size: ${(typo_ribbon || {}).size ?? 12}px !important;
                font-weight: ${(typo_ribbon || {}).weight ?? '700'} !important;
                color: ${(color_ribbon || {}).text ?? '#ffffff'} !important;
                background-color: ${(color_ribbon || {}).bg ?? '#dc2626'} !important;
                border-radius: ${typeof ribbon_radius === 'object' ? `${ribbon_radius?.topLeft ?? 8}px ${ribbon_radius?.topRight ?? 8}px ${ribbon_radius?.bottomRight ?? 8}px ${ribbon_radius?.bottomLeft ?? 8}px` : (ribbon_radius ?? 8) + 'px'} !important;
                ${(() => {
                    const rb = ribbon_border || {};
                    const u = rb.unit || 'px';
                    const t = rb.top ?? rb.width ?? 0, r = rb.right ?? rb.width ?? 0, b = rb.bottom ?? rb.width ?? 0, l = rb.left ?? rb.width ?? 0;
                    const c = rb.color || 'transparent';
                    return (t || r || b || l) ? `border: ${t}${u} solid ${c} !important;` : '';
                })()}
                transition: color 0.2s ease, background-color 0.2s ease !important;
                margin: ${marginToCss(margin_badge)} !important;
            }
            .ss-ribbon-badge:hover {
                color: ${(color_ribbon || {}).hoverText ?? '#ffffff'} !important;
                background-color: ${(color_ribbon || {}).hoverBg ?? '#b91c1c'} !important;
            }
            @keyframes ss-shimmer {
                0% { background-position: -1000px 0; }
                100% { background-position: 1000px 0; }
            }
            .ss-skeleton {
                background: #f6f7f8;
                background-image: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%);
                background-size: 1000px 100%;
                background-repeat: no-repeat;
                animation: ss-shimmer 2s infinite linear;
            }
        `;
    };

    // Premium Carousel Logic
    const [carouselIndex, setCarouselIndex] = useState(0);
    const premiumFeatures = [
        { title: "AI Recommendations", desc: "Suggest books based on user history.", icon: "🤖" },
        { title: "3D Cover Generator", desc: "Turn flat images into 3D books.", icon: "📚" },
        { title: "Analytics Dashboard", desc: "Track clicks and conversions.", icon: "pwl-chart-bar" },
        { title: "Content Restriction", desc: "Lock content for members only.", icon: "pwl-lock" },
    ];

    useEffect(() => {
        if (!isPro) {
            const interval = setInterval(() => {
                setCarouselIndex((prev) => (prev + 1) % premiumFeatures.length);
            }, 4000);
            return () => clearInterval(interval);
        }
    }, [isPro]);

    // Load URL params (for editing)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const editId = urlParams.get('edit');
        if (editId) {
            setCurrentShortcodeId(Number(editId));
            loadShortcode(editId);
        } else {
            fetchPreviewProducts();
        }
    }, []);

    // Fetch products whenever relevant settings change
    useEffect(() => {
        if (settings.data_source === 'vault') {
            if (vaultAssets.length === 0) fetchVaultAssets();
            return;
        }

        const taxTypes = {
            'category': 'product_cat',
            'genre': 'rmss_genre',
            'author': 'rmss_author',
            'publisher': 'rmss_publisher'
        };

        if (taxTypes[settings.query_type]) {
            fetchTerms(taxTypes[settings.query_type]);
        } else {
            setAvailableTerms([]);
        }

        fetchPreviewProducts();
    }, [settings.query_type, settings.term_slug, settings.limit, settings.products, settings.data_source, settings.isbn_results, settings.sort_by, settings.sort_order]);

    // Update vault preview when assets load or selection changes
    useEffect(() => {
        if (settings.data_source === 'vault') {
            fetchPreviewProducts();
        }
    }, [vaultSelectedIds, vaultAssets, settings.sort_by, settings.sort_order, settings.vault_query_author, settings.vault_query_publisher, settings.vault_query_category, settings.vault_query_genre]);


    const fetchTerms = async (taxonomy) => {
        setTermsLoading(true);
        try {
            const response = await fetch(`${window.rmssAdminSettings?.restUrl}/taxonomies/${taxonomy}`, {
                headers: { 'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setAvailableTerms(data);
                // Auto-select first if none selected
                if (!settings.term_slug && data.length > 0) {
                    // Optional: Don't auto-select to avoid confusion? 
                    // Or auto-select 'first' to show *something*.
                    // setSettings(prev => ({...prev, term_slug: data[0].slug}));
                }
            }
        } catch (e) {
            console.error("Error fetching terms", e);
        } finally {
            setTermsLoading(false);
        }
    }

    const loadShortcode = async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${window.rmssAdminSettings?.restUrl}/shortcodes/${id}`, {
                headers: { 'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce }
            });
            const data = await response.json();
            if (data && data.settings) {
                const s = data.settings;
                // Migrate old formats to new
                const migrated = { ...s };
                if (s.button_border && 'width' in s.button_border && s.button_border.top === undefined) {
                    const w = s.button_border.width ?? 0;
                    migrated.button_border = { top: w, right: w, bottom: w, left: w, unit: 'px', color: s.button_border.color || 'transparent', sameForAll: true };
                }
                if (typeof s.button_radius === 'number' || (s.button_radius && s.button_radius.topLeft === undefined && typeof s.button_radius !== 'object')) {
                    const r = typeof s.button_radius === 'number' ? s.button_radius : 12;
                    migrated.button_radius = { topLeft: r, topRight: r, bottomRight: r, bottomLeft: r, unit: 'px', sameForAll: true };
                }
                if (typeof s.image_height === 'number' && s.image_height_unit === undefined) {
                    migrated.image_width = s.image_width ?? 100;
                    migrated.image_width_unit = s.image_width_unit || '%';
                    migrated.image_height_unit = 'px';
                }
                if (typeof s.look_inside_padding === 'number') {
                    const v = s.look_inside_padding;
                    migrated.look_inside_padding = { top: v, right: v, bottom: v, left: v, sameForAll: true };
                }
                if (typeof s.look_inside_radius === 'number') {
                    const v = s.look_inside_radius;
                    migrated.look_inside_radius = { topLeft: v, topRight: v, bottomRight: v, bottomLeft: v, sameForAll: true };
                }
                if (s.look_inside_border && 'width' in s.look_inside_border && s.look_inside_border.top === undefined) {
                    const w = s.look_inside_border.width ?? 1;
                    migrated.look_inside_border = { top: w, right: w, bottom: w, left: w, unit: 'px', color: s.look_inside_border.color || 'rgba(37,99,235,0.3)', sameForAll: true };
                }
                if (typeof s.box_padding === 'number') {
                    const v = s.box_padding;
                    migrated.box_padding = { top: v, right: v, bottom: v, left: v, sameForAll: true };
                }
                if (typeof s.border_radius === 'number') {
                    const v = s.border_radius;
                    migrated.border_radius = { topLeft: v, topRight: v, bottomRight: v, bottomLeft: v, sameForAll: true };
                }
                if (typeof s.box_border_width === 'number') {
                    const v = s.box_border_width;
                    migrated.box_border_width = { top: v, right: v, bottom: v, left: v, sameForAll: true };
                }
                const marginDefaults = {
                    margin_title: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
                    margin_author: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
                    margin_price: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
                    margin_rating: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
                    margin_image: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
                    margin_cart: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
                    margin_look_inside: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
                    margin_badge: { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true },
                    margin_summary: { top: 0, right: 0, bottom: 4, left: 0, sameForAll: false },
                };
                Object.keys(marginDefaults).forEach(key => {
                    if (migrated[key] == null || (typeof migrated[key] === 'object' && migrated[key].top === undefined && migrated[key].bottom === undefined)) {
                        migrated[key] = marginDefaults[key];
                    }
                });
                setSettings(migrated);
                setSaveTitle(data.title);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Force Refresh Data (Smart Data Refresh)
     * Clears cache and re-fetches data from Amazon/Google.
     */
    const handleForceRefresh = async () => {
        // Only works for Amazon currently as Google Books isn't fully cached by us in the same way (transient is 12h but logic is different)
        // For now, we mainly target Amazon updates.
        if (settings.data_source !== 'amazon') {
            // For WooCommerce/Google Books, just standard re-fetch
            if (settings.data_source === 'woocommerce') fetchPreviewProducts();
            return;
        }

        if (!settings.amazon_query) return;

        setIsRefreshing(true);
        try {
            const res = await fetch(`${window.rmssAdminSettings?.restUrl}/amazon-search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
                body: JSON.stringify({
                    query: settings.amazon_query,
                    search_type: settings.amazon_search_type || 'keywords',
                    force_refresh: true
                }),
            });

            if (res.ok) {
                const data = await res.json();
                setSettings(prev => ({ ...prev, amazon_results: data }));
                setPreviewProducts(data);

                // Show Success Toast
                const toast = document.createElement('div');
                toast.className = "fixed bottom-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-xl z-[9999] animate-in slide-in-from-bottom-2 fade-in";
                toast.innerHTML = `<div class="flex items-center gap-2"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg><span class="text-sm font-bold">Data updated successfully from Amazon!</span></div>`;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 3000);
            }
        } catch (e) {
            console.error("Refresh failed", e);
        } finally {
            setIsRefreshing(false);
        }
    };

    const fetchVaultAssets = async () => {
        setVaultLoading(true);
        try {
            const wpRestUrl = window.rmssAdminSettings?.wpRestUrl || '/wp-json/wp/v2';
            const nonce = window.rmssAdminSettings?.nonce;
            const res = await fetch(`${wpRestUrl}/ss_vault_assets?per_page=100&_embed=1`, {
                headers: { 'X-WP-Nonce': nonce }
            });
            const data = await res.json();
            if (Array.isArray(data)) setVaultAssets(data);
        } catch (e) {
            console.error('Vault fetch error:', e);
        } finally {
            setVaultLoading(false);
        }
    };

    const fetchPreviewProducts = async () => {
        // ── Vault mode: query filter + sort + limit ──
        if (settings.data_source === 'vault') {
            let filtered = [...vaultAssets];
            const qAuth = (settings.vault_query_author || '').trim().toLowerCase();
            const qPub = (settings.vault_query_publisher || '').trim().toLowerCase();
            const qCat = (settings.vault_query_category || '').trim().toLowerCase();
            const qGen = (settings.vault_query_genre || '').trim().toLowerCase();
            if (qAuth || qPub || qCat || qGen) {
                filtered = filtered.filter(a => {
                    const auth = (a.meta?._ss_vault_author || '').toLowerCase();
                    const pub = (a.meta?._ss_vault_publisher || '').toLowerCase();
                    const cat = (a.meta?._ss_vault_category || '').toLowerCase();
                    if (qAuth && !auth.includes(qAuth)) return false;
                    if (qPub && !pub.includes(qPub)) return false;
                    if (qCat && !cat.includes(qCat)) return false;
                    if (qGen && !cat.includes(qGen)) return false; // genre uses category meta
                    return true;
                });
            }
            const ord = settings.sort_order === 'asc' ? 1 : -1;
            const sb = settings.sort_by || 'date';
            filtered.sort((a, b) => {
                if (sb === 'title') return ord * ((a.title?.rendered || '').localeCompare(b.title?.rendered || ''));
                if (sb === 'modified') return ord * (new Date(a.modified || 0) - new Date(b.modified || 0));
                if (sb === 'price') {
                    const pa = parseFloat(String(a.meta?._ss_vault_price || '0').replace(/[^\d.-]/g, '')) || 0;
                    const pb = parseFloat(String(b.meta?._ss_vault_price || '0').replace(/[^\d.-]/g, '')) || 0;
                    return ord * (pa - pb);
                }
                if (sb === 'rating') {
                    const ra = parseFloat(a.meta?._ss_vault_rating) || 0;
                    const rb = parseFloat(b.meta?._ss_vault_rating) || 0;
                    return ord * (ra - rb);
                }
                if (sb === 'rand') return Math.random() - 0.5;
                return ord * (new Date(b.date || 0) - new Date(a.date || 0)); // date default
            });
            const limit = Math.min(filtered.length, parseInt(settings.limit) || 12, 100);
            const source = filtered.slice(0, limit);
            const lab = window.rmssAdminSettings?.labels || {};
            setPreviewProducts(source.map(a => getNormalizedData(a, 'vault', { ...settings, labels: lab })));
            return;
        }

        // ── Google Books / Smart Book Ingester mode (both use isbn_results) ──
        if (settings.data_source === 'google_books' || settings.data_source === 'smart_ingester') {
            let results = (settings.isbn_results || []).map(b => getNormalizedData(b, 'google_books', settings));
            setPreviewProducts(results);
            return;
        }

        // ── Amazon mode ──
        if (settings.data_source === 'amazon') {
            setPreviewProducts((settings.amazon_results || []).map(b => getNormalizedData(b, 'amazon', settings)));
            return;
        }

        // ── WooCommerce mode: existing logic unchanged ──
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('limit', settings.show_all ? 100 : (settings.limit || 12));

            const simpleTypes = ['latest', 'featured', 'onsale', 'bestsellers', 'specific'];
            if (simpleTypes.includes(settings.query_type) && settings.query_type !== 'specific') {
                params.append('type', settings.query_type);
            }
            if (settings.query_type === 'specific' && settings.products && settings.products.length > 0) {
                params.append('include', settings.products.join(','));
            } else if (settings.selectedProducts && settings.selectedProducts.length > 0) {
                const ids = settings.selectedProducts.map(p => p.id).join(',');
                params.append('include', ids);
            }
            if (settings.query_type === 'category' && settings.term_slug) params.append('category', settings.term_slug);
            if (settings.query_type === 'genre' && settings.term_slug) params.append('genre', settings.term_slug);
            if (settings.query_type === 'author' && settings.term_slug) params.append('author', settings.term_slug);
            if (settings.query_type === 'publisher' && settings.term_slug) params.append('publisher', settings.term_slug);
            if (settings.sort_by && settings.sort_by !== 'date') params.append('sort_by', settings.sort_by);
            if (settings.sort_order && settings.sort_order !== 'desc') params.append('sort_order', settings.sort_order);
            params.append('no_cache', '1'); // Admin preview: always fresh results

            const response = await fetch(`${window.rmssAdminSettings?.restUrl}/search?${params.toString()}`, {
                headers: { 'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce }
            });
            const data = await response.json();

            if (data && Array.isArray(data)) {
                setPreviewProducts(data.map(item => getNormalizedData(item, 'woocommerce', settings)));
            } else {
                setPreviewProducts([]);
            }
        } catch (err) {
            console.error(err);
            setPreviewProducts([]);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Fetch a single book from Google Books API by ISBN
     * Appends the result to isbn_results and updates the preview.
     */

    const fetchGoogleBooks = async (isbn) => {
        const cleanIsbn = isbn.replace(/[^0-9X]/gi, '').trim();
        if (!cleanIsbn) {
            setIsbnError('Please enter a valid ISBN.');
            return;
        }
        setIsbnLoading(true);
        setIsbnError('');

        try {
            const baseUrl = (window.rmssAdminSettings?.restUrl || '').replace(/\/?$/, '');
            const fetchUrl = baseUrl ? `${baseUrl}/fetch-books` : '/wp-json/shelfsage/v1/fetch-books';
            const res = await fetch(fetchUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce || '',
                },
                body: JSON.stringify({
                    query: `isbn:${cleanIsbn}`,
                    max_results: 1
                }),
            });

            if (res.status === 401 || res.status === 403) {
                try {
                    const errData = await res.json();
                    const msg = errData?.message || errData?.data?.message;
                    setIsbnError(msg || 'Unauthorized. Add Google Books API Key in Settings → Connect & Data.');
                } catch (_) {
                    setIsbnError('API Key missing or unauthorized. Add Google Books API Key in Settings → Connect & Data.');
                }
                return;
            }

            if (res.status === 500) {
                setIsbnError('Server Error: Something went wrong on the server. Please try again later.');
                return;
            }

            const responseData = await res.json();

            if (!responseData.success || !responseData.data || !responseData.data.items || responseData.data.items.length === 0) {
                setIsbnError(responseData.message || 'No book found for this ISBN. Try another.');
                return;
            }

            const data = responseData.data;
            const info = data.items[0].volumeInfo;
            const fullSummary = stripHtmlTags(info.description || '');
            const displaySummary = fullSummary.length > 500 ? fullSummary.substring(0, 500) + '...' : fullSummary;

            // Prioritize extraLarge > medium > large > thumbnail
            const coverUrl = info.imageLinks?.extraLarge ||
                info.imageLinks?.medium ||
                info.imageLinks?.large ||
                info.imageLinks?.thumbnail ||
                'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22300%22 height%3D%22450%22%3E%3Crect width%3D%22300%22 height%3D%22450%22 fill%3D%22%23f3f4f6%22%2F%3E%3Ctext x%3D%22150%22 y%3D%22225%22 text-anchor%3D%22middle%22 dominant-baseline%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2214%22 fill%3D%22%239ca3af%22%3ENo Cover%3C%2Ftext%3E%3C%2Fsvg%3E';

            const book = {
                id: `isbn_${cleanIsbn}`,
                ss_book_title: info.title || 'Unknown Title',
                ss_book_author: info.authors?.join(', ') || 'Unknown Author',
                ss_book_cover_url: coverUrl.replace('http:', 'https:'),
                ss_book_summary: displaySummary,
                full_summary: fullSummary,
                ss_book_isbn: info.industryIdentifiers?.[0]?.identifier || cleanIsbn,
                ss_book_pages: info.pageCount || '',
                ss_book_genre: info.categories?.[0] || '',
                ss_published_year: info.publishedDate ? info.publishedDate.substring(0, 4) : '',
                price: 'PRO_INGESTED',
                rating: info.averageRating || 0,
                isbn: cleanIsbn,
                source: 'google_books',
                button_text: 'Buy Now',
                button_link: '',
            };

            setSettings(prev => ({
                ...prev,
                isbn_results: [...(prev.isbn_results || []).filter(b => b.isbn !== cleanIsbn), book],
                isbn_input: '',
            }));
            setPreviewProducts(prev => {
                // avoid dupes
                const filtered = prev.filter(b => b.id !== book.id);
                return [...filtered, book];
            });

            // PRO: Auto-create a draft WooCommerce product
            if (settings.auto_create_product && isPro) {
                autoCreateProduct(book);
            }
        } catch (e) {
            console.error('Google Books fetch error:', e);
            setIsbnError('Fetch failed. Please try again.');
        } finally {
            setIsbnLoading(false);
        }
    };

    /**
     * Smart Book Ingester Fetch
     * Fetches metadata from Google Books via Title or ISBN
     */
    const handleIngesterFetch = async () => {
        if (!isPro) return;
        if (!ingesterQuery.trim()) {
            setIngesterError('Please enter a title or ISBN.');
            return;
        }

        setIngesterLoading(true);
        setIngesterError('');
        setIngesterSelectedIndex(0); // Reset selection

        try {
            const cleanQuery = ingesterQuery.trim();
            const isbnLike = /^[0-9Xx\-]{10,17}$/.test(cleanQuery.replace(/\s/g, ''));
            let query = cleanQuery;
            if (isbnLike) {
                query = `isbn:${cleanQuery.replace(/[^0-9Xx]/g, '')}`;
            }
            const nonce = window.rmssAdminSettings?.fetchBooksNonce || window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce || '';
            const ajaxUrl = window.rmssAdminSettings?.ajaxurl || (window.location.origin + '/wp-admin/admin-ajax.php');

            const doFetch = async (q) => {
                const fd = new FormData();
                fd.append('action', 'rmss_fetch_google_books');
                fd.append('nonce', nonce);
                fd.append('query', q);
                fd.append('max_results', ingesterMaxResults);
                const r = await fetch(ajaxUrl, { method: 'POST', credentials: 'same-origin', body: fd });
                const t = await r.text();
                let d = {};
                try { d = t ? JSON.parse(t) : {}; } catch (_) {}
                return { ok: r.ok, raw: t, data: d };
            };

            let res = await doFetch(query);
            let rawText = res.raw;
            let ajaxData = res.data || {};

            if (rawText === '0' || rawText === '-1') {
                setIngesterError('Could not reach server. Ensure ShelfSage Pro is active and you are logged in as admin.');
                return;
            }

            if (!res.ok || !ajaxData.success) {
                setIngesterError(ajaxData?.data?.message || ajaxData?.message || 'Request failed. Please try again.');
                return;
            }

            let items = ajaxData.data?.data?.items || ajaxData.data?.items || ajaxData.items || [];
            if (!items.length) {
                const restUrl = (window.rmssAdminSettings?.restUrl || '').replace(/\/?$/, '') + '/fetch-books';
                const restRes = await fetch(restUrl, {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': nonce },
                    body: JSON.stringify({ query, max_results: ingesterMaxResults }),
                });
                const restData = await restRes.json().catch(() => ({}));
                if (restRes.ok && restData?.data?.items?.length) {
                    items = restData.data.items;
                    ajaxData = { success: true, data: restData };
                }
            }
            if (!items.length) {
                const errMsg = ajaxData?.data?.message || 'No books found. If using localhost, your server may not reach Google. Try adding a Google Books API key in Settings.';
                setIngesterError(errMsg);
                return;
            }

            const results = items.map(item => {
                const info = item.volumeInfo || {};
                const rawDescription = info.description || '';
                const cleanSummary = stripHtmlTags(rawDescription);
                const displaySummary = cleanSummary.length > 500 ? cleanSummary.substring(0, 500) + '...' : cleanSummary;

                // Prioritize extraLarge > medium > large > thumbnail
                const coverUrl = info.imageLinks?.extraLarge ||
                    info.imageLinks?.medium ||
                    info.imageLinks?.large ||
                    info.imageLinks?.thumbnail ||
                    'data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 width%3D%22300%22 height%3D%22450%22%3E%3Crect width%3D%22300%22 height%3D%22450%22 fill%3D%22%23f3f4f6%22%2F%3E%3Ctext x%3D%22150%22 y%3D%22225%22 text-anchor%3D%22middle%22 dominant-baseline%3D%22middle%22 font-family%3D%22sans-serif%22 font-size%3D%2214%22 fill%3D%22%239ca3af%22%3ENo Cover%3C%2Ftext%3E%3C%2Fsvg%3E';

                return {
                    id: item.id,
                    ss_book_title: info.title || 'Unknown Title',
                    ss_book_author: (info.authors && info.authors.join) ? info.authors.join(', ') : 'Unknown Author',
                    ss_book_cover_url: coverUrl.replace('http:', 'https:'),
                    ss_book_summary: displaySummary,
                    full_summary: cleanSummary,
                    ss_book_isbn: info.industryIdentifiers?.[0]?.identifier || '',
                    ss_book_pages: info.pageCount || '',
                    ss_book_genre: info.categories?.[0] || '',
                    ss_published_year: info.publishedDate ? String(info.publishedDate).substring(0, 4) : '',
                    price: 'PRO_INGESTED',
                    rating: info.averageRating || 0,
                    source: 'google_books',
                    enriched_by: 'google_books',
                    button_text: 'Buy Now',
                    button_link: '',
                };
            });

            // Update preview immediately with the first result (or all results)
            setPreviewProducts(results.map(b => getNormalizedData(b, 'google_books', settings)));

            // Sync first result to settings for manual editing
            if (results.length > 0) {
                const first = results[0];
                setSettings(prev => ({
                    ...prev,
                    data_source: 'smart_ingester',
                    ingested_data: first,
                    isbn_results: results,
                    show_summary: true,
                    show_author_badge: true,
                }));
            }

            // Show toast
            const toast = document.createElement('div');
            toast.className = "fixed bottom-10 right-10 bg-[#7c3aed] text-white px-6 py-3 rounded-2xl shadow-2xl z-[9999] animate-in slide-in-from-right-10 fade-in duration-500 border border-white/20 backdrop-blur-md";
            toast.innerHTML = `<div class="flex items-center gap-3 font-bold"><span class="text-xl">✨</span> <span>Success! Ingested ${results.length} results.</span></div>`;
            document.body.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('animate-out', 'fade-out', 'slide-out-to-right-10');
                setTimeout(() => toast.remove(), 500);
            }, 3000);

        } catch (e) {
            console.error('Ingester fetch failed', e);
            setIngesterError('Fetch failed. Please try again.');
        } finally {
            setIngesterLoading(false);
        }
    };

    /**
     * Clear Ingested Metadata
     * Resets the manual editor and removes the book from preview if search-based.
     */
    const handleClearIngester = () => {
        setIngesterQuery('');
        setIngesterSelectedIndex(0);
        setSettings(prev => ({
            ...prev,
            ingested_data: null,
            isbn_results: []
        }));
        if (settings.data_source === 'google_books' || settings.data_source === 'smart_ingester') {
            fetchPreviewProducts();
        }
    };

    /**
     * PRO: Creates a WooCommerce draft product from Google Books metadata
     * via the /shelfsage/v1/create-product PHP endpoint.
     */
    const autoCreateProduct = async (book) => {
        try {
            const res = await fetch(`${window.rmssAdminSettings?.restUrl}/create-product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce,
                },
                body: JSON.stringify({
                    title: book.ss_book_title || book.title,
                    author: book.ss_book_author || book.author,
                    image_url: book.ss_book_cover_url || book.image,
                    isbn: book.isbn,
                    summary: book.full_summary || book.ss_book_summary || book.summary,
                }),
            });
            const result = await res.json();
            if (result.success && result.edit_url) {
                window.location.href = result.edit_url;
            }
        } catch (e) {
            console.warn('[ShelfSage] Auto-create product failed:', e);
        }
    };

    /**
     * Search WooCommerce products for the Specific Items picker.
     */
    const searchSpecificProducts = async (query) => {
        if (!query || query.trim().length < 2) { setSpecificResults([]); return; }
        setSpecificSearching(true);
        try {
            const res = await fetch(
                `${window.rmssAdminSettings?.restUrl}/search?search=${encodeURIComponent(query.trim())}&limit=20`,
                { headers: { 'X-WP-Nonce': window.rmssAdminSettings?.nonce } }
            );
            const data = await res.json();
            setSpecificResults(Array.isArray(data) ? data : []);
        } catch (e) {
            setSpecificResults([]);
        } finally {
            setSpecificSearching(false);
        }
    };

    /**
     * Fetch books from Amazon via the WordPress PA-API proxy.
     * Uses amazon_query + amazon_search_type from settings.
     */
    const fetchAmazonBooks = async () => {
        const query = settings.amazon_query?.trim();
        if (!query) return;

        setAmazonLoading(true);
        setAmazonError('');

        try {
            const nonce = window.rmssAdminSettings?.amazonSearchNonce || window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce || '';
            const ajaxUrl = window.rmssAdminSettings?.ajaxurl || (window.location.origin + '/wp-admin/admin-ajax.php');

            const formData = new FormData();
            formData.append('action', 'rmss_amazon_search');
            formData.append('nonce', nonce);
            formData.append('query', query);
            formData.append('search_type', settings.amazon_search_type || 'keywords');

            const res = await fetch(ajaxUrl, { method: 'POST', credentials: 'same-origin', body: formData });
            const raw = await res.text();
            let data = [];
            try {
                const parsed = raw ? JSON.parse(raw) : {};
                data = parsed.success && Array.isArray(parsed.data) ? parsed.data : (Array.isArray(parsed) ? parsed : []);
                if (parsed.success === false && parsed.data?.message) {
                    setAmazonError(parsed.data.message);
                    return;
                }
            } catch (_) {
                if (raw === '0' || raw === '-1') {
                    setAmazonError('Could not reach server. Ensure you are logged in as admin.');
                } else {
                    setAmazonError('Invalid response from server.');
                }
                return;
            }

            if (!res.ok) {
                setAmazonError(typeof data === 'object' && data?.message ? data.message : 'Amazon search failed.');
                return;
            }

            const results = Array.isArray(data) ? data : [];
            setSettings(prev => ({ ...prev, amazon_results: results }));
            setPreviewProducts(results.map(b => getNormalizedData(b, 'amazon', settings)));
        } catch (e) {
            console.error('Amazon fetch error:', e);
            setAmazonError('Network error. Please check your connection.');
        } finally {
            setAmazonLoading(false);
        }
    };

    const handleLayoutChange = (layout) => {
        setSettings({ ...settings, layout, design: 'design-1' });
    };

    const generateShortcode = () => {
        let sc = `[shelfsage mode="${settings.layout}"`;

        if (settings.layout === 'masonry') {
            if (settings.masonry_cols !== 3) sc += ` cols="${settings.masonry_cols}"`;
        } else {
            if (settings.col_desktop !== 4) sc += ` col="${settings.col_desktop}"`;
            if (settings.col_tablet !== 3) sc += ` col_tablet="${settings.col_tablet}"`;
            if (settings.col_mobile !== 1) sc += ` col_mobile="${settings.col_mobile}"`;
        }

        if (settings.design && settings.design !== 'design-1' && settings.layout === 'grid') sc += ` design="${settings.design.replace('design-', '')}"`;

        // 3D Flip Book extra params
        if (settings.design === 'design-flip3d') {
            if (settings.flip3d_depth !== 30) sc += ` flip_depth="${settings.flip3d_depth}"`;
            if (settings.flip3d_perspective !== 1200) sc += ` flip_perspective="${settings.flip3d_perspective}"`;
            if (settings.flip3d_page_color !== '#fffef7') sc += ` flip_page_color="${settings.flip3d_page_color}"`;
            if (settings.flip3d_finish !== 'glossy') sc += ` flip_finish="${settings.flip3d_finish}"`;
        }

        // Data Source params
        if (settings.data_source === 'vault') {
            sc += ` source="vault"`;
            if (vaultSelectedIds.length > 0) sc += ` vault_ids="${vaultSelectedIds.join(',')}"`;
            if (settings.sort_by && settings.sort_by !== 'date') sc += ` sort_by="${settings.sort_by}"`;
            if (settings.sort_order && settings.sort_order !== 'desc') sc += ` sort_order="${settings.sort_order}"`;
            if (settings.vault_query_author) sc += ` vault_author="${String(settings.vault_query_author).replace(/"/g, '&quot;')}"`;
            if (settings.vault_query_publisher) sc += ` vault_publisher="${String(settings.vault_query_publisher).replace(/"/g, '&quot;')}"`;
            if (settings.vault_query_category) sc += ` vault_category="${String(settings.vault_query_category).replace(/"/g, '&quot;')}"`;
            if (settings.vault_query_genre) sc += ` vault_genre="${String(settings.vault_query_genre).replace(/"/g, '&quot;')}"`;
        } else if (settings.data_source === 'amazon') {
            sc += ` source="amazon"`;
            const asinList = (settings.amazon_results || []).map(b => b.asin).filter(Boolean).join(',');
            if (asinList) sc += ` asin="${asinList}"`;
            if (settings.amazon_associate_tag) sc += ` associate_tag="${settings.amazon_associate_tag}"`;
        } else if (settings.data_source === 'google_books' || settings.data_source === 'smart_ingester') {
            sc += ` source="google_books"`;
            const isbnList = (settings.isbn_results || []).map(b => b.isbn).join(',');
            if (isbnList) sc += ` isbn="${isbnList}"`;
        } else {
            // WooCommerce source logic
            const simpleTypes = ['latest', 'featured', 'onsale', 'bestsellers'];
            if (simpleTypes.includes(settings.query_type) && settings.query_type !== 'latest') {
                sc += ` query="${settings.query_type}"`;
            }
            if (['category', 'genre', 'author', 'publisher'].includes(settings.query_type) && settings.term_slug) {
                sc += ` ${settings.query_type}="${settings.term_slug}"`;
            }
            if (settings.show_all) { sc += ` limit="-1"`; } else if (settings.limit !== 12) { sc += ` limit="${settings.limit}"`; }
            if (settings.sort_by && settings.sort_by !== 'date') sc += ` sort_by="${settings.sort_by}"`;
            if (settings.sort_order && settings.sort_order !== 'desc') sc += ` sort_order="${settings.sort_order}"`;
        }

        // Styling (padding/radius/border_width: 4-value object or legacy number)
        const pad = settings.box_padding;
        const padStr = typeof pad === 'number' ? String(pad) : (pad?.sameForAll !== false ? String(pad?.top ?? 16) : `${pad?.top ?? 16} ${pad?.right ?? 16} ${pad?.bottom ?? 16} ${pad?.left ?? 16}`);
        if (padStr !== '16') sc += ` padding="${padStr}"`;
        const rad = settings.border_radius;
        const radStr = typeof rad === 'number' ? String(rad) : (rad?.sameForAll !== false ? String(rad?.topLeft ?? 12) : `${rad?.topLeft ?? 12} ${rad?.topRight ?? 12} ${rad?.bottomRight ?? 12} ${rad?.bottomLeft ?? 12}`);
        if (radStr !== '12') sc += ` radius="${radStr}"`;
        if (settings.grid_gap !== 24) sc += ` gap="${settings.grid_gap}"`;
        const imgH = settings.image_height ?? 100;
        const imgHU = settings.image_height_unit || '%';
        const imgW = settings.image_width ?? 100;
        const imgWU = settings.image_width_unit || '%';
        if (imgW !== 100 || imgWU !== '%') sc += ` img_width="${imgW}${imgWU}"`;
        if (imgH !== 100 || imgHU !== '%') sc += ` img_height="${imgH}${imgHU}"`;

        // Typography
        if (settings.typo_title.font) sc += ` title_font="${settings.typo_title.font}"`;
        if (settings.typo_title.size !== 16) sc += ` title_size="${settings.typo_title.size}"`;
        if (settings.typo_title.weight !== '700') sc += ` title_weight="${settings.typo_title.weight}"`;
        if (settings.typo_title.lineHeight !== 1.3) sc += ` title_lh="${settings.typo_title.lineHeight}"`;

        if (settings.typo_author.font) sc += ` author_font="${settings.typo_author.font}"`;
        if (settings.typo_author.size !== 12) sc += ` author_size="${settings.typo_author.size}"`;
        if (settings.typo_author.weight !== '400') sc += ` author_weight="${settings.typo_author.weight}"`;

        if (settings.typo_price.font) sc += ` price_font="${settings.typo_price.font}"`;
        if (settings.typo_price.size !== 15) sc += ` price_size="${settings.typo_price.size}"`;
        if (settings.typo_price.weight !== '700') sc += ` price_weight="${settings.typo_price.weight}"`;

        // Colors
        if (settings.color_title.text !== '#111827') sc += ` title_color="${settings.color_title.text}"`;
        if (settings.color_title.hoverText !== '#7c3aed') sc += ` title_hover_color="${settings.color_title.hoverText}"`;
        if (settings.color_author.text !== '#6b7280') sc += ` author_color="${settings.color_author.text}"`;
        if (settings.color_price.text !== '#7c3aed') sc += ` price_color="${settings.color_price.text}"`;
        if (settings.color_price.hoverBg !== '#7c3aed') sc += ` price_hover_bg="${settings.color_price.hoverBg}"`;
        if (settings.color_container.bg !== '#ffffff') sc += ` container_bg="${settings.color_container.bg}"`;
        if (settings.color_container.hoverBg !== '#f9f5ff') sc += ` container_hover_bg="${settings.color_container.hoverBg}"`;

        // Box Model (padding serialized above)

        // Content alignment (Designer one-click)
        if (settings.card_alignment && settings.card_alignment !== 'center') sc += ` alignment="${settings.card_alignment}"`;

        // Look Inside Btn position (Pro)
        if (settings.look_inside_btn_position && settings.look_inside_btn_position !== 'bottom-left') {
            sc += ` look_inside_btn_position="${settings.look_inside_btn_position}"`;
        }
        if (settings.look_inside_btn_align && settings.look_inside_btn_align !== 'center') {
            sc += ` look_inside_btn_align="${settings.look_inside_btn_align}"`;
        }

        // Discount badge
        if (settings.show_badge) {
            sc += ` badge_show="yes"`;
            if (settings.badge_design !== 'scalloped') sc += ` badge_design="${settings.badge_design}"`;
            if (settings.badge_position !== 'top-right') sc += ` badge_position="${settings.badge_position}"`;
            if (settings.badge_bg_color !== '#dc2626') sc += ` badge_bg_color="${settings.badge_bg_color}"`;
            if (settings.badge_text_color !== '#ffffff') sc += ` badge_text_color="${settings.badge_text_color}"`;
        } else {
            sc += ` badge_show="no"`;
        }
        // Ribbon badge (saved in design JSON; optional shortcode attrs)
        if (!settings.show_ribbon_badge) sc += ` ribbon_badge="no"`;

        // Toggles
        if (!settings.show_title) sc += ` title="off"`;
        if (!settings.show_author_badge) sc += ` author_badge="no"`;
        if (!settings.show_look_inside) sc += ` show_look_inside="no"`;
        if (!settings.show_price) sc += ` price="off"`;
        if (!settings.show_rating) sc += ` rating="off"`;
        if (!settings.show_image) sc += ` image="off"`;
        if (!settings.show_cart) sc += ` cart="off"`;

        sc += `]`;
        return sc;
    };

    const handleSave = async () => {
        // Free users trying to use 3D Flip Book — show upsell
        if (settings.design === 'design-flip3d' && !isPro) {
            setShowSaveModal(false);
            setShowUpgradeModal(true);
            return;
        }

        const title = saveTitle.trim() || 'Untitled Shortcode';
        const shortcodeString = generateShortcode();
        const nonce = window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce;
        const baseUrl = window.rmssAdminSettings?.restUrl;

        // Strip heavy data arrays from settings before saving
        // Only save pure configuration, not fetched data blobs
        const { isbn_results, amazon_results, selectedProducts, ...settingsToSave } = settings;

        // Preserve only product IDs from selectedProducts (not full objects)
        if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
            settingsToSave.products = selectedProducts.map(p => p.id || p);
        }

        setSaveStatus('saving');
        setSaveError('');

        try {
            const url = currentShortcodeId
                ? `${baseUrl}/shortcodes/${currentShortcodeId}`
                : `${baseUrl}/shortcodes`;

            const res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-WP-Nonce': nonce,
                },
                body: JSON.stringify({
                    title,
                    shortcode: shortcodeString,
                    settings: settingsToSave,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setSaveStatus('error');
                setSaveError(data.message || `Save failed (HTTP ${res.status}). Please try again.`);
                return;
            }

            // Remember the ID for subsequent saves (update flow)
            setCurrentShortcodeId(data.id);
            setLastSavedShortcode(shortcodeString);
            setSaveTitle(data.title);
            setSaveStatus('saved');

            // Auto-dismiss after 3 s
            setTimeout(() => {
                setShowSaveModal(false);
                setSaveStatus(null);
            }, 3000);

        } catch (e) {
            console.error('[ShelfSage] Save error:', e);
            setSaveStatus('error');
            setSaveError('Network error. Check your connection and try again.');
        }
    };

    const handleDelete = async () => {
        if (!currentShortcodeId) return;
        if (!window.confirm('Delete this shortcode? This cannot be undone.')) return;
        const nonce = window.rmssAdminSettings?.nonce || window.rmssAdminSettings?.restNonce;
        const baseUrl = window.rmssAdminSettings?.restUrl;
        try {
            await fetch(`${baseUrl}/shortcodes/${currentShortcodeId}`, {
                method: 'DELETE',
                headers: { 'X-WP-Nonce': nonce },
            });
            // Reset to a blank new shortcode
            setCurrentShortcodeId(null);
            setSaveTitle('');
            setLastSavedShortcode('');
        } catch (e) {
            console.error('[ShelfSage] Delete error:', e);
            alert('Could not delete. Please try again.');
        }
    };

    const sidebarBg = "bg-[#1a0b2e]";
    const activeHoverColorClass = "hover:bg-[#f3f4f6]";

    return (
        <>
        <div className="flex flex-col h-screen overflow-hidden font-sans text-gray-800 bg-gray-50">

            {/* 1. Header Bar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-30 relative shadow-sm">
                <div className="flex items-center gap-4">
                    <a href="admin.php?page=shelfsage-dashboard" className="text-gray-400 hover:text-purple-600 transition-colors p-2 hover:bg-purple-50 rounded-lg group" title="Back to Dashboard">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </a>
                    <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                        <h1 className="text-xl font-bold text-gray-800 tracking-tight flex items-center gap-2">
                            <span className="text-2xl">🏗️</span> Shortcode Architect
                        </h1>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 uppercase tracking-wider">v2.4</span>
                        {isPro && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider flex items-center gap-1">👑 PRO ACTIVE</span>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a href="admin.php?page=shelfsage-saved-designs" className="text-gray-600 font-medium text-sm hover:text-purple-600 px-3 py-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        My Library
                    </a>
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="bg-[#1a0b2e] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-purple-900 transition-all shadow-lg shadow-purple-900/20 flex items-center gap-2 transform hover:scale-105"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                        Save Shortcode
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className={`w-96 min-w-[22rem] ${sidebarBg} flex flex-col z-20 shadow-xl relative border-r border-purple-900/50 overflow-hidden`}>

                    {/* ══ SHORTCODE NAME + DELETE (pinned top) ══ */}
                    <div className="px-3 pt-3 pb-2 flex-shrink-0">
                        <div className="flex justify-end">
                            {currentShortcodeId && (
                                <button
                                    onClick={handleDelete}
                                    title="Delete this shortcode"
                                    className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ══ SHORTCODE CODE BLOCK — more visible ══ */}
                    <div className="px-3 pb-2 flex-shrink-0">
                        <div className="bg-[#0a0318] border border-purple-600/40 rounded-xl overflow-hidden shadow-lg shadow-purple-900/20">
                            {/* Label row */}
                            <div className="flex items-center justify-between px-3 py-2 border-b border-purple-900/30 bg-purple-950/30">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500/70"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/70"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/70"></div>
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Shortcode</span>
                                </div>
                                <button
                                    onClick={async () => { 
                                        if (!currentShortcodeId) return;
                                        const code = `[trs_shelfsage id=${currentShortcodeId}]`;
                                        try {
                                            if (navigator.clipboard && window.isSecureContext) {
                                                await navigator.clipboard.writeText(code);
                                            } else {
                                                const el = document.createElement('textarea');
                                                el.value = code;
                                                el.style.position = 'fixed';
                                                el.style.opacity = '0';
                                                document.body.appendChild(el);
                                                el.focus();
                                                el.select();
                                                document.execCommand('copy');
                                                document.body.removeChild(el);
                                            }
                                        } catch (err) {
                                            console.error('Copy failed:', err);
                                            const el = document.createElement('textarea');
                                            el.value = code;
                                            el.style.position = 'fixed';
                                            el.style.opacity = '0';
                                            document.body.appendChild(el);
                                            el.select();
                                            try {
                                                document.execCommand('copy');
                                            } finally {
                                                document.body.removeChild(el);
                                            }
                                        }
                                    }}
                                    className={`flex items-center gap-1.5 text-[10px] font-bold transition-all px-2.5 py-1 rounded-md ${currentShortcodeId ? 'text-purple-300 hover:text-white bg-purple-900/40 hover:bg-purple-600' : 'text-gray-500 cursor-not-allowed'}`}
                                    title={currentShortcodeId ? "Copy shortcode" : "Save to generate shortcode"}
                                    disabled={!currentShortcodeId}
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"></path></svg>
                                    Copy
                                </button>
                            </div>
                            {/* Code */}
                            <div className="px-4 py-3 bg-[#0d041c] relative group">
                                <code className="text-xs text-green-400 font-mono font-bold tracking-wide">
                                    {currentShortcodeId ? `[trs_shelfsage id=${currentShortcodeId}]` : <span className="text-gray-500 italic">Save design to generate shortcode...</span>}
                                </code>
                                {!currentShortcodeId && (
                                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[10px] text-white font-bold bg-purple-600 px-2 py-1 rounded">Click Save to Generate</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

<div style={{ flex: 1, overflowY: 'auto', padding: 20, paddingBottom: 80, marginTop: 8 }} className="custom-scrollbar sa-left-panel">
                        {/* ── 3-Tab Bar: Fetch Data | Layout | Designer ── */}
                        <div style={{ display: 'flex', gap: 4, padding: 4, background: '#231238', borderRadius: 10, border: '1px solid rgba(168,85,247,0.2)', marginBottom: 16 }}>
                            {[
                                { id: 'fetch', label: 'Fetch Data', icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8-4s8 1.79 8 4" /></svg> },
                                { id: 'layout', label: 'Layout', icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg> },
                                { id: 'styling', label: 'Designer', icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg> },
                            ].map(tab => {
                                const active = activeSection === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveSection(tab.id)}
                                        style={{
                                            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '8px 4px', borderRadius: 10, fontSize: 10, fontWeight: 700, transition: 'all 0.2s', border: 'none', cursor: 'pointer',
                                            background: active ? 'linear-gradient(135deg, #7c3aed, #c084fc)' : 'transparent',
                                            color: active ? '#ffffff' : '#6b7280',
                                            boxShadow: active ? '0 4px 12px rgba(124,58,237,0.4)' : 'none',
                                        }}
                                        onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#c084fc'; e.currentTarget.style.background = 'rgba(192,132,252,0.08)'; } }}
                                        onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; } }}
                                    >
                                        {tab.icon}
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* ── Panel Content ── */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                            {/* ════════════════════════════════
                                FETCH DATA TAB
                            ════════════════════════════════ */}
                            {activeSection === 'fetch' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                                    {/* ── FETCH BOOK DATA FROM ── */}
                                    {(() => {
                                        const DATA_SOURCES = [
                                            { value: 'woocommerce', label: 'WooCommerce', sub: 'Your store', icon: '🛒' },
                                            { value: 'google_books', label: 'Google Books', sub: 'ISBN lookup', icon: '📚', pro: true },
                                            { value: 'amazon', label: 'Amazon', sub: 'Product search', icon: '📦', pro: true },
                                            { value: 'vault', label: 'Vault', sub: 'Saved books', icon: '🗄️', pro: true },
                                            { value: 'smart_ingester', label: 'Smart Ingester', sub: 'AI import', icon: '⚡', pro: true },
                                        ];

                                        const QUERY_TYPES = {
                                            woocommerce: [
                                                { value: 'latest', label: 'Latest' },
                                                { value: 'featured', label: 'Featured' },
                                                { value: 'onsale', label: 'On Sale' },
                                                { value: 'bestsellers', label: 'Best Sellers' },
                                                { value: 'specific', label: 'Specific Items' },
                                                { value: 'category', label: 'By Category' },
                                                { value: 'genre', label: 'By Genre' },
                                                { value: 'author', label: 'By Author' },
                                                { value: 'publisher', label: 'By Publisher' },
                                            ],
                                            google_books: [
                                                { value: 'isbn', label: 'By ISBN' },
                                                { value: 'title', label: 'By Title' },
                                                { value: 'author', label: 'By Author' },
                                            ],
                                            amazon: [
                                                { value: 'keyword', label: 'Keyword' },
                                                { value: 'asin', label: 'By ASIN' },
                                                { value: 'bestseller', label: 'Best Sellers' },
                                            ],
                                            vault: [
                                                { value: 'all', label: 'All Books' },
                                                { value: 'category', label: 'By Category' },
                                                { value: 'author', label: 'By Author' },
                                            ],
                                            smart_ingester: [
                                                { value: 'query', label: 'AI Query' },
                                            ],
                                        };

                                        const SOURCE_STATUS = {
                                            woocommerce: { label: 'Live products from your store', color: '#4ade80' },
                                            google_books: { label: 'Search Google Books API', color: '#60a5fa' },
                                            amazon: { label: 'Amazon Product Advertising API', color: '#f59e0b' },
                                            vault: { label: 'From your saved book vault', color: '#c084fc' },
                                            smart_ingester: { label: 'AI-powered book import', color: '#f472b6' },
                                        };

                                        const source = settings.data_source || 'woocommerce';
                                        const queryType = settings.query_type || 'latest';
                                        const queries = QUERY_TYPES[source] || [];
                                        const status = SOURCE_STATUS[source];

                                        const setSource = (val) => {
                                            const firstQuery = (QUERY_TYPES[val] || [])[0]?.value || 'latest';
                                            setSettings(prev => ({ ...prev, data_source: val, query_type: firstQuery, isbn_input: '', amazon_query: '' }));
                                        };

                                        return (
                                            <div style={{ background: '#1a1030', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 10, padding: '10px 12px', fontFamily: '"DM Sans", sans-serif', display: 'flex', flexDirection: 'column', gap: 12 }}>

                                                {/* Header */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <div style={{ width: 22, height: 22, borderRadius: 6, background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>📖</div>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#cbd5e1', letterSpacing: '0.08em' }}>FETCH BOOK DATA FROM</span>
                                                </div>

                                                {/* Source cards 2-col grid */}
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                    {DATA_SOURCES.map(src => {
                                                        const isActive = source === src.value;
                                                        const locked = src.pro && !isPro;
                                                        return (
                                                            <button key={src.value} type="button"
                                                                onClick={() => !locked && setSource(src.value)}
                                                                style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '8px 10px', borderRadius: 8, textAlign: 'left', border: `1.5px solid ${isActive ? 'rgba(192,132,252,0.6)' : 'rgba(168,85,247,0.15)'}`, borderLeft: isActive ? '3px solid #c084fc' : undefined, background: isActive ? 'rgba(192,132,252,0.18)' : 'rgba(30,19,53,0.5)', cursor: locked ? 'not-allowed' : 'pointer', opacity: locked ? 0.4 : 1, transition: 'all 0.15s', boxShadow: isActive ? '0 0 10px rgba(192,132,252,0.15)' : 'none', overflow: 'hidden' }}>
                                                                {locked && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(0,0,0,0.08) 4px, rgba(0,0,0,0.08) 8px)', pointerEvents: 'none' }} />}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, width: '100%', position: 'relative', zIndex: 1 }}>
                                                                    <span style={{ fontSize: 13 }}>{src.icon}</span>
                                                                    <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 600, color: isActive ? '#f1f5f9' : '#94a3b8', flex: 1, transition: 'color 0.15s' }}>{src.label}</span>
                                                                    {src.pro && !isPro && <span style={{ fontSize: 7, fontWeight: 700, background: '#f59e0b', color: '#1a1030', padding: '1px 4px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2 }}>🔒 PRO</span>}
                                                                    {isActive && <span style={{ fontSize: 9, color: '#c084fc' }}>✓</span>}
                                                                </div>
                                                                <span style={{ fontSize: 10, color: isActive ? '#a78bfa' : '#6b7280', paddingLeft: 18, transition: 'color 0.15s', position: 'relative', zIndex: 1 }}>{src.sub}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>

                                                {/* Status pill */}
                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: `${status.color}18`, border: `1px solid ${status.color}44`, borderRadius: 9999, padding: '3px 10px', alignSelf: 'flex-start' }}>
                                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: status.color, flexShrink: 0 }} />
                                                    <span style={{ fontSize: 9, color: status.color, fontWeight: 600 }}>{status.label}</span>
                                                </div>

                                                <div style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }} />

                                                {/* Query type chips */}
                                                <div>
                                                    <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', marginBottom: 8 }}>QUERY TYPE</div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                        {queries.map(q => {
                                                            const isActiveQ = queryType === q.value;
                                                            return (
                                                                <button key={q.value} type="button"
                                                                    onClick={() => setSettings(prev => ({ ...prev, query_type: q.value, term_slug: '' }))}
                                                                    style={{ padding: '5px 11px', borderRadius: 9999, fontSize: 11, fontWeight: isActiveQ ? 700 : 500, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', transition: 'all 0.15s ease', border: isActiveQ ? '1.5px solid #c084fc' : '1.5px solid rgba(168,85,247,0.2)', background: isActiveQ ? 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(192,132,252,0.2))' : 'rgba(30,19,53,0.8)', color: isActiveQ ? '#f1f5f9' : '#c4b5fd', boxShadow: isActiveQ ? '0 2px 8px rgba(192,132,252,0.25)' : 'none' }}>
                                                                    {isActiveQ && <span style={{ marginRight: 4, fontSize: 9, color: '#c084fc' }}>✓</span>}
                                                                    {q.label}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                            </div>
                                        );
                                    })()}

                                    {/* ── Dynamic Input Panel (INGESTER INTEGRATED) ── */}
                                    <div>
                                        <div className="px-3 pb-3">
                                            {/* SMART BOOK INGESTER */}
                                            {(settings.data_source === 'google_books' || settings.data_source === 'smart_ingester') && (
                                                <div className="mb-4">
                                                    <PremiumLockedOverlay
                                                        isPro={shelfSage_license_status === 'active'}
                                                        featureName="Smart Book Ingester"
                                                        mode="overlay"
                                                        customCta="Activate Pro to Ingest"
                                                        lockIcon="🔒"
                                                    >
                                                        <div className="bg-gradient-to-br from-purple-900/40 to-indigo-900/40 p-4 rounded-xl border border-purple-500/30 shadow-lg">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-lg shadow-lg text-white">✨</div>
                                                                <div>
                                                                    <h3 className="text-xs font-black text-white tracking-tight">Smart Book Ingester</h3>
                                                                    <p className="text-[9px] text-purple-300 font-bold uppercase tracking-wider opacity-80">Metadata Pro Engine</p>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-3">
                                                                <div className="relative group">
                                                                    <input type="text" value={ingesterQuery} onChange={(e) => setIngesterQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleIngesterFetch()} placeholder="Enter Book Title or ISBN..." className="w-full bg-[#1a0b2e] text-purple-100 text-[11px] border border-purple-500/30 rounded-lg px-3 py-2.5 pr-8 outline-none focus:border-purple-400 transition-all placeholder:text-gray-600 font-medium" />
                                                                    {ingesterQuery && !ingesterLoading && (<button onClick={() => setIngesterQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-purple-400"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>)}
                                                                    {ingesterLoading && (<div className="absolute right-2.5 top-1/2 -translate-y-1/2"><svg className="animate-spin h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>)}
                                                                </div>
                                                                <div className="flex items-center gap-3 mb-4">
                                                                    <div className="flex-1">
                                                                        <label className="text-[9px] font-bold text-purple-300 mb-1 block uppercase tracking-wider opacity-70">Items to Fetch</label>
                                                                        <div className="flex items-center gap-3">
                                                                            <input type="range" min="1" max="20" value={ingesterMaxResults} onChange={(e) => setIngesterMaxResults(parseInt(e.target.value))} className="flex-1 h-1.5 bg-[#1a0b2e] rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                                                            <span className="text-[11px] font-black text-purple-400 w-5 text-center bg-purple-500/10 rounded py-0.5">{ingesterMaxResults}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <button onClick={handleIngesterFetch} disabled={ingesterLoading || !ingesterQuery.trim()} className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-[10px] font-black py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-900/20">
                                                                        {ingesterLoading ? 'Fetching...' : 'Fetch Metadata'}
                                                                    </button>
                                                                    {settings.ingested_data && (
                                                                        <button onClick={handleClearIngester} className="bg-transparent border border-purple-500/30 text-purple-300 hover:bg-purple-500/10 text-[10px] font-bold px-3 py-2.5 rounded-lg transition-all" title="Clear Current Metadata">Clear</button>
                                                                    )}
                                                                </div>
                                                                {ingesterError && (
                                                                    <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-medium flex items-center justify-between gap-2">
                                                                        <span>{ingesterError}</span>
                                                                        <button onClick={() => setIngesterError('')} className="text-red-400 hover:text-red-200 shrink-0" aria-label="Dismiss">×</button>
                                                                    </div>
                                                                )}
                                                                {settings.isbn_results && settings.isbn_results.length > 0 && !ingesterLoading && (
                                                                    <div className="mt-4 pt-4 border-t border-purple-500/20 animate-in fade-in slide-in-from-top-2 space-y-4">
                                                                        {settings.isbn_results.length > 0 && (
                                                                            <div>
                                                                                <label className="text-[9px] font-bold text-purple-300 mb-2 block uppercase tracking-wider opacity-70">Selective Editor (Visual Strip)</label>
                                                                                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar snap-x scroll-smooth">
                                                                                    {settings.isbn_results.map((book, idx) => (
                                                                                        <div key={book.id || idx} className={`relative flex-shrink-0 group cursor-pointer snap-start transition-all duration-300 ${idx === ingesterSelectedIndex ? 'scale-105' : 'opacity-60 hover:opacity-100 hover:scale-105'}`} onClick={() => setIngesterSelectedIndex(idx)}>
                                                                                            <div className={`w-14 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === ingesterSelectedIndex ? 'border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]' : 'border-purple-500/20'}`}>
                                                                                                <img src={book.ss_book_cover_url || book.image} alt={book.title} className="w-full h-full object-cover" />
                                                                                            </div>
                                                                                            {idx === ingesterSelectedIndex && (<div className="absolute inset-0 ring-4 ring-purple-500/20 rounded-lg animate-pulse" />)}
                                                                                            <button onClick={(e) => { e.stopPropagation(); handleRemoveIngestedBook(idx); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 z-10">
                                                                                                <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" /></svg>
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {settings.isbn_results[ingesterSelectedIndex] && (
                                                                            <div className="space-y-3 bg-purple-500/5 p-3 rounded-lg border border-purple-500/10">
                                                                                <div>
                                                                                    <label className="text-[9px] font-bold text-gray-500 mb-1 block uppercase tracking-wider">Book Title Override</label>
                                                                                    <input type="text" value={settings.isbn_results[ingesterSelectedIndex].ss_book_title || ''} onChange={(e) => { const val = e.target.value; setSettings(prev => { const newResults = [...prev.isbn_results]; newResults[ingesterSelectedIndex] = { ...newResults[ingesterSelectedIndex], ss_book_title: val }; return { ...prev, isbn_results: newResults }; }); setPreviewProducts(prev => prev.map((p, idx) => idx === ingesterSelectedIndex ? getNormalizedData({ ...settings.isbn_results[ingesterSelectedIndex], ss_book_title: val }, 'google_books', settings) : p)); }} className="w-full bg-[#1a0b2e] text-white text-[11px] border border-purple-500/20 rounded px-2 py-1.5 outline-none focus:border-purple-400 font-medium" />
                                                                                </div>
                                                                                <div>
                                                                                    <label className="text-[9px] font-bold text-gray-500 mb-1 block uppercase tracking-wider">Button Action (Text & URL)</label>
                                                                                    <div className="grid grid-cols-2 gap-2">
                                                                                        <input type="text" value={settings.isbn_results[ingesterSelectedIndex].button_text || ''} onChange={(e) => { const val = e.target.value; setSettings(prev => { const newResults = [...prev.isbn_results]; newResults[ingesterSelectedIndex] = { ...newResults[ingesterSelectedIndex], button_text: val }; return { ...prev, isbn_results: newResults }; }); setPreviewProducts(prev => prev.map((p, idx) => idx === ingesterSelectedIndex ? getNormalizedData({ ...settings.isbn_results[ingesterSelectedIndex], button_text: val }, 'google_books', settings) : p)); }} placeholder="e.g. Buy Now" className="w-full bg-[#1a0b2e] text-white text-[10px] border border-purple-500/20 rounded px-2 py-1.5 outline-none focus:border-purple-400" />
                                                                                        <input type="text" value={settings.isbn_results[ingesterSelectedIndex].button_link || ''} onChange={(e) => { const val = e.target.value; setSettings(prev => { const newResults = [...prev.isbn_results]; if (applyLinkToAll) { newResults.forEach((item, i) => { newResults[i] = { ...item, button_link: val }; }); } else { newResults[ingesterSelectedIndex] = { ...newResults[ingesterSelectedIndex], button_link: val }; } return { ...prev, isbn_results: newResults }; }); if (applyLinkToAll) { setPreviewProducts(prev => prev.map((p, idx) => getNormalizedData({ ...settings.isbn_results[idx], button_link: val }, 'google_books', settings))); } else { setPreviewProducts(prev => prev.map((p, idx) => idx === ingesterSelectedIndex ? getNormalizedData({ ...settings.isbn_results[ingesterSelectedIndex], button_link: val }, 'google_books', settings) : p)); } }} placeholder="Paste URL..." className="w-full bg-[#1a0b2e] text-white text-[10px] border border-purple-500/20 rounded px-2 py-1.5 outline-none focus:border-purple-400" />
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 mt-2">
                                                                                        <input type="checkbox" id="bulk-link-ingest" checked={applyLinkToAll} onChange={(e) => setApplyLinkToAll(e.target.checked)} className="w-3 h-3 rounded border-purple-500/30 bg-[#1a0b2e] text-purple-600 focus:ring-purple-500" />
                                                                                        <label htmlFor="bulk-link-ingest" className="text-[10px] font-bold text-purple-300/80 cursor-pointer hover:text-purple-300 transition-colors">Apply link to all {settings.isbn_results.length} results</label>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                                {!ingesterLoading && (!settings.isbn_results || settings.isbn_results.length === 0) && (
                                                                    <div className="mt-5 p-3 rounded-lg border border-purple-500/10 bg-purple-500/5 animate-in fade-in zoom-in-95 duration-500">
                                                                        <div className="flex items-center gap-2 mb-2"><span className="text-[10px]">💡</span><span className="text-[9px] font-black text-purple-300 uppercase tracking-tighter">How to Search</span></div>
                                                                        <div className="space-y-1.5">
                                                                            <div className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-purple-500 mt-1"></div><p className="text-[9px] text-gray-400 font-medium leading-relaxed"><strong className="text-purple-300/90 underline decoration-purple-500/30">ISBN Search:</strong> Enter 10/13 digit codes for 100% accuracy.</p></div>
                                                                            <div className="flex items-start gap-2"><div className="w-1 h-1 rounded-full bg-blue-500 mt-1"></div><p className="text-[9px] text-gray-400 font-medium"><strong className="text-blue-300/90 underline decoration-blue-500/30">Quick Search:</strong> Type "Book Title + Author" for best results.</p></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </PremiumLockedOverlay>
                                                </div>
                                            )}
                                            {settings.data_source === 'woocommerce' && (
                                                <div className="space-y-2.5">
                                                    {['category', 'genre', 'author', 'publisher'].includes(settings.query_type) && (
                                                        termsLoading ? (<div className="text-gray-400 text-xs italic">Loading terms...</div>) : (
                                                            <select value={settings.term_slug} onChange={(e) => setSettings({ ...settings, term_slug: e.target.value })} className="w-full bg-[#1a0b2e] text-purple-200 text-xs font-bold border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-purple-500">
                                                                <option value="">-- Choose {settings.query_type} --</option>
                                                                {availableTerms.map(term => <option key={term.id} value={term.slug}>{term.name} ({term.count})</option>)}
                                                            </select>
                                                        )
                                                    )}

                                                    {/* ── Specific Items Product Picker ── */}
                                                    {settings.query_type === 'specific' && (
                                                        <div className="mt-2 space-y-2">
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    value={specificSearch}
                                                                    onChange={(e) => {
                                                                        setSpecificSearch(e.target.value);
                                                                        searchSpecificProducts(e.target.value);
                                                                    }}
                                                                    placeholder="Search products by name..."
                                                                    className="w-full bg-[#1a0b2e] text-purple-200 text-xs font-bold border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-purple-500 pr-8"
                                                                />
                                                                {specificSearching && (
                                                                    <svg className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                                )}
                                                            </div>

                                                            {/* Search results dropdown */}
                                                            {specificResults.length > 0 && (
                                                                <div className="bg-[#0f0720] border border-purple-800/50 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                                                                    {specificResults.map(p => {
                                                                        const alreadySelected = (settings.selectedProducts || []).some(s => s.id === p.id);
                                                                        return (
                                                                            <button
                                                                                key={p.id}
                                                                                disabled={alreadySelected}
                                                                                onClick={() => {
                                                                                    if (!alreadySelected) {
                                                                                        setSettings(prev => ({ ...prev, selectedProducts: [...(prev.selectedProducts || []), { id: p.id, title: p.title, thumbnail: p.thumbnail }] }));
                                                                                    }
                                                                                }}
                                                                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-left border-b border-purple-900/30 last:border-b-0 transition-all ${alreadySelected ? 'opacity-40 cursor-not-allowed' : 'hover:bg-purple-900/40 cursor-pointer'}`}
                                                                            >
                                                                                {p.thumbnail ? (
                                                                                    <img src={p.thumbnail} className="w-7 h-9 object-cover rounded flex-shrink-0" alt="" />
                                                                                ) : (
                                                                                    <div className="w-7 h-9 bg-purple-900/50 rounded flex-shrink-0 flex items-center justify-center text-[10px]">📚</div>
                                                                                )}
                                                                                <span className="text-[11px] text-purple-200 font-bold truncate flex-1">{p.title}</span>
                                                                                {alreadySelected && <span className="text-[9px] text-green-400 font-black flex-shrink-0">✓</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}

                                                            {/* Selected products list */}
                                                            {(settings.selectedProducts || []).length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center justify-between">
                                                                        <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest">{(settings.selectedProducts || []).length} item{(settings.selectedProducts || []).length !== 1 ? 's' : ''} selected</p>
                                                                        <button
                                                                            onClick={() => setSettings(prev => ({ ...prev, selectedProducts: [] }))}
                                                                            className="text-[9px] font-black text-red-400 hover:text-red-300 transition-colors"
                                                                        >
                                                                            Clear all
                                                                        </button>
                                                                    </div>
                                                                    <div className="space-y-1 max-h-44 overflow-y-auto custom-scrollbar">
                                                                        {(settings.selectedProducts || []).map((p, idx) => (
                                                                            <div key={p.id} className="group flex items-center gap-2 bg-[#1a0b2e] border border-purple-800/40 hover:border-red-500/40 rounded-lg px-2 py-1.5 transition-all">
                                                                                <span className="text-[9px] font-black text-purple-600 w-4 flex-shrink-0 text-center">{idx + 1}</span>
                                                                                {p.thumbnail ? (
                                                                                    <img src={p.thumbnail} className="w-6 h-8 object-cover rounded flex-shrink-0" alt="" />
                                                                                ) : (
                                                                                    <div className="w-6 h-8 bg-purple-900/50 rounded flex-shrink-0 flex items-center justify-center text-[9px]">📚</div>
                                                                                )}
                                                                                <span className="text-[11px] text-purple-200 font-bold truncate flex-1">{p.title}</span>
                                                                                <button
                                                                                    onClick={() => setSettings(prev => ({ ...prev, selectedProducts: (prev.selectedProducts || []).filter(x => x.id !== p.id) }))}
                                                                                    title="Remove"
                                                                                    className="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-red-500/10 text-red-400/60 group-hover:bg-red-500 group-hover:text-white transition-all text-xs font-black"
                                                                                >
                                                                                    ✕
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {(settings.selectedProducts || []).length === 0 && !specificSearching && !specificSearch && (
                                                                <p className="text-[10px] text-gray-500 italic text-center py-2">Search and select products above</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {/* AMAZON: ASIN / Keywords + Fetch */}
                                            {settings.data_source === 'amazon' && (
                                                <div className={`space-y-2 ${!isPro ? 'opacity-60 pointer-events-none' : ''}`}>
                                                    <div className="grid grid-cols-2 gap-1 bg-[#1a0b2e] p-1 rounded-lg border border-purple-900/40">
                                                        {[{ value: 'keywords', label: '🔍 Keywords' }, { value: 'asin', label: '🔢 ASIN' }].map(({ value, label }) => (<button key={value} onClick={() => setSettings(prev => ({ ...prev, amazon_search_type: value }))} className={`py-1.5 rounded-md text-[10px] font-bold transition-all ${settings.amazon_search_type === value ? 'bg-orange-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>{label}</button>))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input type="text" value={settings.amazon_query} onChange={(e) => setSettings({ ...settings, amazon_query: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && fetchAmazonBooks()} placeholder={settings.amazon_search_type === 'asin' ? 'B000FC1PJC, …' : 'Harry Potter…'} className="flex-1 bg-[#1a0b2e] text-purple-200 text-xs font-mono border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-orange-500 placeholder:text-gray-600" />
                                                        <button onClick={fetchAmazonBooks} className="bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white text-[10px] font-black px-2.5 rounded-lg transition-all">Fetch</button>
                                                    </div>
                                                    <div className="mt-2 group">
                                                        <label className="text-[9px] font-bold text-gray-500 mb-1 block uppercase tracking-wider group-hover:text-orange-400 transition-colors">Amazon Associate Tag</label>
                                                        <div className="relative">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-600">🏷️</span>
                                                            <input type="text" value={settings.amazon_associate_tag} onChange={(e) => setSettings({ ...settings, amazon_associate_tag: e.target.value })} placeholder="shelfsage-20" className="w-full bg-[#1a0b2e] text-orange-400 text-[10px] font-bold border border-purple-800/40 rounded-lg pl-7 pr-3 py-2 outline-none focus:border-orange-500 placeholder:text-gray-700 transition-all" />
                                                        </div>
                                                    </div>
                                                    {amazonError && (
                                                        <div className="mt-2 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-[10px] font-medium flex items-center justify-between gap-2">
                                                            <span>{amazonError}</span>
                                                            <button onClick={() => setAmazonError('')} className="text-red-400 hover:text-red-200 shrink-0" aria-label="Dismiss">×</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            {/* Vault: Query filters — Author, Publisher, Category, Genre */}
                                            {settings.data_source === 'vault' && isPro && (
                                                <div className="space-y-2">
                                                    <p className="text-[10px] text-violet-300 font-bold uppercase tracking-wider">Query Filters</p>
                                                    <input type="text" value={settings.vault_query_author || ''} onChange={e => setSettings({ ...settings, vault_query_author: e.target.value })} placeholder="Author…" className="w-full bg-[#1a0b2e] text-purple-200 text-[11px] border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-purple-500" />
                                                    <input type="text" value={settings.vault_query_publisher || ''} onChange={e => setSettings({ ...settings, vault_query_publisher: e.target.value })} placeholder="Publisher…" className="w-full bg-[#1a0b2e] text-purple-200 text-[11px] border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-purple-500" />
                                                    <input type="text" value={settings.vault_query_category || ''} onChange={e => setSettings({ ...settings, vault_query_category: e.target.value })} placeholder="Category…" className="w-full bg-[#1a0b2e] text-purple-200 text-[11px] border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-purple-500" />
                                                    <input type="text" value={settings.vault_query_genre || ''} onChange={e => setSettings({ ...settings, vault_query_genre: e.target.value })} placeholder="Genre…" className="w-full bg-[#1a0b2e] text-purple-200 text-[11px] border border-purple-800/50 rounded-lg px-3 py-2 outline-none focus:border-purple-500" />
                                                </div>
                                            )}
                                            {settings.data_source === 'vault' && !isPro && (
                                                <p className="text-[10px] text-violet-300 font-bold">Vault requires PRO</p>
                                            )}
                                        </div>
                                    </div>
                                    {/* ── Sort & Order Controls (WooCommerce + Vault, PRO) ── */}
                                    {(settings.data_source === 'woocommerce' || settings.data_source === 'vault') && (
                                        <div style={{ background: '#231238', borderRadius: 12, border: '1px solid rgba(168,85,247,0.25)', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: '1px solid rgba(168,85,247,0.15)' }}>
                                                <div style={{ width: 20, height: 20, background: 'rgba(124,58,237,0.6)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                    <svg style={{ width: 12, height: 12, color: '#c4b5fd' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>
                                                </div>
                                                <span style={{ fontSize: 12, fontWeight: 800, color: '#c4b5fd', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sort & Order</span>
                                                {!isPro && <span style={{ marginLeft: 'auto', background: '#f59e0b', color: '#1a1030', fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 3 }}>🔒 PRO</span>}
                                            </div>
                                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 12, opacity: !isPro ? 0.4 : 1, pointerEvents: !isPro ? 'none' : 'auto', userSelect: !isPro ? 'none' : 'auto' }}>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Sort By</label>
                                                    <div className="grid grid-cols-3 gap-1">
                                                        {[
                                                            { value: 'date', label: 'Date', icon: '📅' },
                                                            { value: 'title', label: 'A → Z', icon: '🔤' },
                                                            { value: 'modified', label: 'Modified', icon: '🔄' },
                                                            { value: 'price', label: 'Price', icon: '💰' },
                                                            { value: 'rating', label: 'Rating', icon: '⭐' },
                                                            { value: 'rand', label: 'Random', icon: '🎲' },
                                                        ].map(opt => (
                                                            <button key={opt.value} type="button" onClick={() => isPro && setSettings(prev => ({ ...prev, sort_by: opt.value }))} className={`flex flex-col items-center py-1.5 px-0.5 rounded-md text-[9px] font-bold transition-all border ${settings.sort_by === opt.value ? 'bg-purple-600 border-purple-500 text-white shadow-md' : 'bg-[#2d1b4e] border-purple-800/50 text-gray-400 hover:text-white hover:border-purple-500 hover:bg-[#36205d]'}`}>
                                                                <span>{opt.icon}</span>
                                                                <span>{opt.label}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Order</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        {[
                                                            { value: 'desc', label: '↓ Descending' },
                                                            { value: 'asc', label: '↑ Ascending' },
                                                        ].map(opt => (
                                                            <button key={opt.value} type="button" onClick={() => isPro && setSettings(prev => ({ ...prev, sort_order: opt.value }))} className={`py-2 rounded-lg text-[10px] font-bold transition-all border ${settings.sort_order === opt.value ? 'bg-purple-600 border-purple-500 text-white shadow-md' : 'bg-[#2d1b4e] border-purple-800/50 text-gray-400 hover:text-white hover:border-purple-500'}`}>
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                {settings.query_type === 'bestsellers' && (<p style={{ fontSize: 9, color: 'rgba(192,132,252,0.7)', fontStyle: 'italic', textAlign: 'center' }}>Best Sellers are sorted by sales count</p>)}
                                                {!isPro && (
                                                    <a href={typeof window !== 'undefined' && window.rmssAdminSettings?.upgradeUrl ? window.rmssAdminSettings.upgradeUrl : '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', textAlign: 'center', marginTop: 8, cursor: 'pointer', textDecoration: 'none' }}>✦ Unlock with ShelfSage Pro →</a>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            {/* LAYOUT CONTROLS */}
                            {activeSection === 'layout' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 4 }}>
                                    <DisplayModeAndTemplate
                                        settings={settings}
                                        setSettings={setSettings}
                                        isPro={isPro}
                                        onLayoutChange={handleLayoutChange}
                                    />

                                    {settings.layout !== 'masonry' && (
                                        <ColumnSelector settings={settings} setSettings={setSettings} disabled={false} />
                                    )}

                                    {/* 3D FLIP BOOK CONTROLS */}
                                    {settings.design === 'design-flip3d' && (
                                        <PremiumLockedOverlay isPro={isPro} featureName="3D Flip Book">
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-4 bg-[#231238] p-3 rounded-lg border border-purple-900/30">
                                                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                                    <span>✦</span> 3D Flip Book Controls
                                                </p>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Spine Depth ({settings.flip3d_depth}px)</label>
                                                    <input type="range" min="10" max="60" value={settings.flip3d_depth} onChange={(e) => setSettings({ ...settings, flip3d_depth: parseInt(e.target.value) })} className="w-full h-1 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Perspective ({settings.flip3d_perspective}px)</label>
                                                    <input type="range" min="600" max="2400" step="100" value={settings.flip3d_perspective} onChange={(e) => setSettings({ ...settings, flip3d_perspective: parseInt(e.target.value) })} className="w-full h-1 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Inner Page Color</label>
                                                    <div className="flex items-center gap-2">
                                                        <input type="color" value={settings.flip3d_page_color} onChange={(e) => setSettings({ ...settings, flip3d_page_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
                                                        <span className="text-xs text-purple-300 font-mono">{settings.flip3d_page_color}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">Cover Finish</label>
                                                    <div className="flex gap-2">
                                                        {['glossy', 'matte'].map(f => (
                                                            <button key={f} onClick={() => setSettings({ ...settings, flip3d_finish: f })} className={`flex-1 py-1.5 rounded-md text-xs font-bold border transition-all ${settings.flip3d_finish === f ? 'bg-amber-500/20 border-amber-500/50 text-amber-300' : 'bg-[#2d1b4e] border-purple-800/50 text-gray-400'}`}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </PremiumLockedOverlay>
                                    )}

                                    {/* MASONRY CONTROLS */}
                                    {settings.layout === 'masonry' && (
                                        <div className="animate-in slide-in-from-top-2 duration-300">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Masonry Columns ({settings.masonry_cols})</label>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg">🧱</span>
                                                <input type="range" min="2" max="5" value={settings.masonry_cols} onChange={(e) => setSettings({ ...settings, masonry_cols: parseInt(e.target.value) })} className="w-full h-1 bg-purple-900 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                                            </div>
                                        </div>
                                    )}

                                    {/* Books to Show — compact dropdown */}
                                    <BooksToShowDropdown settings={settings} setSettings={setSettings} />

                                    {/* ── BADGE SECTION ── */}
                                    {(() => {
                                        const DESIGNS = [
                                            { value: 'scalloped', label: 'Scalloped', icon: '✦' },
                                            { value: 'circle', label: 'Circle', icon: '●' },
                                            { value: 'pill', label: 'Pill', icon: '▬' },
                                            { value: 'ribbon', label: 'Ribbon', icon: '🎀' },
                                            { value: 'square', label: 'Square', icon: '■' },
                                        ];
                                        const POSITIONS = [
                                            { value: 'top-left', label: 'Top Left', icon: '↖' },
                                            { value: 'top-right', label: 'Top Right', icon: '↗' },
                                            { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
                                            { value: 'bottom-right', label: 'Bottom Right', icon: '↘' },
                                        ];

                                        const show = settings.show_badge;
                                        const design = settings.badge_design || 'scalloped';
                                        const position = settings.badge_position || 'top-right';
                                        const bgColor = settings.badge_bg_color || '#dc2626';
                                        const txtColor = settings.badge_text_color || '#ffffff';
                                        const set = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

                                        return (
                                            <div style={{ background: '#1a1030', border: '1px solid rgba(168,85,247,0.12)', borderRadius: 10, padding: '10px 12px', fontFamily: '"DM Sans", sans-serif' }}>

                                                {/* Header + toggle */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                                    <span style={{ fontSize: 10, fontWeight: 700, color: '#c4b5fd', letterSpacing: '0.08em' }}>BADGE</span>
                                                    <button type="button" onClick={() => set('show_badge', !show)}
                                                        style={{ position: 'relative', width: 44, height: 24, borderRadius: 9999, background: show ? '#9333ea' : '#1a0b2e', border: `1px solid ${show ? '#a855f7' : 'rgba(168,85,247,0.25)'}`, cursor: 'pointer', transition: 'all 0.2s', padding: 0, boxShadow: show ? '0 0 10px rgba(147,51,234,0.4)' : 'none' }}>
                                                        <span style={{ position: 'absolute', top: 2, left: show ? 22 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                                                    </button>
                                                </div>

                                                {show && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                                                        {/* Design — no inline preview; live preview is on the right */}
                                                        <div>
                                                            <div style={{ fontSize: 9, fontWeight: 600, color: '#c4b5fd', letterSpacing: '0.07em', marginBottom: 4, paddingLeft: 1 }}>DESIGN</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                {DESIGNS.map(d => {
                                                                    const isActive = design === d.value;
                                                                    return (
                                                                        <button key={d.value} type="button" onClick={() => set('badge_design', d.value)}
                                                                            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 8px', borderRadius: 7, width: '100%', border: `1px solid ${isActive ? 'rgba(192,132,252,0.5)' : 'rgba(168,85,247,0.2)'}`, background: isActive ? 'rgba(192,132,252,0.15)' : 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}>
                                                                            <span style={{ fontSize: 10, color: isActive ? '#c084fc' : '#94a3b8', width: 12, textAlign: 'center', flexShrink: 0 }}>{d.icon}</span>
                                                                            <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 500, color: isActive ? '#e2e8f0' : '#c4b5fd', flex: 1 }}>{d.label}</span>
                                                                            {isActive && <span style={{ color: '#c084fc', fontSize: 10 }}>✓</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }} />

                                                        {/* Position 2x2 */}
                                                        <div>
                                                            <div style={{ fontSize: 9, fontWeight: 600, color: '#c4b5fd', letterSpacing: '0.07em', marginBottom: 4, paddingLeft: 1 }}>POSITION</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                                                                {POSITIONS.map(p => {
                                                                    const isActive = position === p.value;
                                                                    return (
                                                                        <button key={p.value} type="button" onClick={() => set('badge_position', p.value)}
                                                                            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 7, border: `1px solid ${isActive ? 'rgba(192,132,252,0.5)' : 'rgba(168,85,247,0.2)'}`, background: isActive ? 'rgba(192,132,252,0.15)' : 'rgba(30,19,53,0.6)', cursor: 'pointer', transition: 'all 0.15s' }}>
                                                                            <span style={{ fontSize: 11, color: isActive ? '#c084fc' : '#94a3b8' }}>{p.icon}</span>
                                                                            <span style={{ fontSize: 10, fontWeight: isActive ? 700 : 500, color: isActive ? '#e2e8f0' : '#c4b5fd' }}>{p.label}</span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <div style={{ borderTop: '1px solid rgba(168,85,247,0.1)' }} />

                                                        {/* Colors */}
                                                        <div>
                                                            <div style={{ fontSize: 9, fontWeight: 600, color: '#c4b5fd', letterSpacing: '0.07em', marginBottom: 4, paddingLeft: 1 }}>COLORS</div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                                {[
                                                                    { key: 'badge_bg_color', label: 'Background', val: bgColor },
                                                                    { key: 'badge_text_color', label: 'Text', val: txtColor },
                                                                ].map(({ key, label, val }) => (
                                                                    <div key={key}>
                                                                        <div style={{ fontSize: 9, color: '#a78bfa', marginBottom: 4 }}>{label}</div>
                                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', background: 'rgba(30,19,53,0.6)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 7, padding: '5px 8px' }}>
                                                                            <input type="color" value={val && /^#[0-9A-Fa-f]{6}$/.test(val) ? val : (key === 'badge_bg_color' ? '#dc2626' : '#ffffff')} onChange={e => set(key, e.target.value)}
                                                                                style={{ width: 20, height: 20, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }} />
                                                                            <span style={{ fontSize: 10, color: '#c4b5fd', fontFamily: 'ui-monospace, monospace' }}>{val}</span>
                                                                        </label>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()}

                                    {/* ── Look Inside Position Picker ── */}
                                    {settings.show_look_inside && (() => {
                                        const positions = [
                                            { value: 'top-left', label: 'Top Left', icon: '↖' },
                                            { value: 'top-right', label: 'Top Right', icon: '↗' },
                                            { value: 'top-left-outer', label: 'Above Image', icon: '⬆' },
                                            { value: 'overlay-center', label: 'Hover Overlay Center', icon: '◎' },
                                            { value: 'bottom-left', label: 'Bottom Left', icon: '↙' },
                                            { value: 'bottom-center', label: 'Bottom Center', icon: '⬇' },
                                        ];
                                        const zones = [
                                            { label: 'OVER IMAGE', values: ['top-left', 'top-right', 'overlay-center'] },
                                            { label: 'OUTSIDE', values: ['top-left-outer'] },
                                            { label: 'BELOW IMAGE', values: ['bottom-left', 'bottom-center'] },
                                        ];
                                        const cur = settings.look_inside_btn_position || 'bottom-left';
                                        const activeLabel = positions.find(p => p.value === cur)?.label;

                                        return (
                                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: 16, fontFamily: '"DM Sans", sans-serif' }}>
                                                <div style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span>LOOK INSIDE BTN</span>
                                                    {!isPro
                                                        ? <span style={{ fontSize: 9, fontWeight: 700, background: '#f59e0b', color: '#1a1030', padding: '2px 6px', borderRadius: 10, display: 'inline-flex', alignItems: 'center', gap: 3 }}>🔒 PRO</span>
                                                        : <span style={{ color: '#c084fc', fontSize: 11, fontWeight: 600 }}>{activeLabel}</span>
                                                    }
                                                </div>
                                                <div style={{ opacity: isPro ? 1 : 0.4, pointerEvents: isPro ? 'auto' : 'none' }}>
                                                    {zones.map((zone, zi) => (
                                                        <div key={zone.label} style={{ marginBottom: zi < zones.length - 1 ? 10 : 0 }}>
                                                            <div style={{ fontSize: 10, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.07em', marginBottom: 4, paddingLeft: 2 }}>{zone.label}</div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                                {zone.values.map(v => {
                                                                    const pos = positions.find(p => p.value === v);
                                                                    const isActive = cur === v;
                                                                    return (
                                                                        <button
                                                                            key={v}
                                                                            type="button"
                                                                            onClick={() => isPro && setSettings(prev => ({ ...prev, look_inside_btn_position: v }))}
                                                                            style={{
                                                                                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, width: '100%',
                                                                                border: `1px solid ${isActive ? 'rgba(192,132,252,0.5)' : 'rgba(168,85,247,0.2)'}`,
                                                                                background: isActive ? 'rgba(192,132,252,0.15)' : 'rgba(255,255,255,0.04)',
                                                                                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                                                                            }}
                                                                        >
                                                                            <span style={{ fontSize: isActive ? 12 : 13, color: isActive ? '#c084fc' : '#c4b5fd', width: 14, textAlign: 'center', flexShrink: 0 }}>{pos.icon}</span>
                                                                            <span style={{ fontSize: isActive ? 11 : 12, fontWeight: isActive ? 700 : 600, color: isActive ? '#e2e8f0' : '#c4b5fd', flex: 1 }}>{pos.label}</span>
                                                                            {isActive && <span style={{ color: '#c084fc', fontSize: 11 }}>✓</span>}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {!isPro && <a href={typeof window !== 'undefined' && window.rmssAdminSettings?.upgradeUrl ? window.rmssAdminSettings.upgradeUrl : '#'} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginTop: 8, display: 'block', cursor: 'pointer', textDecoration: 'none' }}>✦ Unlock with ShelfSage Pro →</a>}
                                            </div>
                                        );
                                    })()}

                                    {/* ── VISUAL ELEMENTS ── */}
                                    {(() => {
                                        const ELEMENTS = [
                                            { key: 'show_title', label: 'Title' },
                                            { key: 'show_author_badge', label: 'Author' },
                                            { key: 'show_price', label: 'Price' },
                                            { key: 'show_rating', label: 'Rating' },
                                            { key: 'show_image', label: 'Image' },
                                            { key: 'show_cart', label: 'Cart Button' },
                                            { key: 'show_look_inside', label: 'Look Inside' },
                                        ];

                                        const allOn = ELEMENTS.every(e => settings[e.key]);

                                        const toggleAll = () => {
                                            const newVal = !allOn;
                                            setSettings(prev => {
                                                const updated = { ...prev };
                                                ELEMENTS.forEach(e => { updated[e.key] = newVal; });
                                                return updated;
                                            });
                                        };

                                        return (
                                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 12, padding: 16, fontFamily: '"DM Sans", sans-serif' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em' }}>VISUAL ELEMENTS</span>
                                                    <button type="button" onClick={toggleAll}
                                                        style={{ fontSize: 10, fontWeight: 700, color: allOn ? '#c084fc' : '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', letterSpacing: '0.06em', padding: 0, transition: 'color 0.15s' }}>
                                                        {allOn ? 'HIDE ALL' : 'SHOW ALL'}
                                                    </button>
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                                    {ELEMENTS.map(({ key, label }) => {
                                                        const isOn = !!settings[key];
                                                        return (
                                                            <button key={key} type="button"
                                                                onClick={() => setSettings(prev => ({ ...prev, [key]: !prev[key] }))}
                                                                style={{ padding: '5px 11px', borderRadius: 9999, fontSize: 11, fontWeight: isOn ? 700 : 500, fontFamily: '"DM Sans", sans-serif', cursor: 'pointer', transition: 'all 0.15s ease', border: isOn ? '1.5px solid rgba(192,132,252,0.5)' : '1.5px solid rgba(168,85,247,0.1)', background: isOn ? 'rgba(192,132,252,0.15)' : 'rgba(30,19,53,0.6)', color: isOn ? '#e2d9f3' : '#94a3b8', boxShadow: isOn ? 'none' : 'none', letterSpacing: '0.01em' }}>
                                                                {isOn && <span style={{ marginRight: 4, fontSize: 9, color: '#c084fc' }}>✓</span>}
                                                                {label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* <div className="p-4 bg-[#231238] rounded-2xl border border-purple-900/40">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">How it works</h4>
                                        <ul className="space-y-2">
                                            {[
                                                { icon: '🔍', text: 'Search by Title, Author, or ISBN' },
                                                { icon: '🚀', text: 'Live preview updates instantly' },
                                                { icon: '💎', text: 'High-res covers automatically fetched' }
                                            ].map((step, i) => (
                                                <li key={i} className="flex items-center gap-2 text-[10px] text-purple-300 font-medium"><span>{step.icon}</span> {step.text}</li>
                                            ))}
                                        </ul>
                                    </div> */}

                                </div>
                            )}

                            {/* STYLING SECTION — Universal Design Engine */}
                            {activeSection === 'styling' && (() => {
                                const stylingTabs = [
                                    { id: 'typography', label: 'Type', icon: '𝐓' },
                                    { id: 'colors', label: 'Colors', icon: '◑' },
                                    { id: 'boxmodel', label: 'Box', icon: '▣' },
                                ];
                                const elements = [
                                    { id: 'title', label: 'Title' },
                                    { id: 'author', label: 'Author' },
                                    { id: 'price', label: 'Price' },
                                    { id: 'button', label: 'Button' },
                                    { id: 'look_inside', label: 'Look Inside' },
                                ];
                                const activeTypoKey = `typo_${activeStylingElement}`;
                                const activeColorKey = `color_${activeStylingElement}`;

                                const updateTypo = (field, value) => setSettings(prev => ({
                                    ...prev,
                                    [activeTypoKey]: { ...prev[activeTypoKey], [field]: value }
                                }));
                                const updateColor = (element, field, value) => setSettings(prev => ({
                                    ...prev,
                                    [`color_${element}`]: { ...prev[`color_${element}`], [field]: value }
                                }));

                                /* ── shared style tokens ── */
                                const S = {
                                    card: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.15)', borderRadius: 12, padding: 10, marginBottom: 10 },
                                    sectionHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 },
                                    sectionHeaderAccent: { width: 2, height: 12, background: 'linear-gradient(180deg, #c084fc, #7c3aed)', borderRadius: 2, flexShrink: 0 },
                                    sectionHeaderLabel: { fontSize: 11, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.08em', textTransform: 'uppercase' },
                                    label: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a78bfa', display: 'block', marginBottom: 8 },
                                    inputLabel: { fontSize: 11, color: '#7c6fa0', marginBottom: 4 },
                                    inputNumber: {
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 8, color: '#f1f5f9', fontSize: 13, padding: '8px 12px', width: '100%', outline: 'none', boxShadow: 'none', fontFamily: 'DM Sans, sans-serif', WebkitAppearance: 'none', MozAppearance: 'textfield', appearance: 'none',
                                    },
                                    valuePill: { background: 'rgba(192,132,252,0.15)', border: '1px solid rgba(192,132,252,0.3)', borderRadius: 9999, padding: '2px 8px', fontSize: 11, color: '#c084fc', fontWeight: 700 },
                                    chipRow: { display: 'flex', gap: 6, flexWrap: 'wrap' },
                                    chip: (active) => ({
                                        flex: '1 1 auto',
                                        padding: '7px 10px',
                                        borderRadius: 8,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        border: active ? '1.5px solid rgba(192,132,252,0.6)' : '1.5px solid rgba(168,85,247,0.15)',
                                        background: active ? 'rgba(192,132,252,0.18)' : 'rgba(255,255,255,0.03)',
                                        color: active ? '#e2d4ff' : '#7c6fa0',
                                        transition: 'all 0.15s',
                                        textAlign: 'center',
                                        whiteSpace: 'nowrap',
                                    }),
                                    slider: { width: '100%', accentColor: '#c084fc', cursor: 'pointer' },
                                    select: {
                                        width: '100%', background: '#1e1338', color: '#cbd5e1',
                                        border: '1.5px solid rgba(168,85,247,0.25)', borderRadius: 8,
                                        padding: '8px 12px', fontSize: 12, outline: 'none', cursor: 'pointer',
                                        appearance: 'none', fontFamily: 'DM Sans, sans-serif',
                                    },
                                    row: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' },
                                    rowLabel: { fontSize: 11, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.05em' },
                                    colorSwatch: (bg) => ({
                                        width: 28, height: 28, borderRadius: 6, border: '1.5px solid rgba(168,85,247,0.3)',
                                        background: bg, cursor: 'pointer', flexShrink: 0,
                                    }),
                                    hexLabel: { fontSize: 10, fontFamily: 'monospace', color: '#7c6fa0' },
                                    divider: { border: 'none', borderTop: '1px solid rgba(168,85,247,0.12)', margin: '10px 0' },
                                    sectionTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a78bfa', marginBottom: 8 },
                                };

                                /* ── ColorRow helper ── */
                                const ColorRow = ({ label, value, displayValue, onChange }) => {
                                    const shown = displayValue ?? value;
                                    const isTransparent = shown === 'transparent';
                                    return (
                                        <div style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 0', borderBottom: '1px solid rgba(168,85,247,0.07)',
                                        }}>
                                            <span style={{ fontSize: 11, fontWeight: 600, color: '#8b7fb8', letterSpacing: '0.03em' }}>
                                                {label}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div style={{ position: 'relative', width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                                                    border: '1.5px solid rgba(168,85,247,0.35)',
                                                    background: isTransparent
                                                        ? 'repeating-conic-gradient(#3d2d60 0% 25%, #1a1030 0% 50%) 0 0 / 10px 10px'
                                                        : value,
                                                    overflow: 'hidden',
                                                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                                                }}>
                                                    <input type="color" value={value}
                                                        onChange={e => onChange(e.target.value)}
                                                        style={{ position: 'absolute', inset: '-4px', opacity: 0, cursor: 'pointer', width: '140%', height: '140%' }}
                                                    />
                                                </div>
                                                <span style={{
                                                    fontSize: 10, fontFamily: 'monospace',
                                                    color: isTransparent ? '#5a4e7a' : '#7c6fa0',
                                                    fontStyle: isTransparent ? 'italic' : 'normal',
                                                    minWidth: 72,
                                                }}>
                                                    {shown}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                };

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: 'DM Sans, sans-serif' }}>

                                        {/* ── CONTENT ALIGNMENT ── */}
                                        <div style={S.card}>
                                            <div style={S.sectionHeader}>
                                                <div style={S.sectionHeaderAccent} />
                                                <span style={S.sectionHeaderLabel}>CONTENT ALIGNMENT</span>
                                            </div>
                                            <p style={{ fontSize: 11, color: '#5a4e7a', marginBottom: 8, lineHeight: 1.5 }}>
                                                Align all card elements in one click.
                                            </p>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {[
                                                    { value: 'left', icon: '←', label: 'Left' },
                                                    { value: 'center', icon: '⊙', label: 'Center' },
                                                    { value: 'right', icon: '→', label: 'Right' },
                                                ].map(({ value, icon, label }) => {
                                                    const active = (settings.card_alignment || 'center') === value;
                                                    return (
                                                        <button key={value}
                                                            onClick={() => setSettings(prev => ({ ...prev, card_alignment: value }))}
                                                            style={{
                                                                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                gap: 5, padding: '8px 6px', borderRadius: 9, cursor: 'pointer',
                                                                border: active ? '1.5px solid rgba(192,132,252,0.6)' : '1.5px solid rgba(168,85,247,0.15)',
                                                                background: active ? 'rgba(192,132,252,0.18)' : 'rgba(255,255,255,0.03)',
                                                                color: active ? '#e2d4ff' : '#7c6fa0',
                                                                fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                                                            }}
                                                        >
                                                            <span style={{ fontSize: 13 }}>{icon}</span>
                                                            <span>{label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* ── TYPE / COLORS / BOX TAB BAR ── */}
                                        <div style={{ display: 'flex', gap: 6, background: '#0f0820', borderRadius: 12, padding: 5, border: '1px solid rgba(168,85,247,0.15)' }}>
                                            {stylingTabs.map(t => {
                                                const active = activeStylingTab === t.id;
                                                return (
                                                    <button key={t.id}
                                                        onClick={() => setActiveStylingTab(t.id)}
                                                        style={{
                                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            gap: 5, padding: '8px 4px', borderRadius: 8, cursor: 'pointer',
                                                            border: 'none',
                                                            background: active ? 'rgba(192,132,252,0.22)' : 'transparent',
                                                            color: active ? '#e2d4ff' : '#5a4e7a',
                                                            fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
                                                        }}
                                                    >
                                                        <span style={{ fontSize: 14 }}>{t.icon}</span>
                                                        <span>{t.label}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* ══ TYPOGRAPHY TAB ══ */}
                                        {activeStylingTab === 'typography' && (() => {
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                                                    {/* Element Selector */}
                                                    <div style={S.chipRow}>
                                                        {elements.map(el => (
                                                            <button key={el.id}
                                                                onClick={() => setActiveStylingElement(el.id)}
                                                                style={S.chip(activeStylingElement === el.id)}
                                                            >
                                                                {el.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Controls card */}
                                                    <div style={S.card}>

                                                        {/* Google Font */}
                                                        <div style={{ marginBottom: 16 }}>
                                                            <span style={S.label}>Google Font</span>
                                                            <FontPickerDropdown
                                                                currentFont={settings[activeTypoKey]?.font || ''}
                                                                onChange={val => updateTypo('font', val)}
                                                            />
                                                        </div>

                                                        <hr style={S.divider} />

                                                        {/* Size */}
                                                        <div style={{ marginBottom: 16 }}>
                                                            <span style={S.label}>
                                                                Size — {settings[activeTypoKey]?.size ?? (activeStylingElement === 'button' ? 13 : 16)}px
                                                            </span>
                                                            <input type="range" min="10" max="48" step="1"
                                                                value={settings[activeTypoKey]?.size ?? (activeStylingElement === 'button' ? 13 : 16)}
                                                                onChange={e => updateTypo('size', parseInt(e.target.value))}
                                                                style={S.slider}
                                                            />
                                                        </div>

                                                        <hr style={S.divider} />

                                                        {/* Weight — button group */}
                                                        <div style={{ marginBottom: 16 }}>
                                                            <span style={S.label}>Weight</span>
                                                            <div style={{ display: 'flex', gap: 4 }}>
                                                                {['300','400','500','600','700','800','900'].map(w => {
                                                                    const active = (settings[activeTypoKey]?.weight || '400') === w;
                                                                    return (
                                                                        <button key={w}
                                                                            onClick={() => updateTypo('weight', w)}
                                                                            style={{
                                                                                flex: 1, padding: '6px 2px', borderRadius: 7, cursor: 'pointer',
                                                                                border: active ? '1.5px solid rgba(192,132,252,0.6)' : '1.5px solid rgba(168,85,247,0.12)',
                                                                                background: active ? 'rgba(192,132,252,0.18)' : 'rgba(255,255,255,0.02)',
                                                                                color: active ? '#e2d4ff' : '#5a4e7a',
                                                                                fontSize: 10, fontWeight: parseInt(w), transition: 'all 0.12s',
                                                                            }}
                                                                        >
                                                                            {w}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        <hr style={S.divider} />

                                                        {/* Line Height / Text Transform */}
                                                        {activeStylingElement === 'button' ? (
                                                            <div>
                                                                <span style={S.label}>Text Transform</span>
                                                                <select value={settings.typo_button?.textTransform || 'none'}
                                                                    onChange={e => updateTypo('textTransform', e.target.value)}
                                                                    style={S.select}>
                                                                    {[['none','None'],['uppercase','UPPERCASE'],['lowercase','lowercase'],['capitalize','Capitalize']].map(([v,l]) => (
                                                                        <option key={v} value={v}>{l}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div style={{ marginBottom: 16 }}>
                                                                    <span style={S.label}>
                                                                        Line Height — {settings[activeTypoKey]?.lineHeight || 1.4}
                                                                    </span>
                                                                    <input type="range" min="1.0" max="2.5" step="0.05"
                                                                        value={settings[activeTypoKey]?.lineHeight || 1.4}
                                                                        onChange={e => updateTypo('lineHeight', parseFloat(e.target.value))}
                                                                        style={S.slider}
                                                                    />
                                                                </div>
                                                                <hr style={S.divider} />
                                                                <div>
                                                                    <span style={S.label}>Text Transform</span>
                                                                    <select value={settings[activeTypoKey]?.textTransform || 'none'}
                                                                        onChange={e => updateTypo('textTransform', e.target.value)}
                                                                        style={S.select}>
                                                                        {[['none','None'],['uppercase','UPPERCASE'],['lowercase','lowercase'],['capitalize','Capitalize']].map(([v,l]) => (
                                                                            <option key={v} value={v}>{l}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* ══ COLORS TAB ══ */}
                                        {activeStylingTab === 'colors' && (() => {
                                            const colorElements = [...elements, { id: 'container', label: 'Card' }];
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                                                    <div style={S.chipRow}>
                                                        {colorElements.map(el => (
                                                            <button key={el.id}
                                                                onClick={() => setActiveStylingElement(el.id)}
                                                                style={S.chip(activeStylingElement === el.id)}
                                                            >
                                                                {el.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div style={{ background: '#150d28', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 14, padding: '18px', display: 'flex', flexDirection: 'column', gap: 0 }}>

                                                        {/* Text colors — not for container */}
                                                        {activeStylingElement !== 'container' && (
                                                            <>
                                                                <ColorRow
                                                                    label={activeStylingElement === 'price' ? 'Current Price' : 'Text Color'}
                                                                    value={settings[activeColorKey]?.text || (activeStylingElement === 'button' ? '#ffffff' : activeStylingElement === 'price' ? '#7c3aed' : '#111827')}
                                                                    onChange={val => updateColor(activeStylingElement, 'text', val)}
                                                                />

                                                                {activeStylingElement === 'price' && (
                                                                    <ColorRow
                                                                        label="Old Price"
                                                                        value={settings.color_price?.oldText || '#9ca3af'}
                                                                        onChange={val => updateColor('price', 'oldText', val)}
                                                                    />
                                                                )}

                                                                <ColorRow
                                                                    label="Hover Text"
                                                                    value={settings[activeColorKey]?.hoverText || (activeStylingElement === 'button' ? '#ffffff' : '#7c3aed')}
                                                                    onChange={val => updateColor(activeStylingElement, 'hoverText', val)}
                                                                />

                                                                <div style={{ height: 1, background: 'rgba(168,85,247,0.12)', margin: '4px 0 4px' }} />
                                                            </>
                                                        )}

                                                        {/* Background */}
                                                        <ColorRow
                                                            label="Background"
                                                            value={
                                                                activeStylingElement === 'container'
                                                                    ? (settings.color_container?.bg === 'transparent' ? '#ffffff' : settings.color_container?.bg)
                                                                    : (settings[activeColorKey]?.bg === 'transparent' ? (activeStylingElement === 'button' ? '#2563eb' : '#ffffff') : (settings[activeColorKey]?.bg || (activeStylingElement === 'button' ? '#2563eb' : '#ffffff')))
                                                            }
                                                            displayValue={
                                                                activeStylingElement === 'container' ? settings.color_container?.bg : (settings[activeColorKey]?.bg || 'transparent')
                                                            }
                                                            onChange={val => updateColor(activeStylingElement, 'bg', val)}
                                                        />

                                                        {/* Hover Background */}
                                                        <ColorRow
                                                            label="Hover BG"
                                                            value={
                                                                activeStylingElement === 'container'
                                                                    ? (settings.color_container?.hoverBg === 'transparent' ? '#f9f5ff' : settings.color_container?.hoverBg)
                                                                    : (settings[activeColorKey]?.hoverBg === 'transparent' ? (activeStylingElement === 'button' ? '#1d4ed8' : '#7c3aed') : (settings[activeColorKey]?.hoverBg || (activeStylingElement === 'button' ? '#1d4ed8' : '#7c3aed')))
                                                            }
                                                            displayValue={
                                                                activeStylingElement === 'container' ? settings.color_container?.hoverBg : (settings[activeColorKey]?.hoverBg || '#7c3aed')
                                                            }
                                                            onChange={val => updateColor(activeStylingElement, 'hoverBg', val)}
                                                        />

                                                        {/* Preview swatches */}
                                                        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                                                            {[
                                                                {
                                                                    label: 'Normal',
                                                                    bg: activeStylingElement === 'container' ? settings.color_container?.bg : (settings[activeColorKey]?.bg || 'transparent'),
                                                                    color: activeStylingElement === 'container' ? '#9ca3af' : (settings[activeColorKey]?.text || '#ffffff'),
                                                                },
                                                                {
                                                                    label: 'Hover',
                                                                    bg: activeStylingElement === 'container' ? settings.color_container?.hoverBg : (settings[activeColorKey]?.hoverBg || '#7c3aed'),
                                                                    color: activeStylingElement === 'container' ? '#9ca3af' : (settings[activeColorKey]?.hoverText || '#ffffff'),
                                                                },
                                                            ].map(({ label, bg, color }) => (
                                                                <div key={label} style={{
                                                                    flex: 1, height: 38, borderRadius: 9,
                                                                    border: '1px solid rgba(168,85,247,0.18)',
                                                                    background: bg === 'transparent' ? 'repeating-conic-gradient(#2a1d4a 0% 25%, #1a1030 0% 50%) 0 0 / 12px 12px' : bg,
                                                                    color,
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
                                                                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                                                                }}>
                                                                    {label}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })()}

                                        {/* ══ BOX MODEL TAB ══ */}
                                        {activeStylingTab === 'boxmodel' && (() => {
                                            const bp = typeof settings.box_padding === 'number'
                                                ? { top: settings.box_padding, right: settings.box_padding, bottom: settings.box_padding, left: settings.box_padding, sameForAll: true }
                                                : (settings.box_padding || { top: 16, right: 16, bottom: 16, left: 16, sameForAll: true });
                                            const br = typeof settings.border_radius === 'number'
                                                ? { topLeft: settings.border_radius, topRight: settings.border_radius, bottomRight: settings.border_radius, bottomLeft: settings.border_radius, sameForAll: true }
                                                : (settings.border_radius || { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12, sameForAll: true });
                                            const bw = typeof settings.box_border_width === 'number'
                                                ? { top: settings.box_border_width, right: settings.box_border_width, bottom: settings.box_border_width, left: settings.box_border_width, sameForAll: true }
                                                : (settings.box_border_width || { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true });
                                            const padSame = bp.sameForAll !== false;
                                            const radSame = br.sameForAll !== false;
                                            const borderSame = bw.sameForAll !== false;
                                            const hasAnyBorder = (bw.top > 0 || bw.right > 0 || bw.bottom > 0 || bw.left > 0);
                                            return (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                                                    {/* Card Padding — 4 values */}
                                                    <div style={S.card}>
                                                        <div style={S.sectionHeader}>
                                                            <div style={S.sectionHeaderAccent} />
                                                            <span style={S.sectionHeaderLabel}>CARD PADDING {padSame ? `— ${bp.top}px` : ''}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, color: '#94a3b8' }}>
                                                                <input type="checkbox" checked={padSame} onChange={e => setSettings(prev => {
                                                                    const p = typeof prev.box_padding === 'number' ? { top: prev.box_padding, right: prev.box_padding, bottom: prev.box_padding, left: prev.box_padding, sameForAll: true } : (prev.box_padding || { top: 16, right: 16, bottom: 16, left: 16, sameForAll: true });
                                                                    return { ...prev, box_padding: e.target.checked ? { ...p, sameForAll: true } : { ...p, sameForAll: false } };
                                                                })} style={{ accentColor: '#c084fc', width: 12, height: 12 }} />
                                                                Same for all
                                                            </label>
                                                        </div>
                                                        {padSame ? (
                                                            <input type="range" min="0" max="48" step="2" value={bp.top ?? 16} onChange={e => { const v = parseInt(e.target.value, 10) || 0; setSettings(prev => ({ ...prev, box_padding: { top: v, right: v, bottom: v, left: v, sameForAll: true } })); }} style={S.slider} />
                                                        ) : (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                                {['top', 'right', 'bottom', 'left'].map(side => (
                                                                    <div key={side}>
                                                                        <span style={S.inputLabel}>{side}</span>
                                                                        <input type="number" min="0" max="48" step="2" value={Number(bp[side]) >= 0 ? Number(bp[side]) : 16}
                                                                            onChange={e => setSettings(prev => { const p = typeof prev.box_padding === 'number' ? { top: prev.box_padding, right: prev.box_padding, bottom: prev.box_padding, left: prev.box_padding } : { ...(prev.box_padding || {}) }; const num = parseInt(e.target.value, 10); return { ...prev, box_padding: { ...p, sameForAll: false, [side]: isNaN(num) ? 0 : Math.min(48, Math.max(0, num)) } }; })}
                                                                            style={{ ...S.inputNumber, marginTop: 2 }} onFocus={e => { e.target.style.borderColor = '#c084fc'; e.target.style.outline = 'none'; e.target.style.boxShadow = '0 0 0 2px rgba(192,132,252,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.25)'; e.target.style.boxShadow = 'none'; }} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <hr style={S.divider} />

                                                    {/* Card Gap */}
                                                    <div style={S.card}>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                                            <div style={S.sectionHeader}>
                                                                <div style={S.sectionHeaderAccent} />
                                                                <span style={S.sectionHeaderLabel}>CARD GAP</span>
                                                            </div>
                                                            <span style={S.valuePill}>{settings.grid_gap ?? 24}px</span>
                                                        </div>
                                                        <input type="range" min="0" max="64" step="2"
                                                            value={settings.grid_gap ?? 24}
                                                            onChange={e => setSettings(prev => ({ ...prev, grid_gap: parseInt(e.target.value) }))}
                                                            style={S.slider}
                                                        />
                                                    </div>

                                                    <hr style={S.divider} />

                                                    {/* Border Radius — 4 corners */}
                                                    <div style={S.card}>
                                                        <div style={S.sectionHeader}>
                                                            <div style={S.sectionHeaderAccent} />
                                                            <span style={S.sectionHeaderLabel}>BORDER RADIUS {radSame ? `— ${br.topLeft}px` : ''}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, color: '#94a3b8' }}>
                                                                <input type="checkbox" checked={radSame} onChange={e => setSettings(prev => {
                                                                    const r = typeof prev.border_radius === 'number' ? { topLeft: prev.border_radius, topRight: prev.border_radius, bottomRight: prev.border_radius, bottomLeft: prev.border_radius, sameForAll: true } : (prev.border_radius || { topLeft: 12, topRight: 12, bottomRight: 12, bottomLeft: 12, sameForAll: true });
                                                                    return { ...prev, border_radius: e.target.checked ? { ...r, sameForAll: true } : { ...r, sameForAll: false } };
                                                                })} style={{ accentColor: '#c084fc', width: 12, height: 12 }} />
                                                                Same for all
                                                            </label>
                                                        </div>
                                                        {radSame ? (
                                                            <input type="range" min="0" max="32" step="1" value={br.topLeft ?? 12} onChange={e => { const v = parseInt(e.target.value, 10) || 0; setSettings(prev => ({ ...prev, border_radius: { topLeft: v, topRight: v, bottomRight: v, bottomLeft: v, sameForAll: true } })); }} style={S.slider} />
                                                        ) : (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                                {[{ key: 'topLeft', label: 'Top-Left' }, { key: 'topRight', label: 'Top-Right' }, { key: 'bottomRight', label: 'Bottom-Right' }, { key: 'bottomLeft', label: 'Bottom-Left' }].map(({ key, label }) => (
                                                                    <div key={key}>
                                                                        <span style={S.inputLabel}>{label}</span>
                                                                        <input type="number" min="0" max="32" step="1" value={Number(br[key]) >= 0 ? Number(br[key]) : 12}
                                                                            onChange={e => setSettings(prev => { const r = typeof prev.border_radius === 'number' ? { topLeft: prev.border_radius, topRight: prev.border_radius, bottomRight: prev.border_radius, bottomLeft: prev.border_radius } : { ...(prev.border_radius || {}) }; const num = parseInt(e.target.value, 10); return { ...prev, border_radius: { ...r, sameForAll: false, [key]: isNaN(num) ? 0 : Math.min(32, Math.max(0, num)) } }; })}
                                                                            style={{ ...S.inputNumber, marginTop: 2 }} onFocus={e => { e.target.style.borderColor = '#c084fc'; e.target.style.outline = 'none'; e.target.style.boxShadow = '0 0 0 2px rgba(192,132,252,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.25)'; e.target.style.boxShadow = 'none'; }} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <hr style={S.divider} />

                                                    {/* Border Width — 4 sides */}
                                                    <div style={S.card}>
                                                        <div style={S.sectionHeader}>
                                                            <div style={S.sectionHeaderAccent} />
                                                            <span style={S.sectionHeaderLabel}>BORDER WIDTH {borderSame ? `— ${bw.top}px` : ''}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 10, color: '#94a3b8' }}>
                                                                <input type="checkbox" checked={borderSame} onChange={e => setSettings(prev => {
                                                                    const w = typeof prev.box_border_width === 'number' ? { top: prev.box_border_width, right: prev.box_border_width, bottom: prev.box_border_width, left: prev.box_border_width, sameForAll: true } : (prev.box_border_width || { top: 0, right: 0, bottom: 0, left: 0, sameForAll: true });
                                                                    return { ...prev, box_border_width: e.target.checked ? { ...w, sameForAll: true } : { ...w, sameForAll: false } };
                                                                })} style={{ accentColor: '#c084fc', width: 12, height: 12 }} />
                                                                Same for all
                                                            </label>
                                                        </div>
                                                        {borderSame ? (
                                                            <input type="range" min="0" max="6" step="1" value={bw.top ?? 0} onChange={e => { const v = parseInt(e.target.value, 10) || 0; setSettings(prev => ({ ...prev, box_border_width: { top: v, right: v, bottom: v, left: v, sameForAll: true } })); }} style={S.slider} />
                                                        ) : (
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                                {['top', 'right', 'bottom', 'left'].map(side => (
                                                                    <div key={side}>
                                                                        <span style={S.inputLabel}>{side}</span>
                                                                        <input type="number" min="0" max="6" step="1" value={Number(bw[side]) >= 0 ? Number(bw[side]) : 0}
                                                                            onChange={e => setSettings(prev => { const w = typeof prev.box_border_width === 'number' ? { top: prev.box_border_width, right: prev.box_border_width, bottom: prev.box_border_width, left: prev.box_border_width } : { ...(prev.box_border_width || {}) }; const num = parseInt(e.target.value, 10); return { ...prev, box_border_width: { ...w, sameForAll: false, [side]: isNaN(num) ? 0 : Math.min(6, Math.max(0, num)) } }; })}
                                                                            style={{ ...S.inputNumber, marginTop: 2 }} onFocus={e => { e.target.style.borderColor = '#c084fc'; e.target.style.outline = 'none'; e.target.style.boxShadow = '0 0 0 2px rgba(192,132,252,0.2)'; }} onBlur={e => { e.target.style.borderColor = 'rgba(168,85,247,0.25)'; e.target.style.boxShadow = 'none'; }} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        {hasAnyBorder && (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                                                                <span style={S.rowLabel}>Border Color</span>
                                                                <div style={{ position: 'relative', marginLeft: 'auto' }}>
                                                                    <div style={S.colorSwatch(settings.box_border_color || '#e5e7eb')} />
                                                                    <input type="color"
                                                                        value={(settings.box_border_color && /^#[0-9A-Fa-f]{6}$/.test(settings.box_border_color)) ? settings.box_border_color : '#e5e7eb'}
                                                                        onChange={e => setSettings(prev => ({ ...prev, box_border_color: e.target.value }))}
                                                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                                    />
                                                                </div>
                                                                <span style={S.hexLabel}>{settings.box_border_color || '#e5e7eb'}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <hr style={S.divider} />

                                                    {/* Shadow */}
                                                    <div>
                                                        <span style={S.label}>Shadow</span>
                                                        <select value={settings.box_shadow || 'none'}
                                                            onChange={e => setSettings(prev => ({ ...prev, box_shadow: e.target.value }))}
                                                            style={S.select}>
                                                            {[['none', 'None'], ['sm', 'Small'], ['md', 'Medium'], ['lg', 'Large'], ['xl', 'Extra Large']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                                                        </select>
                                                    </div>

                                                    <hr style={S.divider} />

                                                    {/* Image Aspect Ratio */}
                                                    <div>
                                                        <span style={S.label}>Image Aspect Ratio</span>
                                                        <div style={S.chipRow}>
                                                            {[{ value: '2/3', label: '2:3' }, { value: '3/4', label: '3:4' }, { value: '1/1', label: '1:1' }, { value: '4/3', label: '4:3' }, { value: 'auto', label: 'Auto' }].map(({ value, label }) => (
                                                                <button key={value}
                                                                    onClick={() => setSettings(prev => ({ ...prev, image_aspect_ratio: value }))}
                                                                    style={S.chip((settings.image_aspect_ratio || '2/3') === value)}
                                                                >
                                                                    {label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* ══ Discount Badge ══ */}
                                                    <hr style={{ ...S.divider, borderTopWidth: 2 }} />
                                                    <div>
                                                        <span style={S.sectionTitle}>Discount Badge</span>
                                                        <p style={{ fontSize: 11, color: '#5a4e7a', marginBottom: 12, lineHeight: 1.5 }}>
                                                            Shows auto % OFF from prices. No dependency on Ribbon badge.
                                                        </p>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                                                            <input type="checkbox" id="sa-show-badge" checked={!!settings.show_badge}
                                                                onChange={e => setSettings(prev => ({ ...prev, show_badge: e.target.checked }))}
                                                                style={{ accentColor: '#c084fc', width: 14, height: 14 }}
                                                            />
                                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Show discount badge</span>
                                                        </label>

                                                        {settings.show_badge && (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                                                <div>
                                                                    <span style={S.label}>Design</span>
                                                                    <select value={settings.badge_design || 'scalloped'}
                                                                        onChange={e => setSettings(prev => ({ ...prev, badge_design: e.target.value }))}
                                                                        style={S.select}>
                                                                        <option value="circle">Circle</option>
                                                                        <option value="scalloped">Scalloped (stamp)</option>
                                                                        <option value="pill">Pill</option>
                                                                        <option value="ribbon">Ribbon corner</option>
                                                                        <option value="square">Square</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <span style={S.label}>Position</span>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                                        {['top-left','top-right','bottom-left','bottom-right'].map(pos => (
                                                                            <button key={pos}
                                                                                onClick={() => setSettings(prev => ({ ...prev, badge_position: pos }))}
                                                                                style={S.chip((settings.badge_position || 'top-right') === pos)}
                                                                            >
                                                                                {pos.replace('-', ' ')}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                                                    {[
                                                                        { label: 'Bg color', key: 'badge_bg_color', default: '#dc2626' },
                                                                        { label: 'Text color', key: 'badge_text_color', default: '#ffffff' },
                                                                    ].map(({ label, key, default: def }) => (
                                                                        <div key={key}>
                                                                            <span style={{ ...S.label, marginBottom: 6 }}>{label}</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <div style={{ position: 'relative' }}>
                                                                                    <div style={S.colorSwatch(settings[key] || def)} />
                                                                                    <input type="color"
                                                                                        value={settings[key] || def}
                                                                                        onChange={e => setSettings(prev => ({ ...prev, [key]: e.target.value }))}
                                                                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                                                    />
                                                                                </div>
                                                                                <span style={S.hexLabel}>{settings[key] || def}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* ══ Ribbon Badge ══ */}
                                                    <hr style={{ ...S.divider, borderTopWidth: 2 }} />
                                                    <div>
                                                        <span style={S.sectionTitle}>Ribbon Badge</span>
                                                        <p style={{ fontSize: 11, color: '#5a4e7a', marginBottom: 12, lineHeight: 1.5 }}>
                                                            New label or custom ribbon (e.g. Bestseller). Independent from Discount badge.
                                                        </p>
                                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 12 }}>
                                                            <input type="checkbox" id="sa-show-ribbon-badge" checked={!!settings.show_ribbon_badge}
                                                                onChange={e => setSettings(prev => ({ ...prev, show_ribbon_badge: e.target.checked }))}
                                                                style={{ accentColor: '#c084fc', width: 14, height: 14 }}
                                                            />
                                                            <span style={{ fontSize: 11, color: '#94a3b8' }}>Show ribbon badge</span>
                                                        </label>
                                                        {settings.show_ribbon_badge && (
                                                            <>
                                                                <div style={{ marginBottom: 16 }}>
                                                                    <span style={S.label}>Position</span>
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                                                        {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(pos => (
                                                                            <button key={pos} type="button"
                                                                                onClick={() => setSettings(prev => ({ ...prev, ribbon_position: pos }))}
                                                                                style={S.chip((settings.ribbon_position || 'top-left') === pos)}
                                                                            >
                                                                                {pos.replace('-', ' ')}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div style={{ marginBottom: 16 }}>
                                                                    <span style={S.label}>Font size (px)</span>
                                                                    <input type="number" min={8} max={24} value={settings.typo_ribbon?.size ?? 12}
                                                                        onChange={e => setSettings(prev => ({ ...prev, typo_ribbon: { ...(prev.typo_ribbon || {}), size: parseInt(e.target.value) || 12 } }))}
                                                                        style={{ width: '100%', ...S.select }}
                                                                    />
                                                                </div>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                                                                    {[
                                                                        { label: 'Text color', key: 'text', default: '#ffffff' },
                                                                        { label: 'Hover text', key: 'hoverText', default: '#ffffff' },
                                                                        { label: 'Bg color', key: 'bg', default: '#dc2626' },
                                                                        { label: 'Bg hover', key: 'hoverBg', default: '#b91c1c' },
                                                                    ].map(({ label, key, default: def }) => (
                                                                        <div key={key}>
                                                                            <span style={{ ...S.label, marginBottom: 6 }}>{label}</span>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                                <div style={{ position: 'relative' }}>
                                                                                    <div style={S.colorSwatch((key === 'text' || key === 'hoverText') ? (settings.color_ribbon?.[key] || def) : (settings.color_ribbon?.[key] || def))} />
                                                                                    <input type="color"
                                                                                        value={settings.color_ribbon?.[key] || def}
                                                                                        onChange={e => setSettings(prev => ({ ...prev, color_ribbon: { ...(prev.color_ribbon || {}), [key]: e.target.value } }))}
                                                                                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                                                    />
                                                                                </div>
                                                                                <span style={S.hexLabel}>{settings.color_ribbon?.[key] || def}</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div style={{ marginBottom: 16 }}>
                                                                    <span style={S.label}>Border radius (px)</span>
                                                                    <input type="number" min={0} max={99} value={typeof settings.ribbon_radius === 'object' ? (settings.ribbon_radius?.topLeft ?? 8) : (settings.ribbon_radius ?? 8)}
                                                                        onChange={e => setSettings(prev => ({ ...prev, ribbon_radius: parseInt(e.target.value) || 0 }))}
                                                                        style={{ width: '100%', ...S.select }}
                                                                    />
                                                                </div>
                                                                <div style={{ marginBottom: 16 }}>
                                                                    <span style={S.label}>Border (px)</span>
                                                                    <input type="number" min={0} max={8} value={settings.ribbon_border?.top ?? settings.ribbon_border?.width ?? 0}
                                                                        onChange={e => setSettings(prev => ({ ...prev, ribbon_border: { ...(prev.ribbon_border || {}), top: parseInt(e.target.value) || 0, right: parseInt(e.target.value) || 0, bottom: parseInt(e.target.value) || 0, left: parseInt(e.target.value) || 0, sameForAll: true, unit: 'px', color: (prev.ribbon_border || {}).color || 'transparent' } }))}
                                                                        style={{ width: '100%', ...S.select }}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <span style={S.label}>Border color</span>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <div style={{ position: 'relative' }}>
                                                                            <div style={S.colorSwatch(settings.ribbon_border?.color || 'transparent')} />
                                                                            <input type="color"
                                                                                value={settings.ribbon_border?.color || 'transparent'}
                                                                                onChange={e => setSettings(prev => ({ ...prev, ribbon_border: { ...(prev.ribbon_border || {}), color: e.target.value } }))}
                                                                                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }}
                                                                            />
                                                                        </div>
                                                                        <span style={S.hexLabel}>{settings.ribbon_border?.color || 'transparent'}</span>
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                </div>
                                            );
                                        })()}
                                    </div>
                                );
                            })()}




                            {/* PREMIUM SECTION */}
                        </div>

                    </div>
                </div>

                {/* Right Preview Area (SIBLING TO SIDEBAR) */}
                <div className="flex-1 bg-gray-50 relative custom-scrollbar overflow-y-auto flex flex-col">

                    {/* Top Preview Bar */}
                    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10 shadow-sm" >
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                            </div>
                            <span className="text-sm font-medium text-gray-500 ml-2">Live Preview: {previewDevice.charAt(0).toUpperCase() + previewDevice.slice(1)} View</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="bg-gray-100 p-1 rounded-lg border border-gray-200 flex">
                                {[
                                    { id: 'desktop', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg> },
                                    { id: 'tablet', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
                                    { id: 'mobile', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2" /><line x1="12" y1="18" x2="12.01" y2="18" /></svg> },
                                ].map(dev => (
                                    <button
                                        key={dev.id}
                                        onClick={() => setPreviewDevice(dev.id)}
                                        className={`p-2 rounded-md transition-all ${previewDevice === dev.id ? 'bg-white shadow text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {dev.icon}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleForceRefresh}
                                disabled={isRefreshing}
                                className="group relative w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:border-purple-600 text-gray-400 hover:text-purple-600 bg-white shadow-sm transition-all"
                                title="Force refresh data from API (Updates price & images)"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform duration-700 ease-in-out ${isRefreshing ? 'animate-spin text-purple-600' : 'group-hover:rotate-180'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Preview Canvas */}
                    <div className="flex-1 p-8 overflow-y-auto" >
                        <div className={`mx-auto transition-all duration-300 relative ${previewDevice === 'mobile' ? 'max-w-sm' :
                            previewDevice === 'tablet' ? 'max-w-3xl' : 'max-w-6xl'
                            }`}>

                            {/* Pro Lock Overlay for Masonry */}


                            {/* Smart Fallback Global Notice */}
                            {previewProducts.some(p => p.enriched_by === 'google_books') && (
                                <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-2 text-xs text-blue-700 animate-in fade-in slide-in-from-top-2">
                                    <span className="bg-blue-100 text-blue-600 p-1 rounded">✨</span>
                                    <p><strong>Smart Fallback Active:</strong> Some Amazon items were missing data, so we fetched covers & descriptions from Google Books automatically.</p>
                                </div>
                            )}

                            {/* ── Universal Design Engine Style Block ── */}
                            <style dangerouslySetInnerHTML={{ __html: generateDynamicCSS() }} />

                            <PremiumLockedOverlay
                                isPro={isPro || (settings.layout === 'grid' && settings.design === 'design-1') || (settings.layout === 'list' && settings.design === 'design-1')}
                                featureName={
                                    settings.layout === 'masonry' ? "Masonry Layout" :
                                        settings.layout === 'slider' ? "Slider Layout" :
                                            settings.layout === 'grid' ? "Premium Grid Templates" :
                                                "Premium List Designs"
                                }
                                mode="overlay"
                            >
                                <div
                                    className={`${settings.layout === 'grid' ? 'grid' :
                                        settings.layout === 'masonry' ? '' :
                                            'flex flex-col gap-4'
                                        } transition-all duration-500 min-h-[500px]`}
                                    style={settings.layout === 'grid' ? {
                                        display: 'grid',
                                        gap: `${settings.grid_gap}px`,
                                        gridTemplateColumns: `repeat(${previewDevice === 'mobile' ? settings.col_mobile : previewDevice === 'tablet' ? settings.col_tablet : settings.col_desktop}, 1fr)`,
                                    } : settings.layout === 'masonry' ? {
                                        display: 'block',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        columnCount: previewDevice === 'mobile' ? 1 : previewDevice === 'tablet' ? Math.min(2, settings.masonry_cols) : settings.masonry_cols,
                                        columnGap: `${settings.grid_gap}px`,
                                        columnFill: 'balance',
                                        WebkitColumnCount: previewDevice === 'mobile' ? 1 : previewDevice === 'tablet' ? Math.min(2, settings.masonry_cols) : settings.masonry_cols,
                                    } : undefined}
                                >

                                    {(loading || isbnLoading || amazonLoading || isRefreshing || ingesterLoading) ? (
                                        <div className={`col-span-full ${settings.layout === 'grid' ? `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${settings.col_desktop} gap-6` : 'space-y-4'} animate-in fade-in duration-700`}>
                                            {[...Array(settings.layout === 'grid' ? 8 : 4)].map((_, i) => (
                                                <SkeletonCard key={i} layout={settings.layout} />
                                            ))}
                                        </div>
                                    ) : previewProducts.length > 0 ? (
                                        previewProducts.map((product, index) => {
                                            const saLabels = window.rmssAdminSettings?.labels || {};
                                            const saAddToCart = saLabels.add_to_cart || 'Add to Cart';
                                            const saButtonText = product.standard_button_text || saAddToCart;
                                            const saLookInside = saLabels.look_inside || 'Look Inside';
                                            const saCustomButton = saLabels.custom_button || 'View Details';
                                            const isGrid = settings.layout === 'grid';
                                            const isMasonry = settings.layout === 'masonry';
                                            const isFocused = (settings.data_source === 'google_books' || settings.data_source === 'smart_ingester') && index === ingesterSelectedIndex;
                                            const focusClass = isFocused ? 'ss-focused-item' : '';

                                            // ── Wrap main cards with focusClass ──
                                            const isFlip3D = settings.design === 'design-flip3d' && isGrid;
                                            const is3DShelf = settings.design === 'design-3d-shelf' && isGrid;
                                            const isSlideOut = settings.design === 'design-slide-out' && isGrid;
                                            const isNegativeSpace = settings.design === 'design-negative-space' && isGrid;
                                            const isBrutalist = settings.design === 'design-brutalist' && isGrid;

                                            // ── 3D FLIP BOOK EARLY RETURN ──────────────────────
                                            if (isFlip3D) {
                                                const isFlipped = flippedCardId === product.id;
                                                const flip3dStyles = {
                                                    '--flip-perspective': `${settings.flip3d_perspective}px`,
                                                    '--flip-depth': `${settings.flip3d_depth}px`,
                                                    '--flip-page-color': settings.flip3d_page_color,
                                                };
                                                return (
                                                    <div
                                                        key={product.id}
                                                        className={`flip3d-wrapper relative aspect-[2/3] ${focusClass}`}
                                                        style={flip3dStyles}
                                                    >


                                                        {/* 3D Scene */}
                                                        <div className="flip3d-scene">
                                                            <div
                                                                className={`flip3d-book ${isFlipped ? 'flipped' : ''}`}
                                                                onClick={() => setFlippedCardId(isFlipped ? null : product.id)}
                                                                title="Click to flip"
                                                            >
                                                                {/* Front — Book Cover */}
                                                                <div className={`flip3d-front finish-${settings.flip3d_finish}`}>
                                                                    {settings.show_image && product.standard_image ? (
                                                                        <img
                                                                            src={product.standard_image}
                                                                            alt={product.standard_title}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center bg-gray-200 text-4xl">📚</div>
                                                                    )}
                                                                    {/* Tap hint badge */}
                                                                    {!isFlipped && (
                                                                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-2 py-1 rounded-full z-10 backdrop-blur-sm">
                                                                            Tap to open
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Back — Inner Page */}
                                                                <div className="flip3d-back" style={{ backgroundColor: settings.flip3d_page_color }}>
                                                                    <div className="text-center flex flex-col items-center gap-2 w-full">
                                                                        {settings.show_image && product.standard_image ? (
                                                                            <img src={product.standard_image} alt="" className="w-12 h-16 object-cover rounded shadow-md mb-1 opacity-80" />
                                                                        ) : (
                                                                            <div className="w-12 h-16 flex items-center justify-center bg-gray-200 rounded shadow-md mb-1 text-lg">📚</div>
                                                                        )}
                                                                        {settings.show_title && (
                                                                            <a href={(product.standard_permalink || product.standard_button_link || '#')} target="_blank" rel="noopener noreferrer" className="block hover:underline focus:outline-none">
                                                                                <h3
                                                                                    className="ss-card-title text-xs leading-tight line-clamp-2 px-1"
                                                                                    dangerouslySetInnerHTML={{ __html: product.standard_title }}
                                                                                />
                                                                            </a>
                                                                        )}
                                                                        {settings.show_author_badge && product.standard_author && (
                                                                            <span className="ss-card-author">{product.standard_author}</span>
                                                                        )}
                                                                        {settings.show_rating && (
                                                                            <div className="ss-card-rating text-yellow-500 text-[10px]">★★★★★</div>
                                                                        )}
                                                                        {settings.show_price && (
                                                                            <div
                                                                                className="ss-card-price text-sm"
                                                                                dangerouslySetInnerHTML={{ __html: product.standard_price }}
                                                                            />
                                                                        )}
                                                                        {settings.show_cart && (
                                                                            <a
                                                                                href={product.standard_button_link || '#'}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="ss-cart-button mt-4 inline-flex items-center justify-center gap-1.5 px-5 py-2 shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
                                                                            >
                                                                                <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                                                {saButtonText}
                                                                            </a>
                                                                        )}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setFlippedCardId(null); }}
                                                                            className="text-gray-400 text-[9px] hover:text-gray-600 mt-1"
                                                                        >
                                                                            ↩ Flip back
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            // ── END 3D FLIP BOOK ────────────────────────────────

                                            // Styles — smooth hover (500ms + cubic-bezier to avoid jerkiness)
                                            const smoothTransition = "transition-[transform,box-shadow,border-color] duration-[500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] [will-change:transform]";
                                            let cardClasses = `relative overflow-hidden ${smoothTransition}`;
                                            let imageContainerClasses = "relative overflow-hidden";
                                            let contentClasses = "p-4";

                                            let cardStyle = {
                                                borderRadius: radiusToCss(settings.border_radius)
                                            };
                                            // Image size: support old (image_height as px number) and new (width/height + units)
                                            const imgW = settings.image_width ?? 100;
                                            const imgWUnit = settings.image_width_unit || '%';
                                            const imgH = settings.image_height ?? 100;
                                            const imgHUnit = settings.image_height_unit || (typeof settings.image_height === 'number' && !settings.image_height_unit ? 'px' : '%');
                                            const imgWidthVal = `${imgW}${imgWUnit}`;
                                            const imgHeightVal = isMasonry ? 'auto' : `${imgH}${imgHUnit}`;
                                            let imageStyle = {
                                                width: imgWidthVal,
                                                height: imgHeightVal,
                                                objectFit: 'contain'
                                            };
                                            if (isMasonry) {
                                                imageStyle.display = 'block';
                                                imageStyle.verticalAlign = 'top';
                                            }

                                            // Masonry Item Wrapper — Pinterest vs Metro
                                            if (isMasonry) {
                                                cardStyle.breakInside = 'avoid';
                                                cardStyle.animationDelay = `${index * 50}ms`;
                                                imageContainerClasses += " w-full ss-masonry-img-wrap";
                                                if (settings.design === 'design-2') {
                                                    // Metro Grid: sharp tiles, bold border, image natural height so no gap above title
                                                    cardClasses += ` mb-6 bg-white rounded-none shadow-md hover:shadow-xl border-2 border-gray-200 hover:border-gray-400 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both ${focusClass} ${smoothTransition} hover:-translate-y-0.5 transform-gpu overflow-hidden`;
                                                    imageContainerClasses += " rounded-none flex-shrink-0";
                                                    contentClasses = "p-3 pt-3 text-left border-t border-gray-100 mt-2";
                                                } else {
                                                    // Pinterest Style (design-1): rounded cards, soft shadow, natural image height
                                                    cardClasses += ` break-inside-avoid mb-6 bg-white rounded-2xl shadow-sm hover:shadow-lg border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both ${focusClass} ${smoothTransition} hover:-translate-y-1 transform-gpu overflow-hidden`;
                                                    imageContainerClasses += " rounded-t-2xl";
                                                    contentClasses = "p-4 text-center";
                                                }
                                            }

                                            // Neon Colors for Brutalist
                                            const neonColors = [
                                                'bg-[#ccff00]', // Neon Lime
                                                'bg-[#00ffff]', // Cyan
                                                'bg-[#ff99cc]', // Pink
                                                'bg-[#ffff00]', // Yellow
                                                'bg-[#ff9900]'  // Orange
                                            ];
                                            const brutalistBg = neonColors[index % neonColors.length];


                                            if (isGrid) {
                                                if (settings.design === 'design-2') { // Modern Clean — minimal top padding to remove whitespace above title
                                                    cardClasses += ` bg-white rounded-none hover:shadow-2xl shadow-sm ${smoothTransition} hover:-translate-y-1 transform-gpu`;
                                                    imageContainerClasses += " aspect-[3/4]";
                                                    contentClasses += " px-5 pt-2 pb-5 text-left";
                                                } else if (settings.design === 'design-3') { // Minimalist
                                                    cardClasses += ` bg-transparent border border-gray-200 hover:border-black rounded-lg ${smoothTransition} transform-gpu`;
                                                    imageContainerClasses += " aspect-[2/3] m-2 rounded-md bg-gray-50 transition-transform duration-[500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] transform-gpu";
                                                    contentClasses += " p-4 text-center items-center";
                                                } else if (is3DShelf) { // 3D Shelf Perspective — books on shelf; fill card to avoid empty space above/below
                                                    cardClasses = `group relative perspective-[1400px] w-full aspect-[2/3] mx-auto overflow-visible z-0 hover:z-50 ${focusClass}`;
                                                    // Book: spine on left, tilted like on shelf; hover = straighten + come forward
                                                    imageContainerClasses = "absolute inset-0 w-full h-full transition-all duration-300 ease-out origin-left z-10 " +
                                                        "rotate-y-[22deg] scale-[0.92] group-hover:rotate-y-0 group-hover:scale-105 group-hover:translate-x-3 group-hover:translate-z-[20px] rounded-r-md border-r-2 border-white/30 shadow-[8px_4px_24px_rgba(0,0,0,0.35)] group-hover:shadow-[16px_8px_40px_rgba(0,0,0,0.4)]";
                                                    imageStyle = { ...imageStyle, boxShadow: '12px 6px 28px rgba(0,0,0,0.35)', transformStyle: 'preserve-3d', objectFit: 'contain' }; // contain = full cover visible, no crop
                                                    contentClasses = "hidden";
                                                } else if (isSlideOut) { // Dynamic Slide-Out (New)
                                                    // Card Layout
                                                    cardClasses = `group relative w-full aspect-[4/5] bg-transparent rounded-2xl transition-all duration-300 ease-out hover:z-30 ${focusClass}`;

                                                    // Image: Initially full width (almost), shrinks on hover
                                                    imageContainerClasses = "absolute inset-y-0 left-0 w-[85%] z-20 shadow-xl transition-all duration-300 ease-out group-hover:w-[50%] rounded-xl overflow-hidden";

                                                    // Content: Hidden behind, slides out
                                                    contentClasses = "absolute inset-y-4 right-0 w-[55%] bg-white rounded-r-xl shadow-lg z-10 flex flex-col justify-center p-4 pl-6 translate-x-[-100%] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 ease-out";

                                                } else if (isNegativeSpace) { // Negative Space: hover = color flood from cover + title slide from left
                                                    cardClasses = `group relative w-full aspect-square bg-[#f4f4f4] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-center overflow-hidden ${focusClass}`;

                                                    // Image is small, centered, shadows
                                                    imageContainerClasses = "w-[30%] shadow-2xl z-10 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 group-hover:rotate-3 relative overflow-hidden";

                                                    // Content acts as overlay for title slide (handled below in isNegativeSpace block)
                                                    contentClasses = "absolute inset-0 pointer-events-none";
                                                } else if (isBrutalist) { // Brutalist Contrast (New)
                                                    // Thick borders, neon bg
                                                    cardClasses += ` ${brutalistBg} border-4 border-black p-4 flex flex-col justify-between hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] ${smoothTransition}`;
                                                    imageContainerClasses = "relative w-3/5 mx-auto my-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] border-2 border-black transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:rotate-[45deg] group-hover:scale-110 z-10 overflow-hidden";
                                                    contentClasses = "text-center";
                                                } else { // Design 1 - Classic Card (Default)
                                                    cardClasses += ` bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 border border-gray-100 p-4 rounded-2xl ${focusClass} ${smoothTransition} transform-gpu`;
                                                    imageContainerClasses += " mx-auto mb-4 -mt-2 shadow-lg group-hover:scale-[1.02] transition-transform duration-[500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] transform-gpu rounded-xl aspect-[2/3]";
                                                    contentClasses += " text-center";
                                                }
                                            } else if (settings.layout === 'list') {
                                                if (settings.design === 'design-2') { // Compact Row
                                                    cardClasses = `group bg-transparent border-b border-gray-200 flex flex-row items-center gap-4 py-3 hover:bg-gray-50 rounded-none px-2 ${focusClass} transition-colors duration-[500ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)]`;
                                                } else if (settings.design === 'design-1') { // Standard List — wider image, balanced layout
                                                    cardClasses += ` bg-white rounded-xl shadow-md hover:shadow-lg border border-gray-100 flex flex-row items-stretch gap-6 p-5 ${focusClass} ${smoothTransition} transform-gpu`;
                                                    imageContainerClasses = "w-48 min-w-[11rem] flex-shrink-0 bg-slate-50 rounded-xl p-2 flex items-center justify-center overflow-hidden";
                                                    contentClasses = "flex-1 min-w-0 flex flex-col text-left justify-center gap-1";
                                                } else {
                                                    cardClasses += ` bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 flex-row items-center gap-6 p-5 ${focusClass} ${smoothTransition} transform-gpu`;
                                                }
                                            }

                                            // Look Inside position helpers for SA preview (Architect setting overrides global)
                                            const saLookInsideUrl = product.look_inside_url || '';
                                            const saBtnPos = settings.look_inside_btn_position || previewBtnPosition;
                                            const saShowLookInside = isPro && saLookInsideUrl && settings.show_look_inside;
                                            const saIsTopLeft = saBtnPos === 'top-left';
                                            const saIsTopLeftOuter = saBtnPos === 'top-left-outer';
                                            const saIsTopRight = saBtnPos === 'top-right';
                                            const saIsOverlay = saBtnPos === 'overlay-center';
                                            const saIsBottom = !saIsTopLeft && !saIsTopLeftOuter && !saIsTopRight && !saIsOverlay;

                                            // Build corner occupancy so badge/ribbon/look-inside stack instead of overlap
                                            const CORNER_GAP = 44; // vertical space per slot so stacked badge/ribbon/button have visible gap
                                            const STACK_MARGIN = 8; // margin between stacked items; last item has no bottom margin
                                            const hasDiscountBadge = settings.show_badge && !!getDiscountBadgeText(product);
                                            const badgePos = settings.badge_position || 'top-right';
                                            const ribbonPos = settings.ribbon_position || 'top-left';
                                            const topLeftEls = [];
                                            if (badgePos === 'top-left' && hasDiscountBadge) topLeftEls.push('discount');
                                            if (ribbonPos === 'top-left' && settings.show_ribbon_badge) topLeftEls.push('ribbon');
                                            if (saIsTopLeft && saShowLookInside) topLeftEls.push('look_inside');
                                            const topRightEls = [];
                                            if (badgePos === 'top-right' && hasDiscountBadge) topRightEls.push('discount');
                                            if (ribbonPos === 'top-right' && settings.show_ribbon_badge) topRightEls.push('ribbon');
                                            if (saIsTopRight && saShowLookInside) topRightEls.push('look_inside');
                                            const bottomLeftEls = [];
                                            if (badgePos === 'bottom-left' && hasDiscountBadge) bottomLeftEls.push('discount');
                                            if (ribbonPos === 'bottom-left' && settings.show_ribbon_badge) bottomLeftEls.push('ribbon');
                                            if (saBtnPos === 'bottom-left' && saShowLookInside) bottomLeftEls.push('look_inside');
                                            const bottomRightEls = [];
                                            if (badgePos === 'bottom-right' && hasDiscountBadge) bottomRightEls.push('discount');
                                            if (ribbonPos === 'bottom-right' && settings.show_ribbon_badge) bottomRightEls.push('ribbon');
                                            if (saBtnPos === 'bottom-right' && saShowLookInside) bottomRightEls.push('look_inside');
                                            const cornerSlot = (pos) => {
                                                const arr = pos === 'top-left' ? topLeftEls : pos === 'top-right' ? topRightEls : pos === 'bottom-left' ? bottomLeftEls : bottomRightEls;
                                                return (key) => { const i = arr.indexOf(key); return i >= 0 ? i : 0; };
                                            };
                                            const cornerOffset = (pos, key) => cornerSlot(pos)(key) * CORNER_GAP;
                                            const isLastInCorner = (pos, key) => {
                                                const arr = pos === 'top-left' ? topLeftEls : pos === 'top-right' ? topRightEls : pos === 'bottom-left' ? bottomLeftEls : bottomRightEls;
                                                const i = arr.indexOf(key);
                                                return i >= 0 && i === arr.length - 1;
                                            };

                                            const isSpecificMode = settings.data_source === 'woocommerce' && settings.query_type === 'specific';
                                            const align = settings.card_alignment || 'center';
                                            const textAlignClass = align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
                                            const flexAlignClass = align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center';
                                            const justifyClass = align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center';
                                            const COVER_MAX_HEIGHT = 420; // cap cover/3D shelf height so fewer columns don't make images too tall
                                            const shelfCardStyle = is3DShelf ? { background: 'linear-gradient(180deg, #e8e4df 0%, #e0dcd6 70%, #c4b8a8 85%, #8b7355 100%)', borderRadius: '4px', boxShadow: 'inset 0 -2px 8px rgba(0,0,0,0.15)', transformStyle: 'preserve-3d', maxHeight: COVER_MAX_HEIGHT } : null;

                                            const isListStandard = settings.layout === 'list' && settings.design === 'design-1';

                                            return (
                                                <div key={product.id} className={`ss-card-container ${cardClasses}`} style={is3DShelf ? shelfCardStyle : (isSlideOut ? {} : cardStyle)}>
                                                    {/* Look Inside — Top Left Outer: above the image, outside the box; width + align from settings */}
                                                    {saShowLookInside && saIsTopLeftOuter && (
                                                        <div className="flex justify-start items-center mb-2 w-full" style={{ minHeight: 0 }}>
                                                            <button type="button" className={`ss-look-inside-btn ${settings.look_inside_btn_width !== 'inline' ? 'w-full' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewLookInside({ open: true, url: saLookInsideUrl, title: product.standard_title, thumbnail: product.standard_image, authors: product.standard_author }); }}>
                                                                <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                {saLookInside}
                                                            </button>
                                                        </div>
                                                    )}
                                                    <div className={`ss-card-image ${imageContainerClasses}`} style={is3DShelf ? { position: 'relative', transformStyle: 'preserve-3d' } : (settings.layout === 'grid' ? { position: 'relative', maxHeight: COVER_MAX_HEIGHT } : { position: 'relative' })}>
                                                        {settings.show_image ? (
                                                            isListStandard ? (
                                                                <div className="w-full rounded-lg overflow-hidden shadow-sm aspect-[3/4]">
                                                                    {product.standard_image ? (
                                                                        <img src={product.standard_image} alt={product.standard_title} className="w-full h-full object-contain" style={{ ...imageStyle, height: '100%' }} />
                                                                    ) : (
                                                                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">📚</div>
                                                                    )}
                                                                </div>
                                                            ) : product.standard_image ? (
                                                                <img src={product.standard_image} alt={product.standard_title} className="w-full h-full object-contain transition-transform duration-300 ease-out group-hover:scale-110" style={imageStyle} />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">📚</div>
                                                            )
                                                        ) : (
                                                            <div className="w-full h-full min-h-[120px] flex items-center justify-center bg-gray-100 text-gray-400 text-3xl">📚</div>
                                                        )}

                                                        {/* Discount Badge (% OFF) — independent; shows even when product has ribbon; stacked with margin, last has no bottom margin */}
                                                        {settings.show_badge && getDiscountBadgeText(product) && (() => {
                                                            const text = getDiscountBadgeText(product);
                                                            if (typeof text !== 'string' || !/%\s*OFF/i.test(text)) return null;
                                                            const pos = settings.badge_position || 'top-right';
                                                            const posClass = pos === 'top-left' ? 'top-2 left-2' : pos === 'top-right' ? 'top-2 right-2' : pos === 'bottom-left' ? 'bottom-2 left-2' : 'bottom-2 right-2';
                                                            const offset = cornerOffset(pos, 'discount');
                                                            const posStyle = offset ? (pos === 'top-left' ? { top: (8 + offset) + 'px', left: '8px' } : pos === 'top-right' ? { top: (8 + offset) + 'px', right: '8px' } : pos === 'bottom-left' ? { bottom: (8 + offset) + 'px', left: '8px' } : { bottom: (8 + offset) + 'px', right: '8px' }) : {};
                                                            const marginStyle = !isLastInCorner(pos, 'discount') ? { marginBottom: STACK_MARGIN } : {};
                                                            const design = settings.badge_design || 'scalloped';
                                                            const [pct, off] = text.split(/\s+/).filter(Boolean);
                                                            return (
                                                                <div className={`absolute z-20 ss-badge ss-discount-badge ss-badge-${design} ${posClass} flex flex-col items-center justify-center text-center font-bold shadow-lg pointer-events-none`} style={{ backgroundColor: settings.badge_bg_color || '#dc2626', color: settings.badge_text_color || '#ffffff', ...posStyle, ...marginStyle }}>
                                                                    <span className="ss-badge-line1 leading-tight block">{pct}</span><span className="ss-badge-line2 text-[0.65em] uppercase tracking-wider">{off}</span>
                                                                </div>
                                                            );
                                                        })()}
                                                        {/* Ribbon Badge (New / Sale / custom) — independent; stacked with margin, last has no bottom margin */}
                                                        {settings.show_ribbon_badge && (() => {
                                                            const text = getBadgeText(product);
                                                            const isDiscount = typeof text === 'string' && /%\s*OFF/i.test(text);
                                                            const isOnSale = product.is_on_sale === true || (product.regular_price != null && product.sale_price != null && Number(product.regular_price) > Number(product.sale_price));
                                                            let ribbonText = null;
                                                            if (text && !isDiscount) ribbonText = text;
                                                            else if (product.is_new) ribbonText = 'New';
                                                            else if (isOnSale) ribbonText = 'Sale';
                                                            if (!ribbonText) ribbonText = 'New';
                                                            const pos = settings.ribbon_position || 'top-left';
                                                            const posClass = pos === 'top-left' ? 'top-2 left-2' : pos === 'top-right' ? 'top-2 right-2' : pos === 'bottom-left' ? 'bottom-2 left-2' : 'bottom-2 right-2';
                                                            const offset = cornerOffset(pos, 'ribbon');
                                                            const posStyle = offset ? (pos === 'top-left' ? { top: (8 + offset) + 'px', left: '8px' } : pos === 'top-right' ? { top: (8 + offset) + 'px', right: '8px' } : pos === 'bottom-left' ? { bottom: (8 + offset) + 'px', left: '8px' } : { bottom: (8 + offset) + 'px', right: '8px' }) : {};
                                                            const marginStyle = !isLastInCorner(pos, 'ribbon') ? { marginBottom: STACK_MARGIN } : {};
                                                            const cr = settings.color_ribbon || {};
                                                            const tr = settings.typo_ribbon || {};
                                                            const r = settings.ribbon_radius ?? 8;
                                                            const radius = typeof r === 'object' ? `${r.topLeft ?? 8}px ${r.topRight ?? 8}px ${r.bottomRight ?? 8}px ${r.bottomLeft ?? 8}px` : `${r}px`;
                                                            const rb = settings.ribbon_border || {};
                                                            const bw = rb.top ?? rb.width ?? 0;
                                                            const borderStyle = bw ? { border: `${bw}px solid ${rb.color || 'transparent'}` } : {};
                                                            return (
                                                                <div className={`absolute z-20 ss-ribbon-badge ${posClass} flex items-center justify-center text-center font-bold shadow-lg pointer-events-none px-2 py-1 uppercase tracking-wide`} style={{ fontSize: (tr.size ?? 12) + 'px', backgroundColor: cr.bg || '#dc2626', color: cr.text || '#ffffff', borderRadius: radius, ...borderStyle, ...posStyle, ...marginStyle }}>
                                                                    {ribbonText}
                                                                </div>
                                                            );
                                                        })()}

                                                        {/* Remove from selection overlay — Specific Items mode only */}
                                                        {isSpecificMode && (
                                                            <div className="absolute inset-0 flex items-start justify-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30 pointer-events-none group-hover:pointer-events-auto">
                                                                <button
                                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSettings(prev => ({ ...prev, selectedProducts: (prev.selectedProducts || []).filter(x => x.id !== product.id) })); }}
                                                                    title="Remove from selection"
                                                                    className="w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 transition-colors text-xs font-black"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        )}
                                                        {product.enriched_by === 'google_books' && (
                                                            <div className="absolute bottom-2 left-2 z-20">
                                                                <div className="flex items-center gap-1 bg-black/70 backdrop-blur-md border border-white/10 rounded-md px-1.5 py-0.5 shadow-sm">
                                                                    <span className="text-[9px] font-bold text-white tracking-wide">✨ Google Enriched</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                        {/* Look Inside — top-left (stacked with badge/ribbon when same corner); width + align from settings */}
                                                        {saShowLookInside && saIsTopLeft && (() => {
                                                            const offset = cornerOffset('top-left', 'look_inside');
                                                            const fullWidth = settings.look_inside_btn_width !== 'inline';
                                                            return (
                                                                <div style={{ position: 'absolute', top: (8 + offset) + 'px', left: '8px', right: '8px', zIndex: 20 }}>
                                                                    <button className={`ss-look-inside-btn ${fullWidth ? 'w-full' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewLookInside({ open: true, url: saLookInsideUrl, title: product.standard_title, thumbnail: product.standard_image, authors: product.standard_author }); }}>
                                                                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                        {saLookInside}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
                                                        {/* Look Inside — top-right (stacked with badge/ribbon when same corner); width + align from settings */}
                                                        {saShowLookInside && saIsTopRight && (() => {
                                                            const offset = cornerOffset('top-right', 'look_inside');
                                                            const fullWidth = settings.look_inside_btn_width !== 'inline';
                                                            return (
                                                                <div style={{ position: 'absolute', top: (8 + offset) + 'px', left: '8px', right: '8px', zIndex: 20 }}>
                                                                    <button className={`ss-look-inside-btn ${fullWidth ? 'w-full' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewLookInside({ open: true, url: saLookInsideUrl, title: product.standard_title, thumbnail: product.standard_image, authors: product.standard_author }); }}>
                                                                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                        {saLookInside}
                                                                    </button>
                                                                </div>
                                                            );
                                                        })()}
                                                        {/* Look Inside — overlay-center (hover); width + align from settings */}
                                                        {saShowLookInside && saIsOverlay && (
                                                            <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-2" style={{ zIndex: 20 }}>
                                                                <div className="w-full">
                                                                    <button className={`ss-look-inside-btn ${settings.look_inside_btn_width !== 'inline' ? 'w-full' : ''}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewLookInside({ open: true, url: saLookInsideUrl, title: product.standard_title, thumbnail: product.standard_image, authors: product.standard_author }); }}>
                                                                        <svg width="10" height="10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                                        {saLookInside}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Negative Space: color flood from cover + title slide from left on hover */}
                                                    {isNegativeSpace && (
                                                        <>
                                                            <div
                                                                className="absolute inset-0 z-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"
                                                                style={{ backgroundColor: negativeSpaceColors[product.id] || 'transparent' }}
                                                                aria-hidden
                                                            />
                                                            {settings.show_title && product.standard_title && (
                                                                <a href={(product.standard_permalink || product.standard_button_link || '#')} target="_blank" rel="noopener noreferrer" className="absolute left-0 bottom-4 right-0 z-20 pl-4 pr-8 overflow-hidden pointer-events-none group-hover:pointer-events-auto">
                                                                    <h3
                                                                        className="ss-card-title text-white font-bold text-sm leading-tight line-clamp-2 transform -translate-x-full group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out hover:underline"
                                                                        style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
                                                                        dangerouslySetInnerHTML={{ __html: product.standard_title }}
                                                                    />
                                                                </a>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* 3D Shelf: hover-only floating title + price + rating — uses Designer typo/color; box grows with content */}
                                                    {is3DShelf && (() => {
                                                        const boxBg = settings.color_container?.bg || '#ffffff';
                                                        const opacity = typeof settings.shelf_hover_box_opacity === 'number' ? settings.shelf_hover_box_opacity : 0.96;
                                                        const hexToRgba = (hex, a) => {
                                                            const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
                                                            if (!m) return `rgba(255,255,255,${a})`;
                                                            return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
                                                        };
                                                        const boxRad = radiusToCss(settings.border_radius);
                                                        const boxStyle = {
                                                            backgroundColor: hexToRgba(boxBg, opacity),
                                                            borderRadius: boxRad,
                                                            padding: (() => { const p = settings.box_padding; const n = typeof p === 'number'; const t = n ? p : (p?.top ?? 16); return `${Math.max(8, t - 4)}px`; })(),
                                                            minWidth: '120px',
                                                            minHeight: '72px',
                                                        };
                                                        return (
                                                            <a href={(product.standard_permalink || product.standard_button_link || '#')} target="_blank" rel="noopener noreferrer" className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-max max-w-[calc(100%-0.5rem)] opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 translate-x-1 group-hover:translate-x-0 transition-all duration-300 ease-out delay-75 pointer-events-none group-hover:pointer-events-auto flex flex-col justify-center gap-1.5 backdrop-blur-sm shadow-xl border border-gray-200/80 hover:border-gray-300" style={boxStyle}>
                                                                {settings.show_title && product.standard_title && (
                                                                    <h3 className="ss-card-title leading-tight line-clamp-2 hover:underline mb-0" title={product.standard_title} dangerouslySetInnerHTML={{ __html: product.standard_title }} />
                                                                )}
                                                                {settings.show_price && product.standard_price && product.standard_price !== 'PRO_INGESTED' && (
                                                                    <div className="ss-card-price leading-tight" dangerouslySetInnerHTML={{ __html: product.standard_price }} />
                                                                )}
                                                                {settings.show_rating && (
                                                                    <div className="ss-card-rating text-amber-500 text-[10px] tracking-wider" title="Rating">★★★★★</div>
                                                                )}
                                                            </a>
                                                        );
                                                    })()}

                                                    {!isNegativeSpace && !isSlideOut && (
                                                        <div className={`${contentClasses} flex flex-col ${isListStandard ? 'text-left' : `${flexAlignClass} ${textAlignClass}`}`}>
                                                            {isListStandard ? (
                                                                <>
                                                                    {(product.standard_category || product.genre) && (
                                                                        <div className="text-xs font-bold uppercase tracking-wider text-blue-500 mb-1.5" dangerouslySetInnerHTML={{ __html: product.standard_category || product.genre }} />
                                                                    )}
                                                                    {settings.show_title && <a href={(product.standard_permalink || product.standard_button_link || '#')} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600 transition-colors"><h3 className="ss-card-title text-xl font-bold text-gray-900 mb-1 leading-tight hover:underline" dangerouslySetInnerHTML={{ __html: product.standard_title }}></h3></a>}
                                                                    {settings.show_author_badge && product.standard_author && <p className="ss-card-author mb-2">by {product.standard_author}</p>}
                                                                    {settings.show_rating && <div className="ss-card-rating text-yellow-500 text-sm mb-2">★★★★★</div>}
                                                                    {settings.show_summary && product.standard_summary && <p className="ss-card-summary text-sm text-gray-600 line-clamp-3 mb-3 leading-relaxed">{product.standard_summary}</p>}
                                                                    {settings.show_price && product.standard_price && product.standard_price !== 'PRO_INGESTED' && (
                                                                        <div className="text-base font-bold text-green-700 mb-4 [&_del]:text-gray-400 [&_del]:line-through [&_del]:font-normal" dangerouslySetInnerHTML={{ __html: product.standard_price }} />
                                                                    )}
                                                                    <div className="flex flex-wrap justify-end gap-2 mt-auto pt-1">
                                                                        {settings.show_cart && product.standard_button_link && (
                                                                            <a href={product.standard_button_link} target="_blank" rel="noopener noreferrer" className="ss-cart-button inline-flex items-center justify-center gap-2 px-5 py-2.5 shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap">
                                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                                                {saButtonText}
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </>
                                                            ) : (
                                                                <>
                                                            {settings.show_title && <a href={(product.standard_permalink || product.standard_button_link || '#')} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90"><h3 className="ss-card-title mb-1 hover:underline" dangerouslySetInnerHTML={{ __html: product.standard_title }}></h3></a>}

                                                            {settings.show_author_badge && (
                                                                <div className="mb-2">
                                                                    {product.standard_author ? (
                                                                        <span className="ss-card-author block">
                                                                            By {product.standard_author}
                                                                        </span>
                                                                    ) : (
                                                                        <div className="h-2 w-16 bg-gray-100 ss-skeleton rounded mx-auto"></div>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {settings.show_summary && product.standard_summary && (
                                                                <p className="ss-card-summary text-[11px] text-gray-500 line-clamp-2 italic mb-3 leading-relaxed max-w-[95%] mx-auto">
                                                                    {product.standard_summary}
                                                                </p>
                                                            )}

                                                            <div className={`flex flex-col gap-3 w-full mt-auto ${flexAlignClass}`}>
                                                                {/* PRO Ingested Badge */}
                                                                {product.standard_price === 'PRO_INGESTED' ? (
                                                                    shelfSage_license_status === 'active' ? (
                                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[9px] font-black shadow-md shadow-purple-900/20 animate-in zoom-in-95 duration-500 ring-4 ring-purple-500/10">
                                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                                            <span>PRO INGESTED</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-400 text-[9px] font-black border border-gray-200 shadow-sm opacity-80">
                                                                            <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                                                            <span>LOCKED</span>
                                                                        </div>
                                                                    )
                                                                ) : (
                                                                    settings.show_price && <div className="ss-card-price" dangerouslySetInnerHTML={{ __html: product.standard_price }}></div>
                                                                )}

                                                                {settings.show_rating && <div className="ss-card-rating text-yellow-400 text-[10px] tracking-widest">★★★★★</div>}

                                                                {settings.show_cart && product.standard_button_link && (
                                                                    <a
                                                                        href={product.standard_button_link}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="ss-cart-button inline-flex items-center justify-center gap-2 px-5 py-2.5 shadow-md hover:shadow-lg active:scale-95 mt-1 whitespace-nowrap"
                                                                    >
                                                                        <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                                        <span>{saButtonText}</span>
                                                                    </a>
                                                                )}

                                                                {/* Look Inside — bottom positions only (top/overlay handled in image area) */}
                                                                {saShowLookInside && saIsBottom && (
                                                                    <button
                                                                        className={`ss-look-inside-btn ${settings.look_inside_btn_width !== 'inline' ? 'w-full' : ''}`}
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPreviewLookInside({ open: true, url: saLookInsideUrl, title: product.standard_title, thumbnail: product.standard_image, authors: product.standard_author }); }}
                                                                    >
                                                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                        {saLookInside}
                                                                    </button>
                                                                )}
                                                            </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Slide Out Specific Content */}
                                                    {isSlideOut && (
                                                        <div className={contentClasses}>
                                                            <a href={(product.standard_permalink || product.standard_button_link || '#')} target="_blank" rel="noopener noreferrer"><h3 className="ss-card-title text-lg mb-1 hover:underline" dangerouslySetInnerHTML={{ __html: product.standard_title }}></h3></a>
                                                            {settings.show_author_badge && product.standard_author && <p className="ss-card-author mb-3">{product.standard_author}</p>}
                                                            <div className="ss-card-price text-xl mb-4" dangerouslySetInnerHTML={{ __html: product.standard_price }}></div>
                                                            <a
                                                                href={product.standard_button_link || '#'}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="ss-cart-button inline-flex items-center justify-center gap-2 px-5 py-2 shadow-md hover:shadow-lg active:scale-95 whitespace-nowrap"
                                                            >
                                                                <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                                                {saButtonText}
                                                            </a>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="col-span-full py-20 text-center opacity-50 flex flex-col items-center">
                                            <span className="text-4xl mb-2">📚</span>
                                            <p>No products found to preview.</p>
                                            <div className="text-xs text-gray-400 mt-2">Try changing the source or limit.</div>
                                        </div>
                                    )}
                                </div>
                            </PremiumLockedOverlay>
                        </div>
                    </div>
                </div>

                {/* Save Modal */}
                {showSaveModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 transform transition-all scale-100">
                            {saveStatus === 'saved' ? (
                                <div className="text-center py-4">
                                    <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1">Shortcode Saved!</h3>
                                    <p className="text-sm text-gray-500 mb-1">Your design has been saved to the library.</p>
                                    <p className="text-xs text-amber-600 mb-4">Where this shortcode is used (Elementor, Gutenberg), refresh the page or clear page cache to see the updated design.</p>
                                    {lastSavedShortcode && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left mb-4">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Your Shortcode</p>
                                            <code className="text-xs text-purple-700 font-mono break-all">{lastSavedShortcode}</code>
                                            <button onClick={async () => {
                                                const code = lastSavedShortcode;
                                                try {
                                                    if (navigator.clipboard && window.isSecureContext) {
                                                        await navigator.clipboard.writeText(code);
                                                    } else {
                                                        const el = document.createElement('textarea');
                                                        el.value = code;
                                                        el.style.position = 'fixed';
                                                        el.style.opacity = '0';
                                                        document.body.appendChild(el);
                                                        el.focus();
                                                        el.select();
                                                        document.execCommand('copy');
                                                        document.body.removeChild(el);
                                                    }
                                                } catch (err) {
                                                    const el = document.createElement('textarea');
                                                    el.value = code;
                                                    el.style.position = 'fixed';
                                                    el.style.opacity = '0';
                                                    document.body.appendChild(el);
                                                    el.select();
                                                    try { document.execCommand('copy'); } finally { document.body.removeChild(el); }
                                                }
                                            }} className="mt-2 text-[10px] text-purple-500 hover:text-purple-700 flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                                                Copy to clipboard
                                            </button>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => { setShowSaveModal(false); setSaveStatus(null); }} className="flex-1 px-4 py-2 text-gray-500 hover:text-gray-700 font-medium border border-gray-200 rounded-xl">Close</button>
                                        <a href="admin.php?page=shelfsage-saved-designs" className="flex-1 text-center bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-700 transition-colors">View Library</a>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                                        {currentShortcodeId ? 'Update Shortcode' : 'Save to Library'}
                                    </h3>
                                    <div className="mb-5">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Friendly Name</label>
                                        <input type="text" value={saveTitle} onChange={(e) => setSaveTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSave()} className="w-full border border-gray-300 rounded-xl p-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none" placeholder="e.g. Homepage Best Sellers" autoFocus />
                                        <p className="text-xs text-gray-400 mt-1">This name appears in your Shortcode Library.</p>
                                    </div>
                                    {saveStatus === 'error' && (
                                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-start gap-2">
                                            <span className="mt-0.5">⚠</span>
                                            <span>{saveError}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-3">
                                        <button onClick={() => { setShowSaveModal(false); setSaveStatus(null); }} className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium" disabled={saveStatus === 'saving'}>Cancel</button>
                                        <button onClick={handleSave} disabled={saveStatus === 'saving'} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-sm transition-all ${saveStatus === 'saving' ? 'bg-purple-400 text-white cursor-wait' : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-500/20'}`}>
                                            {saveStatus === 'saving' && <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
                                            {saveStatus === 'saving' ? 'Saving...' : currentShortcodeId ? 'Update' : 'Save to Library'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Upgrade Modal */}
                {showUpgradeModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowUpgradeModal(false)}>
                        <div className="relative bg-gradient-to-br from-[#1a0b2e] to-[#0f0518] border border-purple-700/50 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300" onClick={(e) => e.stopPropagation()}>
                            <div className="absolute -top-16 -right-16 w-40 h-40 bg-amber-500 blur-3xl opacity-10 pointer-events-none" />
                            <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-600 blur-3xl opacity-15 pointer-events-none" />
                            <div className="relative p-8 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30 text-3xl">✦</div>
                                <h3 className="text-xl font-black text-white mb-2">Unlock 3D Flip Book</h3>
                                <p className="text-purple-200 text-sm mb-6 leading-relaxed">Give your readers an <span className="text-amber-300 font-bold">immersive, interactive</span> browsing experience.<br />Upgrade to ShelfSage Pro to unlock this and 10+ premium features.</p>
                                <ul className="text-left space-y-2 mb-6">
                                    {['3D Flip Book with paper textures', 'Glossy & Matte cover finishes', 'Adjustable spine depth & perspective', 'Custom inner page color', 'All Layouts (Masonry, Slider…)'].map(feat => (
                                        <li key={feat} className="flex items-center gap-2 text-xs text-purple-100"><span className="text-amber-400 text-base">✓</span> {feat}</li>
                                    ))}
                                </ul>
                                <a href="#" className="block w-full py-3 px-6 bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black rounded-xl shadow-lg hover:shadow-amber-500/40 hover:scale-[1.02] transition-all text-sm uppercase tracking-wide">Upgrade to Pro Today</a>
                                <button onClick={() => setShowUpgradeModal(false)} className="mt-4 text-purple-400 text-xs hover:text-white transition-colors">Maybe later</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Look Inside Modal — shared for all preview cards */}
        <LookInsideModal
            isOpen={previewLookInside.open}
            onClose={() => setPreviewLookInside(prev => ({ ...prev, open: false }))}
            url={previewLookInside.url}
            title={previewLookInside.title}
            thumbnail={previewLookInside.thumbnail}
            authors={previewLookInside.authors}
            readerStyle={previewReaderStyle}
        />
        </>
    );
};

export default ShortcodeArchitect;