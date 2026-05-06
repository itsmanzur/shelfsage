<?php
/**
 * ShelfSage 3D Flipbook PDF Viewer — served inside an <iframe> on mobile & desktop.
 *
 * Security layers:
 *  1. WordPress is bootstrapped (loads wp-load.php if needed).
 *  2. WP nonce verified (`trsss_pdf_view`).
 *  3. URL must exist as `_rmss_look_inside_url` postmeta in the DB.
 *  4. URL must begin with http/https.
 */

// ── 1. Bootstrap WordPress if not already loaded ──────────────────────────────
if ( ! defined( 'ABSPATH' ) ) {
	// 5 levels up: pdf-flipbook-viewer.php → includes → shelfsage → plugins → wp-content → WP root
	$wp_load = dirname( __FILE__, 5 ) . '/wp-load.php';
	if ( file_exists( $wp_load ) ) {
		require_once $wp_load;
	} else {
		exit( 'WordPress not found.' );
	}
}

// ── 2. Nonce verification ─────────────────────────────────────────────────────
$nonce = isset( $_GET['nonce'] ) ? sanitize_text_field( wp_unslash( $_GET['nonce'] ) ) : '';
if ( ! wp_verify_nonce( $nonce, 'trsss_pdf_view' ) ) {
	http_response_code( 403 );
	exit( 'Security check failed.' );
}

// ── 3. URL validation ─────────────────────────────────────────────────────────
$raw = isset( $_GET['file'] ) ? wp_unslash( $_GET['file'] ) : '';
$url = filter_var( $raw, FILTER_VALIDATE_URL ) ? $raw : '';
if ( empty( $url ) || ! preg_match( '#^https?://#i', $url ) ) {
	http_response_code( 400 );
	exit;
}

// ── 4. DB whitelist — URL must be a registered Look Inside URL ─────────────────
if ( ! function_exists( 'trsss_is_authorized_look_inside_url' ) || ! trsss_is_authorized_look_inside_url( $url ) ) {
	http_response_code( 403 );
	exit( 'URL not authorized.' );
}

// ── 5. Serve viewer ───────────────────────────────────────────────────────────
header( 'Content-Type: text/html; charset=utf-8' );
header( 'X-Frame-Options: SAMEORIGIN' );
header( 'X-Content-Type-Options: nosniff' );

$safe_url       = $url;
$proxy_url      = add_query_arg(
	array(
		'file'  => $url,
		'nonce' => $nonce,
	),
	rest_url( 'shelfsage/v1/pdf-proxy' )
);
$json_url       = wp_json_encode( esc_url_raw( $proxy_url ) );
$pdfjs_url      = esc_url( TRSSS_URL . 'assets/pdfjs/pdf.min.js' );
$pdf_worker_url = esc_url( TRSSS_URL . 'assets/pdfjs/pdf.worker.js' );
$pdf_cmaps_url  = esc_url( TRSSS_URL . 'assets/pdfjs/cmaps/' );
$pageflip_url   = esc_url( TRSSS_URL . 'assets/pageflip/page-flip.browser.js' );
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, user-scalable=yes">
<title>Book Preview - Flipbook</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#e5e7eb;overflow:hidden;font-family:sans-serif;display:flex;flex-direction:column;}
#toolbar{flex-shrink:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:8px 12px;padding-top:calc(8px + env(safe-area-inset-top));background:rgba(15,15,15,.94);color:#f3f4f6;font-size:13px;gap:8px;user-select:none;box-shadow:0 2px 10px rgba(0,0,0,0.5);}
#toolbar button{min-width:74px;background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:8px;padding:8px 10px;cursor:pointer;font-size:13px;font-weight:700;transition:background .15s}
#toolbar button:disabled{opacity:.4;cursor:default}
#toolbar button:hover:not(:disabled){background:rgba(255,255,255,.22)}
#page-info{flex:1;text-align:center;font-size:12px;opacity:.85}

#container-wrapper {
    flex: 1;
    position: relative;
    padding: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

#container {
    width: 100%;
    height: 100%;
    position: relative;
}

