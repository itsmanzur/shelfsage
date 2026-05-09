import React, { useState, useEffect, useRef } from 'react';

/**
 * LookInsideModal - Shared reusable PDF/Image reader modal.
 *
 * Props:
 *  - isOpen      {boolean}  Whether modal is visible
 *  - onClose     {function} Called when user closes modal
 *  - url         {string}   PDF or image URL to load
 *  - title       {string}   Book title (shown in header for style-1)
 *  - readerStyle {string}   'style-1' | 'style-2' | 'style-3'
 *  - thumbnail   {string}   Book cover image URL (used by style-3)
 *  - authors     {string}   Author names (used by style-3)
 */

/**
 * Mirror of the routing logic in `includes/look-inside-modal.php` so the
 * shortcode architect, vault preview, and any other React-mounted Look
 * Inside trigger honors the configured PDF Reader Engine instead of
 * loading the raw PDF into a bare iframe.
 *
 * Falls back gracefully when the localized settings are missing (basic
 * engine + native iframe).
 */
const isMobileDevice = () => {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
    if (navigator.maxTouchPoints > 1) return true;
    if (window.innerWidth <= 768) return true;
    return false;
};

const isImageUrl = (u) => /\.(jpe?g|gif|png|webp|avif)(\?|$)/i.test(u || '');

const getViewerUrl = (rawUrl) => {
    if (!rawUrl || isImageUrl(rawUrl)) return rawUrl;

    const settings =
        (typeof window !== 'undefined' && (window.rmssSettings || window.rmssAdminSettings)) || {};
    const engine = settings.pdf_reader_engine || 'basic';
    const pluginUrl = settings.pluginUrl || '';
    const nonce = settings.pdf_view_nonce || '';

    if (!pluginUrl) return rawUrl;
    if (engine !== 'flipbook' && !isMobileDevice()) return rawUrl;

    const viewer = engine === 'flipbook' ? 'pdf-flipbook-viewer.php' : 'pdf-viewer.php';
    const base = pluginUrl.endsWith('/') ? pluginUrl : pluginUrl + '/';
    return (
        `${base}includes/${viewer}` +
        `?file=${encodeURIComponent(rawUrl)}` +
        `&nonce=${encodeURIComponent(nonce)}`
    );
};

