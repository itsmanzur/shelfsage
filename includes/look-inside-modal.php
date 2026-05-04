<?php
/**
 * ShelfSage – Look Inside Modal
 * Outputs modal HTML + JS directly (no wp_footer hook).
 * Must be called inside the template body, after $look_inside_url is set.
 *
 * Required scope variables (inherited from the including template):
 *   $look_inside_url  – string
 *   $product          – WC_Product
 *   $product_id       – int
 *   $labels           – array
 *   $authors          – array|WP_Error|false
 */

if ( ! defined( 'ABSPATH' ) ) exit;
if ( empty( $look_inside_url ) ) return;

$ss            = trsss_get_shelfsage_settings_array();
$reader_style  = isset( $ss['pdf_reader_style'] ) ? sanitize_text_field( $ss['pdf_reader_style'] ) : 'style-1';

$modal_title   = ( isset( $product ) && is_a( $product, 'WC_Product' ) ) ? esc_js( $product->get_name() ) : '';
$modal_thumb   = esc_url( get_the_post_thumbnail_url( isset( $product_id ) ? $product_id : get_the_ID(), 'medium' ) ?: '' );
$modal_authors = ( ! empty( $authors ) && ! is_wp_error( $authors ) )
    ? esc_js( implode( ', ', wp_list_pluck( $authors, 'name' ) ) )
    : '';
$label_li      = isset( $labels ) ? esc_html( rmss_get_label( 'look_inside', 'Look Inside', $labels ) ) : 'Look Inside';
?>
<style id="rmss-li-css">
@keyframes rmss-li-spin { to { transform: rotate(360deg); } }
#rmss-li-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 2147483640;
    background: rgba(0,0,0,0.82);
    backdrop-filter: blur(5px);
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity .28s ease;
}
#rmss-li-backdrop.rmss-open   { display: flex; }
#rmss-li-backdrop.rmss-visible { opacity: 1; }
#rmss-li-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255,255,255,.9);
    z-index: 5;
}
#rmss-li-loader span {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 3px solid #e5e7eb;
    border-top-color: #2563eb;
    animation: rmss-li-spin .8s linear infinite;
    display: block;
}
@media (max-width: 768px) {
    #rmss-li-backdrop {
        align-items: stretch;
        justify-content: stretch;
        padding: 0;
    }
    #rmss-li-backdrop > div {
        width: 100vw !important;
        height: 100dvh !important;
        max-width: none !important;
        border-radius: 0 !important;
    }
    #rmss-li-frame {
        width: 100% !important;
        height: 100% !important;
    }
}
</style>

<?php if ( $reader_style === 'style-2' ) : ?>
<!-- Look Inside Modal: Style 2 – Dark Fullscreen -->
<div id="rmss-li-backdrop">
    <button id="rmss-li-close-btn" title="Close" style="position:absolute;top:16px;right:16px;z-index:10;background:rgba(255,255,255,.15);border:none;border-radius:50%;width:40px;height:40px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;line-height:1;">&#10005;</button>
    <?php if ( $modal_title ) : ?>
    <div style="position:absolute;top:18px;left:50%;transform:translateX(-50%);background:rgba(255,255,255,.1);border-radius:9999px;padding:4px 16px;font-size:13px;color:#e5e7eb;white-space:nowrap;max-width:60%;overflow:hidden;text-overflow:ellipsis;"><?php echo esc_html( $product->get_name() ); ?></div>
    <?php endif; ?>
    <div style="position:relative;width:95vw;height:95vh;background:#0a0a0a;overflow:hidden;">
        <div id="rmss-li-loader"><span></span></div>
        <iframe id="rmss-li-frame" src="" allowfullscreen style="width:100%;height:100%;border:none;display:block;"></iframe>
    </div>
</div>

<?php elseif ( $reader_style === 'style-3' ) : ?>
<!-- Look Inside Modal: Style 3 – Split View -->
<div id="rmss-li-backdrop">
    <div style="display:flex;width:94%;height:90%;max-width:1300px;border-radius:16px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,.6);">
        <div style="width:240px;flex-shrink:0;background:linear-gradient(160deg,#1e293b,#0f172a);display:flex;flex-direction:column;align-items:center;padding:28px 20px;color:#fff;gap:16px;">
            <?php if ( $modal_thumb ) : ?>
            <img src="<?php echo esc_url( $modal_thumb ); ?>" alt="<?php echo esc_attr( $product->get_name() ); ?>" style="width:140px;border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,.5);">
            <?php endif; ?>
            <div style="text-align:center;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#f1f5f9;line-height:1.3;"><?php echo esc_html( $product->get_name() ); ?></p>
                <?php if ( $modal_authors ) : ?>
                <p style="margin:0;font-size:12px;color:#94a3b8;"><?php echo esc_html( implode( ', ', wp_list_pluck( $authors, 'name' ) ) ); ?></p>
                <?php endif; ?>
            </div>
            <div style="margin-top:auto;width:100%;border-top:1px solid rgba(255,255,255,.1);padding-top:14px;">
                <button id="rmss-li-close-btn" style="width:100%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#cbd5e1;border-radius:8px;padding:8px;cursor:pointer;font-size:13px;font-weight:600;">&#10005; Close</button>
            </div>
        </div>
        <div style="flex:1;position:relative;background:#f3f4f6;overflow:hidden;">
            <div id="rmss-li-loader"><span></span></div>
            <iframe id="rmss-li-frame" src="" allowfullscreen style="width:100%;height:100%;border:none;display:block;"></iframe>
        </div>
    </div>
