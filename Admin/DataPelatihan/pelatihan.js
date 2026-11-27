document.addEventListener("DOMContentLoaded", async function () {

    // =========================================
    // 1. ELEMEN HTML
    // =========================================

    const tableBody = document.getElementById("trainingTable");
    const searchInput = document.getElementById("searchInput");
    const emptyMessage = document.getElementById("emptyMessage");

    // =========================================
    // 2. VARIABEL
    // =========================================

    let allTrainings = [];

    const sumber = window.SkillUpPelatihan;
    const popup = window.SkillUpPopup;

    // =========================================
    // 3. MENGAMANKAN TEKS HTML
    // =========================================

    function escapeHtml(text) {
        return String(text ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // =========================================
    // 4. STATUS PELATIHAN
    // =========================================

    function getStatus(status) {
        const value = String(status || "")
            .trim()
            .toLowerCase();

        if (
            ["published", "publish", "aktif", "active", "terbit"]
                .includes(value)
        ) {
            return {
                label: "Dipublikasikan",
                className: "status-published"
            };
        }

        if (["draft", "draf"].includes(value)) {
            return {
                label: "Draf",
                className: "status-draft"
            };
        }

        return {
            label: "Nonaktif",
            className: "status-inactive"
        };
    }

    // =========================================
    // 5. MENAMPILKAN TABEL PELATIHAN
    // =========================================

    function renderTable(items) {
        if (!tableBody) return;

        tableBody.innerHTML = "";

        if (!Array.isArray(items) || items.length === 0) {
            if (emptyMessage) {
                emptyMessage.textContent =
                    "Pelatihan tidak ditemukan.";

                emptyMessage.hidden = false;
            }

            return;
        }

        if (emptyMessage) {
            emptyMessage.hidden = true;
        }

        items.forEach((item, index) => {
            const tr = document.createElement("tr");
            const status = getStatus(item.status);

            const image =
                item.thumbnail ||
                item.gambar ||
                "../../Assets/img/logo-skillup.png";

            tr.innerHTML = `
                <td>${index + 1}</td>

                <td>
                    <img
                        src="${escapeHtml(image)}"
                        alt="${escapeHtml(item.judul)}"
                        class="training-thumbnail"
                        style="width:64px;height:44px;object-fit:cover;"
                    >
                </td>

                <td>${escapeHtml(item.judul || "-")}</td>

                <td>${escapeHtml(item.kategori || "-")}</td>

                <td>${escapeHtml(item.tingkat || "-")}</td>

                <td>
                    <span class="status-badge ${status.className}">
                        ${status.label}
                    </span>
                </td>

                <td>
                    <a
                        href="../DetailPelatihan/detail.html?id=${encodeURIComponent(String(item.id ?? ""))}"
                        class="btn-detail"
                    >
                        Detail
                    </a>

                    <a
                        href="../EditPelatihan/edit.html?id=${encodeURIComponent(String(item.id ?? ""))}"
                        class="btn-edit"
                    >
                        Edit
                    </a>

                    <button
                        type="button"
                        class="btn-delete"
                        data-id="${escapeHtml(item.id)}"
                    >
                        Hapus
                    </button>
                </td>
            `;

            tableBody.appendChild(tr);
        });
    }

    // =========================================
    // 6. MEMUAT DATA PELATIHAN
    // =========================================

    async function loadTrainings() {
        try {
            if (
                !sumber ||
                typeof sumber.ambilSemua !== "function"
            ) {
                throw new Error(
                    "Sumber data pelatihan tidak tersedia."
                );
            }

            const data = await sumber.ambilSemua();

            if (!Array.isArray(data)) {
                throw new Error(
                    "Data pelatihan tidak berbentuk daftar."
                );
            }

            allTrainings = data;

            renderTable(allTrainings);

        } catch (error) {
            console.error(
                "Gagal memuat data pelatihan:",
                error
            );

            if (emptyMessage) {
                emptyMessage.textContent =
                    "Gagal memuat data pelatihan.";

                emptyMessage.hidden = false;
            }
        }
    }

    // =========================================
    // 7. MENGHAPUS DATA PELATIHAN
    // MENGGUNAKAN POPUP BAWAAN SKILLUP
    // =========================================

    async function hapusPelatihan(id) {

        if (!id) return;

        // Pastikan popup SkillUp tersedia.
        if (
            !popup ||
            typeof popup.konfirmasi !== "function"
        ) {
            console.error(
                "Popup konfirmasi SkillUp tidak tersedia."
            );

            return;
        }

        // Cari data pelatihan berdasarkan ID.
        const data = allTrainings.find(
            item => String(item.id) === String(id)
        );

        if (!data) {
            popup.informasi(
                "Data Tidak Ditemukan",
                "Data pelatihan tidak ditemukan. Daftar akan dimuat ulang."
            );

            await loadTrainings();

            return;
        }

        // Tampilkan popup konfirmasi bawaan SkillUp.
        let setuju;

        try {
            setuju = await popup.konfirmasi(
                "Hapus Pelatihan?",
                `Apakah Anda yakin ingin menghapus pelatihan "${data.judul || "ini"}"? Data yang dihapus tidak dapat dikembalikan.`
            );

        } catch (error) {
            console.error(
                "Gagal menampilkan konfirmasi:",
                error
            );

            return;
        }

        // Jika pengguna memilih Batal, hentikan proses.
        if (!setuju) return;

        // =====================================
        // PROSES PENGHAPUSAN MELALUI API
        // =====================================

        try {
            if (
                !sumber ||
                typeof sumber.hapus !== "function"
            ) {
                throw new Error(
                    "Fungsi penghapusan data tidak tersedia."
                );
            }

            // Tetap gunakan API SkillUp yang sudah ada.
            await sumber.hapus(id);

            // Muat ulang data setelah berhasil dihapus.
            await loadTrainings();

            // Tampilkan popup sukses bawaan SkillUp.
            popup.sukses(
                "Pelatihan Dihapus",
                "Data pelatihan berhasil dihapus."
            );

        } catch (error) {
            console.error(
                "Gagal menghapus data pelatihan:",
                error
            );

            // Tampilkan popup gagal bawaan SkillUp.
            popup.gagal(
                "Penghapusan Gagal",
                "Data pelatihan gagal dihapus. " +
                (error.message || "Silakan coba kembali.")
            );
        }
    }

    // =========================================
    // 8. EVENT TOMBOL HAPUS PADA TABEL
    // =========================================

    if (tableBody) {
        tableBody.addEventListener("click", function (event) {

            const deleteButton =
                event.target.closest(".btn-delete");

            if (!deleteButton) return;

            const id = deleteButton.dataset.id;

            hapusPelatihan(id);
        });
    }

    // =========================================
    // 9. FITUR PENCARIAN PELATIHAN
    // =========================================

    if (searchInput) {
        searchInput.addEventListener("input", function () {

            const keyword = searchInput.value
                .trim()
                .toLowerCase();

            if (!keyword) {
                renderTable(allTrainings);
                return;
            }

            const filtered = allTrainings.filter(item => {
                return (
                    String(item.judul || "")
                        .toLowerCase()
                        .includes(keyword) ||

                    String(item.kategori || "")
                        .toLowerCase()
                        .includes(keyword) ||

                    String(item.tingkat || "")
                        .toLowerCase()
                        .includes(keyword) ||

                    String(item.status || "")
                        .toLowerCase()
                        .includes(keyword)
                );
            });

            renderTable(filtered);
        });
    }

    // =========================================
    // 10. JALANKAN HALAMAN
    // =========================================

    await loadTrainings();

});