const LookInsideModal = ({
    isOpen = false,
    onClose,
    url = '',
    title = '',
    readerStyle = 'style-1',
    thumbnail = '',
    authors = '',
}) => {
    const [loaded, setLoaded] = useState(false);
    const [visible, setVisible] = useState(false);
    const frameRef = useRef(null);
    const imgRef = useRef(null);

    const isImage = isImageUrl(url);
    const viewerUrl = getViewerUrl(url);

    // Animate in/out
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setLoaded(false);
            setTimeout(() => setVisible(true), 10);
        } else {
            setVisible(false);
            document.body.style.overflow = '';
            // Reset src after animation to stop network request
            setTimeout(() => {
                setLoaded(false);
                if (frameRef.current) frameRef.current.src = '';
                if (imgRef.current) imgRef.current.src = '';
            }, 300);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Keyboard close
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape' && isOpen) onClose?.(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    if (!isOpen && !visible) return null;

    const labelText = window.rmssSettings?.labels?.look_inside || 'Look Inside';

    // ── Shared CSS (injected once, not per-style-branch) ─────────────────────
    const sharedCss = `@keyframes rmss-spin { to { transform: rotate(360deg); } }`;

    // ── Shared close button ──────────────────────────────────────────────────
    const CloseBtn = ({ light = false }) => (
        <button
            onClick={onClose}
            aria-label="Close"
            style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '8px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: light ? '#fff' : '#6b7280',
                transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = light ? 'rgba(255,255,255,0.15)' : '#f3f4f6'; e.currentTarget.style.color = light ? '#fff' : '#ef4444'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = light ? '#fff' : '#6b7280'; }}
        >
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
    );

    // ── Loader spinner ───────────────────────────────────────────────────────
    const Loader = () => (
        <div style={{
            position: 'absolute', inset: 0, display: loaded ? 'none' : 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.95)', zIndex: 10,
        }}>
            <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid #e5e7eb', borderTop: '3px solid #2563eb',
                animation: 'rmss-spin 0.8s linear infinite',
            }} />
        </div>
    );

    // ── Content viewer (iframe or img) ───────────────────────────────────────
    const Viewer = ({ style = {} }) => isImage ? (
        <img
            ref={imgRef}
            src={url} alt={title}
            onLoad={() => setLoaded(true)}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', ...style }}
        />
    ) : (
        <iframe
            ref={frameRef}
            src={viewerUrl}
            title={title}
            allowFullScreen
            onLoad={() => setLoaded(true)}
            style={{ width: '100%', height: '100%', border: 'none', display: 'block', ...style }}
        />
    );

    // ── Backdrop ─────────────────────────────────────────────────────────────
    const backdropStyle = {
        position: 'fixed', inset: 0, zIndex: 2147483647,
        background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.28s ease',
    };

    // ════════════════════════════════════════════════════════════════
    // STYLE-1: Dark overlay + centered white card + header bar
    // ════════════════════════════════════════════════════════════════
    if (readerStyle === 'style-1') {
        return (
            <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
                <style>{sharedCss}</style>
                <div style={{
                    position: 'relative', background: '#fff',
                    width: '92%', height: '92%', maxWidth: '1200px',
                    borderRadius: '14px', display: 'flex', flexDirection: 'column',
                    boxShadow: '0 25px 60px -12px rgba(0,0,0,0.5)',
                    overflow: 'hidden',
                    transform: visible ? 'scale(1)' : 'scale(0.94)',
                    transition: 'transform 0.28s ease',
                }}>
                    {/* Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', borderBottom: '1px solid #e5e7eb',
                        background: '#f9fafb', flexShrink: 0,
                    }}>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1f2937', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#2563eb">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            {labelText}{title ? `: ${title}` : ''}
                        </h3>
                        <CloseBtn />
                    </div>
                    {/* Viewer */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f3f4f6' }}>
                        <Loader />
                        <Viewer />
                    </div>
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════
    // STYLE-2: Minimal fullscreen dark reader (no header, X top-right)
    // ════════════════════════════════════════════════════════════════
    if (readerStyle === 'style-2') {
        return (
            <div style={{ ...backdropStyle, background: '#0a0a0a' }} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
                <style>{sharedCss}</style>
                {/* Floating close button */}
                <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
                    <CloseBtn light={true} />
                </div>
                {/* Title badge */}
                {title && (
                    <div style={{
                        position: 'absolute', top: '18px', left: '50%', transform: 'translateX(-50%)',
                        background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                        borderRadius: '9999px', padding: '4px 14px',
                        fontSize: '13px', color: '#e5e7eb', fontWeight: 500,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 'calc(100vw - 120px)',
                    }}>
                        {title}
                    </div>
                )}
                <div style={{
                    width: '95vw', height: '95vh', position: 'relative',
                    transform: visible ? 'scale(1)' : 'scale(0.96)',
                    transition: 'transform 0.28s ease',
                }}>
                    <div style={{ position: 'absolute', inset: 0, display: loaded ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTop: '3px solid #60a5fa', animation: 'rmss-spin 0.8s linear infinite' }} />
                    </div>
                    <Viewer style={{ borderRadius: '4px' }} />
                </div>
            </div>
        );
    }

    // ════════════════════════════════════════════════════════════════
    // STYLE-3: Split view — book info left, PDF right
    // ════════════════════════════════════════════════════════════════
    return (
        <div style={backdropStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
            <style>{sharedCss}</style>
            <div style={{
                position: 'relative', display: 'flex',
                width: '94%', height: '90%', maxWidth: '1300px',
                borderRadius: '16px', overflow: 'hidden',
                boxShadow: '0 30px 80px -12px rgba(0,0,0,0.6)',
                transform: visible ? 'scale(1)' : 'scale(0.94)',
                transition: 'transform 0.28s ease',
            }}>
                {/* Left panel — book info */}
                <div style={{
                    width: '240px', flexShrink: 0,
                    background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '28px 20px', color: '#fff', gap: '16px',
                }}>
                    {thumbnail && (
                        <img src={thumbnail} alt={title} style={{ width: '140px', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }} />
                    )}
                    {!thumbnail && (
                        <div style={{ width: '140px', height: '190px', background: 'rgba(255,255,255,0.08)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <svg width="48" height="48" fill="none" stroke="rgba(255,255,255,0.3)" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                        </div>
                    )}
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, lineHeight: 1.3, color: '#f1f5f9' }}>{title}</p>
                        {authors && <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>{authors}</p>}
                    </div>
                    <div style={{ marginTop: 'auto', width: '100%' }}>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{labelText}</span>
                            <button onClick={onClose} style={{
                                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                                color: '#cbd5e1', borderRadius: '8px', padding: '8px 12px',
                                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                transition: 'background 0.2s',
                            }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            >✕ Close</button>
                        </div>
                    </div>
                </div>
                {/* Right panel — PDF viewer */}
                <div style={{ flex: 1, position: 'relative', background: '#f3f4f6', overflow: 'hidden' }}>
                    <Loader />
                    <Viewer />
                </div>
            </div>
        </div>
    );
};

export default LookInsideModal;