</div>

<?php else : ?>
<!-- Look Inside Modal: Style 1 – White Card (default) -->
<div id="rmss-li-backdrop">
    <div style="position:relative;background:#fff;width:92%;height:92%;max-width:1200px;border-radius:14px;display:flex;flex-direction:column;box-shadow:0 25px 60px rgba(0,0,0,.5);overflow:hidden;">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 20px;border-bottom:1px solid #e5e7eb;background:#f9fafb;flex-shrink:0;">
            <h3 style="margin:0;font-size:16px;font-weight:600;color:#1f2937;display:flex;align-items:center;gap:8px;">
                <svg width="18" height="18" fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                <?php echo $label_li; echo $modal_title ? ': ' . esc_html( $product->get_name() ) : ''; ?>
            </h3>
            <button id="rmss-li-close-btn" title="Close" style="background:none;border:none;cursor:pointer;padding:8px;border-radius:50%;color:#6b7280;font-size:20px;line-height:1;display:flex;align-items:center;justify-content:center;">&#10005;</button>
        </div>
        <div style="flex:1;position:relative;background:#f3f4f6;overflow:hidden;">
            <div id="rmss-li-loader"><span></span></div>
            <iframe id="rmss-li-frame" src="" allowfullscreen style="width:100%;height:100%;border:none;display:block;"></iframe>
        </div>
    </div>
</div>
<?php endif; ?>

<script>
(function () {
    var url     = <?php echo wp_json_encode( $look_inside_url ); ?>;
    var trigger = document.getElementById('rmss-look-inside-trigger');
    var backdrop = document.getElementById('rmss-li-backdrop');
    var closeBtn = document.getElementById('rmss-li-close-btn');
    var frame    = document.getElementById('rmss-li-frame');
    var loader   = document.getElementById('rmss-li-loader');

    if (!trigger || !backdrop) return;

    function isMobileDevice() {
        // Broad detection: touch device OR small screen OR mobile UA
        var ua = navigator.userAgent || '';
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true;
        if (navigator.maxTouchPoints > 1) return true; // includes iPadOS on desktop UA
        if (window.innerWidth <= 768) return true;
        return false;
    }

    function isImage(u) {
        return /\.(jpe?g|jpg|gif|png|webp|avif)(\?|$)/i.test(u);
    }

    /**
     * On mobile, iframes cannot render PDFs natively.
     * Route all non-image URLs through our PDF.js viewer.
     */
    var _pdfViewerBase = <?php echo wp_json_encode( TRSSS_URL . 'includes/pdf-viewer.php' ); ?>;
    var _pdfNonce = <?php echo wp_json_encode( wp_create_nonce( 'trsss_pdf_view' ) ); ?>;

    function getViewerUrl(rawUrl) {
        if (!isImage(rawUrl) && isMobileDevice()) {
            return _pdfViewerBase
                + '?file='  + encodeURIComponent(rawUrl)
                + '&nonce=' + encodeURIComponent(_pdfNonce);
        }
        return rawUrl;
    }


    function openModal() {
        if (!url) return;
        document.body.style.overflow = 'hidden';
        backdrop.classList.add('rmss-open');
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                backdrop.classList.add('rmss-visible');
            });
        });
        if (loader) loader.style.display = 'flex';
        var isImageFile = isImage(url);
        if (isImageFile) {
            // Show image directly in the viewer area
            var imgEl = document.createElement('img');
            imgEl.src = url;
            imgEl.alt = 'Book Preview';
            imgEl.style.cssText = 'max-width:100%;max-height:100%;object-fit:contain;display:block;margin:auto;';
            imgEl.onload = function () { if (loader) loader.style.display = 'none'; };
            var viewerDiv = frame ? frame.parentNode : backdrop;
            if (frame) { frame.style.display = 'none'; viewerDiv.appendChild(imgEl); }
        } else if (frame) {
            frame.onload = function () { if (loader) loader.style.display = 'none'; };
            frame.src = getViewerUrl(url);
        }
    }

    function closeModal() {
        backdrop.classList.remove('rmss-visible');
        setTimeout(function () {
            backdrop.classList.remove('rmss-open');
            if (frame) { frame.src = ''; frame.style.display = 'block'; }
            // Remove any dynamically added img elements
            var dynImg = backdrop.querySelector('img[alt="Book Preview"]');
            if (dynImg) dynImg.parentNode.removeChild(dynImg);
            document.body.style.overflow = '';
        }, 280);
    }

    trigger.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && backdrop.classList.contains('rmss-open')) closeModal();
    });

    window.rmssLiClose = closeModal;
}());
</script>
<?php
