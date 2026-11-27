/* Penampil foto profil ukuran besar pada halaman profil baca-saja. */
document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-photo-viewer]").forEach(function (area) {
        area.setAttribute("aria-haspopup", "dialog");
        function buka() {
            const image = area.querySelector("img") || area.querySelector(".initial img");
            const src = image && image.getAttribute("src") ? image.src : "";
            let overlay = document.querySelector(".profile-photo-viewer");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "profile-photo-viewer";
                overlay.innerHTML = '<div class="profile-photo-viewer-card" role="dialog" aria-modal="true" aria-label="Foto profil ukuran besar"><button type="button" class="profile-photo-viewer-close" aria-label="Tutup">×</button><img alt="Foto profil ukuran besar"><p class="profile-photo-viewer-note">Belum ada foto profil.</p></div>';
                document.body.appendChild(overlay);
                overlay.addEventListener("click", function (event) {
                    if (event.target === overlay || event.target.closest(".profile-photo-viewer-close")) overlay.classList.remove("is-open");
                });
            }
            const img = overlay.querySelector("img");
            const note = overlay.querySelector(".profile-photo-viewer-note");
            img.hidden = !src;
            note.hidden = Boolean(src);
            if (src) img.src = src;
            overlay.classList.add("is-open");
        }
        area.addEventListener("click", buka);
        area.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") { event.preventDefault(); buka(); }
        });
    });
    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") document.querySelectorAll(".profile-photo-viewer.is-open").forEach(el => el.classList.remove("is-open"));
    });
});
