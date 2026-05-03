<?php
/**
 * ShelfSage Inline PDF Viewer
 * Loaded inside an iframe on mobile for Look Inside feature.
 * Uses PDF.js (CDN) to render PDFs natively in the browser.
 */
if ( empty( $_GET['file'] ) ) { exit; }

// Standalone file — no WordPress. Use native PHP only.
$raw = stripslashes( (string) $_GET['file'] );
$url = filter_var( $raw, FILTER_VALIDATE_URL ) ? $raw : '';
if ( empty( $url ) || ! preg_match( '#^https?://#i', $url ) ) { exit; }

// Optional nonce check (add trsss_pdf_view nonce to the URL if you want auth)
header( 'Content-Type: text/html; charset=utf-8' );
header( 'X-Frame-Options: SAMEORIGIN' );
?><!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3, user-scalable=yes">
<title>Book Preview</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#404040;overflow:hidden}
#toolbar{position:sticky;top:0;z-index:20;display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:rgba(15,15,15,.92);color:#f3f4f6;font-size:13px;gap:8px;user-select:none}
#toolbar button{background:rgba(255,255,255,.12);border:none;color:#fff;border-radius:6px;padding:5px 12px;cursor:pointer;font-size:13px;font-weight:600;transition:background .15s}
#toolbar button:disabled{opacity:.4;cursor:default}
#toolbar button:hover:not(:disabled){background:rgba(255,255,255,.22)}
#page-info{flex:1;text-align:center;font-size:12px;opacity:.85}
#viewer{height:calc(100vh - 45px);overflow-y:auto;overflow-x:auto;display:flex;flex-direction:column;align-items:center;gap:12px;padding:12px 8px}
canvas{display:block;box-shadow:0 4px 20px rgba(0,0,0,.6);border-radius:3px;max-width:100%}
#loading{color:#e5e7eb;font-size:14px;padding:40px;text-align:center}
#error-msg{color:#fca5a5;font-size:14px;padding:40px;text-align:center;display:none}
</style>
</head>
<body>
<div id="toolbar">
    <button id="btn-prev" disabled>&#8249; Prev</button>
    <span id="page-info">Loading...</span>
    <button id="btn-next" disabled>Next &#8250;</button>
</div>
<div id="viewer">
    <p id="loading">⏳ Loading PDF...</p>
    <p id="error-msg">❌ Could not load PDF. <a href="<?php echo htmlspecialchars( $url, ENT_QUOTES, 'UTF-8' ); ?>" target="_blank" style="color:#93c5fd">Download instead</a></p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" crossorigin="anonymous"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

var pdfDoc  = null;
var curPage = 1;
var totalPages = 0;
var rendering = false;
var pdfUrl  = <?php echo json_encode( $url, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT ); ?>;

var viewer  = document.getElementById('viewer');
var loading = document.getElementById('loading');
var errMsg  = document.getElementById('error-msg');
var pageInfo = document.getElementById('page-info');
var btnPrev = document.getElementById('btn-prev');
var btnNext = document.getElementById('btn-next');

// Scale based on device width
function getScale() {
    var w = window.innerWidth;
    if (w < 400) return 0.85;
    if (w < 600) return 1.0;
    return 1.4;
}

function renderPage(num) {
    if (rendering) return;
    rendering = true;
    btnPrev.disabled = true;
    btnNext.disabled = true;

    pdfDoc.getPage(num).then(function(page) {
        var scale    = getScale();
        var viewport = page.getViewport({ scale: scale });
        var canvas   = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width  = viewport.width;
        var ctx = canvas.getContext('2d');
        viewer.innerHTML = '';
        viewer.appendChild(canvas);
        viewer.scrollTop = 0;

        return page.render({ canvasContext: ctx, viewport: viewport }).promise;
    }).then(function() {
        rendering = false;
        pageInfo.textContent = 'Page ' + curPage + ' / ' + totalPages;
        btnPrev.disabled = curPage <= 1;
        btnNext.disabled = curPage >= totalPages;
    }).catch(function() {
        rendering = false;
    });
}

pdfjsLib.getDocument({ url: pdfUrl, cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/', cMapPacked: true }).promise.then(function(pdf) {
    pdfDoc     = pdf;
    totalPages = pdf.numPages;
    loading.style.display = 'none';
    renderPage(curPage);
}).catch(function(err) {
    loading.style.display = 'none';
    errMsg.style.display = 'block';
    console.error('PDF load error:', err);
});

btnPrev.addEventListener('click', function() {
    if (curPage > 1) { curPage--; renderPage(curPage); }
});
btnNext.addEventListener('click', function() {
    if (curPage < totalPages) { curPage++; renderPage(curPage); }
});

// Keyboard nav
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (curPage < totalPages) { curPage++; renderPage(curPage); } }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { if (curPage > 1) { curPage--; renderPage(curPage); } }
});

// Re-render on orientation change
window.addEventListener('resize', function() {
    if (pdfDoc) renderPage(curPage);
});
</script>
</body>
</html>
