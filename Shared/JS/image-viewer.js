/* Klik gambar sampul untuk melihat ukuran besar. */
(function () {
    "use strict";
    document.addEventListener("DOMContentLoaded", function () {
        let overlay;
        function openViewer(src, alt) {
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "skillup-image-viewer";
                overlay.innerHTML = '<div class="skillup-image-viewer-card" role="dialog" aria-modal="true"><button type="button" aria-label="Tutup">×</button><img alt=""></div>';
                document.body.appendChild(overlay);
                overlay.addEventListener("click", function (event) {
                    if (event.target === overlay || event.target.tagName === "BUTTON") overlay.classList.remove("open");
                });
            }
            const img = overlay.querySelector("img"); img.src = src; img.alt = alt || "Gambar"; overlay.classList.add("open");
        }
        document.addEventListener("click", function (event) {
            const img = event.target.closest("img[data-image-viewer]");
            if (img && img.src && !img.hidden) openViewer(img.src, img.alt);
        });
        document.addEventListener("keydown", function (event) { if (event.key === "Escape" && overlay) overlay.classList.remove("open"); });
    });
})();
