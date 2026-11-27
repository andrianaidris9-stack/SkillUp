
/* =====================================================
   DETAIL PELATIHAN SKILLUP
   Khusus halaman publik.
   Data berasal dari sumber data pelatihan bersama.
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    "use strict";

    // =========================================
    // 1. MENGAMBIL ID PELATIHAN DARI URL
    // =========================================

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const sumber = window.SkillUpPelatihan;
    const api = window.SkillUpAPI;

    const detailContent = document.getElementById("detailContent");
    const detailError = document.getElementById("detailError");

    // =========================================
    // 2. MENAMPILKAN PESAN KESALAHAN
    // =========================================

    function tampilkanError(pesan) {
        if (detailContent) {
            detailContent.hidden = true;
        }

        if (detailError) {
            detailError.textContent = pesan;
            detailError.hidden = false;
        }
    }

    // =========================================
    // 3. MENGISI ELEMEN HTML
    // =========================================

    function isi(idElemen, value) {
        const element = document.getElementById(idElemen);

        if (!element) return;

        if (value === 0) {
            element.textContent = "0";
            return;
        }

        element.textContent = value || "-";
    }

    // =========================================
    // 4. FORMAT TINGKAT PELATIHAN
    // =========================================

    function formatTingkat(tingkat) {
        const nilai = String(tingkat ?? "")
            .trim()
            .toLowerCase();

        const peta = {
            beginner: "Pemula",
            pemula: "Pemula",
            intermediate: "Menengah",
            menengah: "Menengah",
            advanced: "Mahir",
            mahir: "Mahir",
            lanjutan: "Mahir"
        };

        return peta[nilai] || tingkat || "-";
    }

    // =========================================
    // 5. FORMAT STATUS PELATIHAN
    // =========================================

    function formatStatus(status) {
        const nilai = String(status ?? "")
            .trim()
            .toLowerCase();

        if (
            ["published", "publish", "dipublikasikan", "terbit", "aktif", "active"]
                .includes(nilai)
        ) {
            return "Dipublikasikan";
        }

        if (["draft", "draf"].includes(nilai)) {
            return "Draf";
        }

        if (["inactive", "nonaktif"].includes(nilai)) {
            return "Nonaktif";
        }

        return status || "-";
    }

    // =========================================
    // 6. FORMAT HARGA PELATIHAN
    // =========================================

    function formatHarga(item) {
        const raw = item?.harga ?? item?.fee ?? item?.biaya;

        if (raw === null || raw === undefined || raw === "") {
            return "-";
        }

        const angka = Number(
            String(raw).replace(/[^0-9.-]+/g, "")
        );

        if (Number.isNaN(angka)) {
            return String(raw);
        }

        if (angka <= 0) {
            return "Gratis (Rp 0)";
        }

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(angka);
    }

    // =========================================
    // 7. FORMAT DURASI PELATIHAN
    // =========================================

    function formatDurasi(item) {
        const raw = item?.durasi ?? item?.duration_hours;

        if (raw === null || raw === undefined || raw === "") {
            return "-";
        }

        if (
            typeof raw === "number" ||
            /^\d+$/.test(String(raw).trim())
        ) {
            return `${String(raw).trim()} Jam`;
        }

        return String(raw);
    }

    // =========================================
    // 8. FORMAT TANGGAL
    // =========================================

    function formatTanggal(value) {
        if (!value) return "-";

        const str = String(value).trim();

        const tanggal = /^\d{4}-\d{2}-\d{2}$/.test(str)
            ? new Date(str + "T00:00:00")
            : new Date(str);

        if (Number.isNaN(tanggal.getTime())) {
            return str;
        }

        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(tanggal);
    }

    // =========================================
    // 9. VALIDASI ID DAN SUMBER DATA
    // =========================================

    if (!id) {
        tampilkanError("ID pelatihan tidak ditemukan.");
        return;
    }

    if (
        !sumber ||
        typeof sumber.ambilById !== "function"
    ) {
        tampilkanError("Sumber data pelatihan tidak tersedia.");
        return;
    }

    // =========================================
    // 10. MENGAMBIL DATA PELATIHAN
    // =========================================

    let data;

    try {
        data = await sumber.ambilById(id);
    } catch (error) {
        console.error("Gagal mengambil detail pelatihan:", error);

        tampilkanError(
            "Terjadi kesalahan saat memuat informasi pelatihan."
        );

        return;
    }

    if (!data || typeof data !== "object") {
        tampilkanError("Informasi pelatihan tidak ditemukan.");
        return;
    }

    // =========================================
    // 11. MENYIAPKAN DATA PELATIHAN
    // =========================================

    const judul = data.judul ?? data.title;

    const kategori =
        data.kategori ??
        data.category_name ??
        data.category_code;

    const deskripsi =
        data.deskripsi ??
        data.description;

    const tingkat =
        data.tingkat ??
        data.level;

    const instruktur =
        data.instruktur ??
        data.instructor;

    const tanggalMulai =
        data.tanggalMulai ??
        data.start_date;

    const tanggalSelesai =
        data.tanggalSelesai ??
        data.end_date;

    const statusTeks = formatStatus(data.status);

    // =========================================
    // 12. MENAMPILKAN GAMBAR PELATIHAN
    // =========================================

    const image = document.getElementById("courseImage");
    const imageWrapper = image?.closest(".detail-image");

    let coverSrc =
        data.thumbnail ||
        data.gambar ||
        data.cover_image ||
        "";

    if (
        coverSrc &&
        api &&
        typeof api.assetUrl === "function"
    ) {
        coverSrc = api.assetUrl(coverSrc);
    }

    if (image) {
        if (coverSrc) {
            image.src = coverSrc;
            image.alt = judul
                ? "Gambar " + judul
                : "Gambar pelatihan";

            image.onerror = function () {
                if (imageWrapper) {
                    imageWrapper.hidden = true;
                } else {
                    image.hidden = true;
                }
            };
        } else if (imageWrapper) {
            imageWrapper.hidden = true;
        }
    }

    // =========================================
    // 13. MENAMPILKAN INFORMASI PELATIHAN
    // =========================================

    isi("courseCategory", kategori);
    isi("courseTitle", judul);
    isi("courseDescription", deskripsi);
    isi("courseLevel", formatTingkat(tingkat));
    isi("courseDuration", formatDurasi(data));
    isi("coursePrice", formatHarga(data));
    isi("courseInstructor", instruktur);
    isi("courseStart", formatTanggal(tanggalMulai));
    isi("courseEnd", formatTanggal(tanggalSelesai));
    isi("courseStatus", statusTeks);

    // =========================================
    // 14. JUDUL TAB BROWSER
    // =========================================

    if (judul) {
        document.title = `${judul} | SkillUp`;
    }
});
