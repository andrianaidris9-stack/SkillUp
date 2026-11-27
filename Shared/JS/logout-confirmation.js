/* Komponen konfirmasi logout bersama untuk halaman Admin dan Peserta. */


// POPUP KONFIRMASI KELUAR - SKILLUP ADMIN

(function () {

    function siapkanKonfirmasiLogout() {

        const tombolKeluar = document.getElementById("logoutButton");

        // Pastikan tombol Keluar tersedia.
        if (!tombolKeluar) return;

        // Hindari membuat popup lebih dari satu kali.
        if (document.getElementById("logoutConfirmOverlay")) return;

        // Membuat elemen popup.
        const overlay = document.createElement("div");

        overlay.id = "logoutConfirmOverlay";
        overlay.className = "logout-confirm-overlay";
        overlay.hidden = true;
        overlay.setAttribute("aria-hidden", "true");

        overlay.innerHTML = `
            <div class="logout-confirm-dialog"
                 role="dialog"
                 aria-modal="true"
                 aria-labelledby="logoutConfirmTitle"
                 aria-describedby="logoutConfirmText"
                 tabindex="-1">

                <div class="logout-confirm-icon" aria-hidden="true">
                    <svg viewBox="0 0 24 24"
                         fill="none"
                         stroke="currentColor"
                         stroke-width="1.8"
                         stroke-linecap="round"
                         stroke-linejoin="round">

                        <path d="M10 17l5-5-5-5" />
                        <path d="M15 12H3" />
                        <path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />

                    </svg>
                </div>

                <h2 id="logoutConfirmTitle">
                    Konfirmasi Keluar
                </h2>

                <p id="logoutConfirmText">
                    Apakah kamu yakin ingin keluar dari akun SkillUp?
                </p>

                <div class="logout-confirm-actions">

                    <button type="button"
                            class="logout-cancel-button">
                        Batal
                    </button>

                    <button type="button"
                            class="logout-yes-button">
                        Ya, Keluar
                    </button>

                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Mengambil elemen popup.
        const dialog = overlay.querySelector(".logout-confirm-dialog");
        const tombolBatal = overlay.querySelector(".logout-cancel-button");
        const tombolYa = overlay.querySelector(".logout-yes-button");

        // Menutup popup.
        function tutupPopup() {

            overlay.hidden = true;
            overlay.setAttribute("aria-hidden", "true");

            tombolKeluar.focus();
        }

        // Menampilkan popup.
        function bukaPopup() {

            overlay.hidden = false;
            overlay.setAttribute("aria-hidden", "false");

            dialog.focus();
        }

        // Mencegah navigasi langsung dan menggantikan
        // konfirmasi bawaan browser dengan popup.
        tombolKeluar.addEventListener("click", function (event) {

            event.preventDefault();
            event.stopImmediatePropagation();

            bukaPopup();

        }, true);

        // Tombol Batal.
        tombolBatal.addEventListener("click", function () {

            tutupPopup();

        });

        // Tombol Ya, Keluar.
        tombolYa.addEventListener("click", async function () {

            const tujuanLogin =
                tombolKeluar.getAttribute("href") ||
                tombolKeluar.dataset.logoutUrl;

            tombolYa.disabled = true;
            tombolYa.textContent = "Keluar...";

            try {
                if (window.SkillUpAPI) {
                    await window.SkillUpAPI.post("auth/logout", {});
                }
            } catch (error) {
                console.warn("Sesi server mungkin sudah berakhir:", error.message);
            } finally {
                try { localStorage.removeItem("skillupLoggedIn"); } catch (_) {}
                if (tujuanLogin) window.location.replace(tujuanLogin);
                else window.location.replace(new URL("../../Autentikasi/Login/login.html", document.currentScript?.src || window.location.href).href);
            }

        });

        // Menutup popup jika area gelap diklik.
        overlay.addEventListener("click", function (event) {

            if (event.target === overlay) {
                tutupPopup();
            }

        });

        // Menutup popup menggunakan tombol Escape.
        document.addEventListener("keydown", function (event) {

            if (event.key === "Escape" && !overlay.hidden) {
                tutupPopup();
            }

        });

    }

    // Menjalankan fungsi setelah halaman selesai dimuat.
    if (document.readyState === "loading") {

        document.addEventListener(
            "DOMContentLoaded",
            siapkanKonfirmasiLogout
        );

    } else {

        siapkanKonfirmasiLogout();

    }

})();
