<?php
/**
 * ShelfSage Inline PDF Viewer — served inside an <iframe> on mobile.
 *
 * Security layers:
 *  1. WordPress is bootstrapped (loads wp-load.php if needed).
 *  2. WP nonce verified (`trsss_pdf_view`).
 *  3. URL must exist as `_rmss_look_inside_url` postmeta in the DB.
 *  4. URL must begin with http/https.
 */

// ── 1. Bootstrap WordPress if not already loaded ──────────────────────────────
if ( ! defined( 'ABSPATH' ) ) {
	// 5 levels up: pdf-viewer.php → includes → shelfsage → plugins → wp-content → WP root
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
global $wpdb;
$exists = (int) $wpdb->get_var(
	$wpdb->prepare(
		"SELECT COUNT(*) FROM {$wpdb->postmeta}
		 WHERE meta_key = '_rmss_look_inside_url'
		   AND meta_value = %s
		 LIMIT 1",
		$url
	)
);
if ( ! $exists ) {
	http_response_code( 403 );
	exit( 'URL not authorized.' );
}

// ── 5. Serve viewer ───────────────────────────────────────────────────────────
header( 'Content-Type: text/html; charset=utf-8' );
header( 'X-Frame-Options: SAMEORIGIN' );
header( 'X-Content-Type-Options: nosniff' );

$safe_url = esc_attr( $url );
$json_url = wp_json_encode( $url );
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
    <p id="loading">&#9203; Loading PDF...</p>
    <p id="error-msg">&#10060; Could not load PDF.
        <a href="<?php echo $safe_url; ?>" target="_blank" rel="noopener noreferrer" style="color:#93c5fd">Download instead</a>
    </p>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" crossorigin="anonymous"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

var pdfDoc = null, curPage = 1, totalPages = 0, rendering = false;
var pdfUrl = <?php echo $json_url; ?>;

var viewer   = document.getElementById('viewer');
var loading  = document.getElementById('loading');
var errMsg   = document.getElementById('error-msg');
var pageInfo = document.getElementById('page-info');
var btnPrev  = document.getElementById('btn-prev');
var btnNext  = document.getElementById('btn-next');

function getScale() {
    var w = window.innerWidth;
    return w < 400 ? 0.85 : w < 600 ? 1.0 : 1.4;
}

function renderPage(num) {
    if (rendering) return;
    rendering = true;
    btnPrev.disabled = btnNext.disabled = true;
    pdfDoc.getPage(num).then(function(page) {
        var vp = page.getViewport({ scale: getScale() });
        var canvas = document.createElement('canvas');
        canvas.height = vp.height; canvas.width = vp.width;
        var ctx = canvas.getContext('2d');
        viewer.innerHTML = '';
        viewer.appendChild(canvas);
        viewer.scrollTop = 0;
        return page.render({ canvasContext: ctx, viewport: vp }).promise;
    }).then(function() {
        rendering = false;
        pageInfo.textContent = 'Page ' + curPage + ' / ' + totalPages;
        btnPrev.disabled = curPage <= 1;
        btnNext.disabled = curPage >= totalPages;
    }).catch(function() { rendering = false; });
}

pdfjsLib.getDocument({
    url: pdfUrl,
    cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
    cMapPacked: true
}).promise.then(function(pdf) {
    pdfDoc = pdf; totalPages = pdf.numPages;
    loading.style.display = 'none';
    renderPage(1);
}).catch(function(err) {
    loading.style.display = 'none';
    errMsg.style.display = 'block';
    console.error('PDF load error:', err);
});

btnPrev.addEventListener('click', function() { if (curPage > 1) renderPage(--curPage); });
btnNext.addEventListener('click', function() { if (curPage < totalPages) renderPage(++curPage); });
document.addEventListener('keydown', function(e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { if (curPage < totalPages) renderPage(++curPage); }
    if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { if (curPage > 1) renderPage(--curPage); }
});
window.addEventListener('resize', function() { if (pdfDoc) renderPage(curPage); });
</script>
</body>
</html>
