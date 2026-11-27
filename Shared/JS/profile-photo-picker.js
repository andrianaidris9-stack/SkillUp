/* Pemilih foto bersama untuk Edit Profil Peserta dan Admin. */
(function () {
    "use strict";

    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("[data-photo-picker]").forEach(pasangPemilihFoto);
    });

    function pasangPemilihFoto(tombol) {
        const admin = tombol.id === "choosePhotoButton";
        const inputGaleri = document.getElementById(admin ? "adminPhotoInput" : "photoInput");
        const host = tombol.parentElement;
        if (!inputGaleri || !host) return;

        host.classList.add("photo-picker-host");
        inputGaleri.hidden = true;
        inputGaleri.tabIndex = -1;

        const inputKamera = document.createElement("input");
        inputKamera.type = "file";
        inputKamera.accept = "image/jpeg,image/png";
        inputKamera.setAttribute("capture", "user");
        inputKamera.hidden = true;
        inputKamera.tabIndex = -1;
        host.appendChild(inputKamera);

        const menu = document.createElement("div");
        menu.className = "photo-picker-menu";
        menu.setAttribute("role", "menu");
        menu.innerHTML = `
            <button type="button" role="menuitem" data-action="camera">📷 <span>Ambil Foto</span></button>
            <button type="button" role="menuitem" data-action="gallery">🖼️ <span>Pilih dari Galeri</span></button>
            <button type="button" role="menuitem" data-action="view">🔍 <span>Lihat Foto</span></button>
            <button type="button" role="menuitem" data-action="remove">🗑️ <span>Hapus Foto</span></button>`;
        host.appendChild(menu);

        function fotoAktif() {
            const img = admin ? document.getElementById("adminPhoto") : document.querySelector("#initial img");
            return img && img.getAttribute("src") ? img.src : "";
        }

        function tutupMenu() {
            menu.classList.remove("is-open");
            tombol.setAttribute("aria-expanded", "false");
        }

        function bukaViewer(src) {
            let overlay = document.querySelector(".profile-photo-viewer");
            if (!overlay) {
                overlay = document.createElement("div");
                overlay.className = "profile-photo-viewer";
                overlay.innerHTML = `<div class="profile-photo-viewer-card" role="dialog" aria-modal="true" aria-label="Foto profil ukuran besar"><button type="button" class="profile-photo-viewer-close" aria-label="Tutup">×</button><img alt="Foto profil ukuran besar"></div>`;
                document.body.appendChild(overlay);
                overlay.addEventListener("click", function (event) {
                    if (event.target === overlay || event.target.closest(".profile-photo-viewer-close")) overlay.classList.remove("is-open");
                });
            }
            const img = overlay.querySelector("img");
            const noteLama = overlay.querySelector(".profile-photo-viewer-note");
            if (noteLama) noteLama.remove();
            if (src) {
                img.src = src;
                img.hidden = false;
            } else {
                img.removeAttribute("src");
                img.hidden = true;
                const note = document.createElement("p");
                note.className = "profile-photo-viewer-note";
                note.textContent = "Belum ada foto profil yang dipilih.";
                overlay.querySelector(".profile-photo-viewer-card").appendChild(note);
            }
            overlay.classList.add("is-open");
        }

        function teruskanFile(file) {
            if (!file) return;
            try {
                const transfer = new DataTransfer();
                transfer.items.add(file);
                inputGaleri.files = transfer.files;
                inputGaleri.dispatchEvent(new Event("change", { bubbles: true }));
            } catch (error) {
                console.error("Foto dari kamera tidak dapat diteruskan:", error);
                if (window.SkillUpPopup) window.SkillUpPopup.gagal("Foto Tidak Dapat Dibaca", "Silakan pilih foto melalui Galeri.");
                else window.alert("Foto tidak dapat dibaca. Silakan pilih melalui Galeri.");
            }
        }

        async function ambilDariKamera() {
            if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
                if (window.SkillUpPopup) {
                    await window.SkillUpPopup.peringatan(
                        "Kamera Tidak Tersedia",
                        "Akses kamera memerlukan browser yang mendukung kamera dan halaman HTTPS atau localhost. Anda dapat memilih foto melalui Galeri."
                    );
                }
                inputKamera.click();
                return;
            }

            let stream = null;
            let overlay = document.createElement("div");
            overlay.className = "profile-camera-overlay";
            overlay.innerHTML = `
                <section class="profile-camera-dialog" role="dialog" aria-modal="true" aria-label="Ambil foto profil">
                    <header><strong>Ambil Foto Profil</strong><button type="button" data-camera-close aria-label="Tutup">×</button></header>
                    <video autoplay playsinline muted></video>
                    <p class="profile-camera-message">Posisikan wajah atau objek di dalam bingkai, lalu ambil foto.</p>
                    <footer>
                        <button type="button" data-camera-cancel>Batal</button>
                        <button type="button" data-camera-capture>Ambil Foto</button>
                    </footer>
                </section>`;
            document.body.appendChild(overlay);

            const video = overlay.querySelector("video");
            const close = () => {
                if (stream) stream.getTracks().forEach(track => track.stop());
                if (video) video.srcObject = null;
                overlay.remove();
            };
            overlay.addEventListener("click", event => {
                if (event.target === overlay || event.target.closest("[data-camera-close],[data-camera-cancel]")) close();
            });
            overlay.querySelector("[data-camera-capture]").addEventListener("click", () => {
                if (!video.videoWidth || !video.videoHeight) return;
                const canvas = document.createElement("canvas");
                const max = 1600;
                const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight));
                canvas.width = Math.round(video.videoWidth * scale);
                canvas.height = Math.round(video.videoHeight * scale);
                const context = canvas.getContext("2d");
                if (!context) return;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(blob => {
                    if (!blob) {
                        if (window.SkillUpPopup) window.SkillUpPopup.gagal("Foto Gagal Diambil", "Kamera tidak dapat memproses gambar. Coba kembali.");
                        return;
                    }
                    const file = new File([blob], "foto-kamera.jpg", { type: "image/jpeg" });
                    teruskanFile(file);
                    close();
                }, "image/jpeg", 0.88);
            });

            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: false,
                    video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 1280 } }
                });
                video.srcObject = stream;
                await video.play();
            } catch (error) {
                close();
                const pesan = error && error.name === "NotAllowedError"
                    ? "Izin kamera ditolak. Izinkan akses kamera pada pengaturan browser, atau pilih foto melalui Galeri."
                    : "Kamera tidak dapat dibuka pada perangkat ini. Silakan pilih foto melalui Galeri.";
                if (window.SkillUpPopup) await window.SkillUpPopup.peringatan("Tidak Dapat Mengakses Kamera", pesan);
                else window.alert(pesan);
            }
        }

        tombol.addEventListener("click", async function (event) {
            event.preventDefault();
            event.stopImmediatePropagation();
            menu.classList.toggle("is-open");
            tombol.setAttribute("aria-expanded", menu.classList.contains("is-open") ? "true" : "false");
        }, true);

        menu.addEventListener("click", async function (event) {
            const aksi = event.target.closest("button[data-action]");
            if (!aksi) return;
            const jenis = aksi.dataset.action;
            tutupMenu();

            if (jenis === "camera") await ambilDariKamera();
            if (jenis === "gallery") inputGaleri.click();
            if (jenis === "view") bukaViewer(fotoAktif());
            if (jenis === "remove") {
                if (!fotoAktif()) {
                    if (window.SkillUpPopup) window.SkillUpPopup.informasi("Foto Belum Tersedia", "Belum ada foto profil yang dapat dihapus.");
                    else window.alert("Belum ada foto profil yang dapat dihapus.");
                    return;
                }
                let yakin = false;
                if (window.SkillUpPopup && typeof window.SkillUpPopup.konfirmasi === "function") {
                    yakin = await window.SkillUpPopup.konfirmasi("Hapus Foto Profil?", "Foto profil akan dihapus dan diganti dengan avatar bawaan.");
                } else {
                    yakin = window.confirm("Hapus foto profil saat ini?");
                }
                if (!yakin) return;
                inputGaleri.value = "";
                tombol.dispatchEvent(new CustomEvent("skillup:photo-remove", { bubbles: true }));
            }
        });

        inputKamera.addEventListener("change", function () {
            teruskanFile(inputKamera.files && inputKamera.files[0]);
            inputKamera.value = "";
        });

        document.addEventListener("click", function (event) {
            if (!host.contains(event.target)) tutupMenu();
        });
        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
                tutupMenu();
                const viewer = document.querySelector(".profile-photo-viewer.is-open");
                if (viewer) viewer.classList.remove("is-open");
            }
        });
    }
})();