.flipbook {
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    display: none; /* hidden until initialized */
}

.page {
    background-color: #fff;
    overflow: hidden;
    position: relative;
    border: solid 1px hsl(35, 20%, 70%);
}

.page::after {
    content: '';
    position: absolute;
    inset: 0;
    box-shadow: inset -10px 0 30px rgba(0,0,0,0.05);
    pointer-events: none;
}

.page.-left::after {
    box-shadow: inset 10px 0 30px rgba(0,0,0,0.05);
}

.page canvas {
    width: 100%;
    height: 100%;
    object-fit: fill; /* ensures PDF fills the page exactly */
}

.page-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #9ca3af;
    font-size: 14px;
}

#loading{color:#4b5563;font-size:16px;font-weight:bold;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}
.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #d1d5db;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

#error-msg{color:#ef4444;font-size:14px;padding:40px;text-align:center;display:none;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);}

@media (max-width: 600px) {
    #toolbar{padding-left:8px;padding-right:8px}
    #toolbar button{min-width:64px;padding:8px 8px;font-size:12px}
    #page-info{font-size:11px}
    #container-wrapper{padding: 10px;}
}
</style>
</head>
<body>
<div id="toolbar">
    <button id="btn-prev" disabled>&#8249; Prev</button>
    <span id="page-info">Loading...</span>
    <button id="btn-next" disabled>Next &#8250;</button>
</div>

<div id="container-wrapper">
    <div id="container">
        <div id="loading">
            <div class="spinner"></div>
            Processing PDF...
        </div>
        <p id="error-msg">&#10060; Could not load PDF.
            <br><br>
            <a href="<?php echo esc_attr( $safe_url ); ?>" target="_blank" rel="noopener noreferrer" style="color:#2563eb">Download instead</a>
        </p>
        <div class="flipbook" id="flipbook">
            <!-- Pages generated by JS -->
        </div>
    </div>
</div>

<script src="<?php echo $pdfjs_url; ?>"></script>
<script src="<?php echo $pageflip_url; ?>"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = <?php echo wp_json_encode( $pdf_worker_url ); ?>;

var pdfDoc = null, totalPages = 0;
var pdfUrl = <?php echo $json_url; ?>;
var pageFlip = null;

var container = document.getElementById('container');
var flipbookEl = document.getElementById('flipbook');
var loading  = document.getElementById('loading');
var errMsg   = document.getElementById('error-msg');
var pageInfo = document.getElementById('page-info');
var btnPrev  = document.getElementById('btn-prev');
var btnNext  = document.getElementById('btn-next');

var renderedPages = new Set();
var isMobile = window.innerWidth <= 768;

function updatePageInfo() {
    if (!pageFlip) return;
    var current = pageFlip.getCurrentPageIndex() + 1;
    var viewMode = pageFlip.getOrientation() === 'portrait' ? 1 : 2;
    var currentDisplay = viewMode === 2 && current < totalPages ? current + '-' + (current+1) : current;
    if (current === 1 && viewMode === 2) currentDisplay = '1'; // Cover is usually single
    pageInfo.textContent = 'Page ' + currentDisplay + ' of ' + totalPages;
    
    btnPrev.disabled = current <= 1;
    btnNext.disabled = current >= totalPages;
}

function renderPdfPage(pageNum) {
    if (pageNum < 1 || pageNum > totalPages) return;
    if (renderedPages.has(pageNum)) return;
    renderedPages.add(pageNum);
    
    var pageDiv = document.getElementById('page-' + pageNum);
    if (!pageDiv) return;
    
    pdfDoc.getPage(pageNum).then(function(page) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');
        
        // Render at 2x scale for sharpness
        var viewport = page.getViewport({ scale: 2 });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        page.render({ canvasContext: ctx, viewport: viewport }).promise.then(function() {
            // Remove loader and append canvas
            pageDiv.innerHTML = '';
            pageDiv.appendChild(canvas);
        });
    });
}

// Prefetch and render adjacent pages
function preloadAdjacentPages(currentIndex) {
    var pageNum = currentIndex + 1; // 0-based to 1-based
    renderPdfPage(pageNum);
    renderPdfPage(pageNum + 1);
    renderPdfPage(pageNum + 2);
    renderPdfPage(pageNum - 1);
    renderPdfPage(pageNum - 2);
}

pdfjsLib.getDocument({
    url: pdfUrl,
    cMapUrl: <?php echo wp_json_encode( $pdf_cmaps_url ); ?>,
    cMapPacked: true
}).promise.then(function(pdf) {
    pdfDoc = pdf;
    totalPages = pdf.numPages;
    
    // Get dimensions of the first page to size the book
    return pdf.getPage(1);
}).then(function(page1) {
    var viewport = page1.getViewport({ scale: 1 });
    var baseWidth = viewport.width;
    var baseHeight = viewport.height;
    
    var wrapper = document.getElementById('container-wrapper');
    
    function resizeContainer() {
        var cs = window.getComputedStyle(wrapper);
        var ww = wrapper.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
        var wh = wrapper.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
        
        var isPortrait = window.innerWidth <= 768;
        var targetRatio = isPortrait ? (baseWidth / baseHeight) : ((baseWidth * 2) / baseHeight);
        var wrapperRatio = ww / wh;
        
        var finalWidth, finalHeight;
        if (wrapperRatio > targetRatio) {
            finalHeight = Math.floor(wh);
            finalWidth = Math.floor(wh * targetRatio);
        } else {
            finalWidth = Math.floor(ww);
            finalHeight = Math.floor(ww / targetRatio);
        }
        
        container.style.width = finalWidth + 'px';
        container.style.height = finalHeight + 'px';
        
        if (pageFlip) {
            pageFlip.update();
        }
    }
    
    window.addEventListener('resize', resizeContainer);
    resizeContainer(); // Set initial perfectly fitting size
    
    // Create DOM elements for pages
    for (var i = 1; i <= totalPages; i++) {
        var div = document.createElement('div');
        div.className = 'page';
        div.id = 'page-' + i;
        div.innerHTML = '<div class="page-loader">Loading...</div>';
        flipbookEl.appendChild(div);
    }
    
    loading.style.display = 'none';
    flipbookEl.style.display = 'block';
    
    // Initialize StPageFlip
    pageFlip = new St.PageFlip(flipbookEl, {
        width: baseWidth,
        height: baseHeight,
        size: "stretch",
        minWidth: 200,
        maxWidth: 4000,
        minHeight: 250,
        maxHeight: 4000,
        showCover: true,
        usePortrait: true, // Allow portrait on mobile
        maxShadowOpacity: 0.5,
        drawShadow: true,
        flippingTime: 700,
    });
    
    pageFlip.loadFromHTML(document.querySelectorAll('.page'));
    
    // Initial render
    preloadAdjacentPages(0);
    updatePageInfo();
    
    pageFlip.on('flip', function(e) {
        updatePageInfo();
        preloadAdjacentPages(e.data);
    });

}).catch(function(err) {
    loading.style.display = 'none';
    errMsg.style.display = 'block';
    
    // Append the exact JS error to the error message for debugging
    var debugInfo = document.createElement('div');
    debugInfo.style.cssText = 'margin-top: 15px; font-family: monospace; font-size: 11px; color: #7f1d1d; background: #fef2f2; padding: 10px; border-radius: 4px; text-align: left; max-width: 400px; word-break: break-all;';
    debugInfo.textContent = 'Debug: ' + (err.message || err.toString());
    if (err.stack) debugInfo.textContent += '\n\nStack:\n' + err.stack;
    errMsg.appendChild(debugInfo);
    
    console.error('PDF load error:', err);
});

// Controls
btnPrev.addEventListener('click', function() { if (pageFlip) pageFlip.flipPrev(); });
btnNext.addEventListener('click', function() { if (pageFlip) pageFlip.flipNext(); });

document.addEventListener('keydown', function(e) {
    if (!pageFlip) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') pageFlip.flipNext();
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   pageFlip.flipPrev();
});
</script>
</body>
</html>
