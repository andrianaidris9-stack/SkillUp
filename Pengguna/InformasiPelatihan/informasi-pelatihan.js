/* =====================================================
   KATALOG PELATIHAN - PENCARIAN DAN FILTER
   Data dibaca dari Shared/JS/data-pelatihan.js
===================================================== */
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;
    const container = document.getElementById("catalogCourses");
    const searchInput = document.getElementById("searchCourse");
    const noCourse = document.getElementById("noCourse");
    const categoryFilters = document.querySelectorAll(".category-filter");
    const levelFilters = document.querySelectorAll(".level-filter");
    const showAllButton = document.getElementById("showAllCategories");
    const params = new URLSearchParams(window.location.search);
    const dariPeserta = params.get("sumber") === "peserta";

    if (dariPeserta) {
        let sesi = null;
        try { sesi = (await window.SkillUpAPI.me()).user; } catch (error) {}
        if (!sesi || sesi.role !== "user") {
            window.location.href = "../../Autentikasi/Login/login.html";
            return;
        }
        const logo = document.querySelector(".header .logo");
        const navigasi = document.querySelector(".header .navigation");
        const tombolAkun = document.querySelector(".header .header-buttons");
        const footer = document.querySelector(".site-footer");
        if (logo) logo.href = "../Dashboard/dashboard-peserta.html";
        if (logo) logo.setAttribute("aria-label", "Kembali ke Dashboard Peserta");
        if (navigasi) { navigasi.hidden = true; navigasi.style.display = "none"; }
        if (tombolAkun) { tombolAkun.hidden = true; tombolAkun.style.display = "none"; }
        if (footer) footer.hidden = true;
        const heading = document.querySelector(".catalog-heading p");
        if (heading) heading.textContent = "Lihat program pelatihan yang tersedia tanpa keluar dari akun peserta SkillUp.";

        // Navigasi kontekstual agar peserta selalu tahu cara kembali.
        const catalogHeading = document.querySelector(".catalog-heading");
        const kategoriAwal = params.get("kategori");
        if (catalogHeading && !document.getElementById("participantCatalogBack")) {
            const back = document.createElement("a");
            back.id = "participantCatalogBack";
            back.className = "detail-button";
            back.style.display = "inline-flex";
            back.style.marginTop = "12px";
            back.href = kategoriAwal
                ? "../HasilRekomendasi/hasil-rekomendasi.html"
                : "../Dashboard/dashboard-peserta.html";
            back.textContent = kategoriAwal
                ? "← Kembali ke Hasil Rekomendasi"
                : "← Kembali ke Dashboard";
            catalogHeading.appendChild(back);
        }

        if (kategoriAwal) {
            const judul = document.querySelector(".catalog-heading h1");
            const keterangan = document.querySelector(".catalog-results-heading span");
            if (judul) judul.textContent = "Program Bidang " + kategoriAwal;
            if (keterangan) keterangan.textContent = "Program yang sesuai dengan bidang rekomendasi Anda";
        }
    }

    if (!container || !searchInput || !noCourse) {
        console.error("Elemen katalog pelatihan tidak ditemukan.");
        return;
    }

    const Pelatihan = window.SkillUpPelatihan;
    if (!Pelatihan || typeof Pelatihan.ambilPublikasi !== "function") {
        noCourse.hidden = false;
        noCourse.textContent = "Data pelatihan belum dapat dimuat.";
        console.error("Sumber data SkillUpPelatihan tidak tersedia.");
        return;
    }

    let semuaPelatihan = [];
    try { semuaPelatihan = await Pelatihan.ambilPublikasi(); }
    catch (error) {
        console.error("Gagal mengambil daftar pelatihan:", error);
        noCourse.hidden = false;
        noCourse.textContent = "Data pelatihan belum dapat dimuat. Periksa koneksi server.";
    }

    // Menyamakan format teks agar pencarian tidak peka huruf besar/kecil.
    function normalisasi(value) {
        return String(value || "").trim().toLocaleLowerCase("id-ID");
    }

    // Membuat satu kartu berdasarkan data pelatihan dari sumber bersama.
    function buatKartu(data) {
        const card = document.createElement("article");
        card.className = "catalog-card";
        card.dataset.id = data.id;

        const image = document.createElement("img");
        image.className = "catalog-card-image";
        image.src = data.thumbnail || "";
        image.alt = data.judul || "Gambar pelatihan";
        image.loading = "lazy";
        if (!data.thumbnail) image.hidden = true;
        image.onerror = function () { this.hidden = true; };

        const info = document.createElement("div");
        info.className = "catalog-card-info";

        const category = document.createElement("span");
        category.className = "course-category";
        category.textContent = data.kategori || "Kategori belum tersedia";

        const title = document.createElement("h2");
        title.textContent = data.judul || "Tanpa Judul";

        const description = document.createElement("p");
        description.className = "course-description";
        description.textContent = data.deskripsi || "Deskripsi belum tersedia.";

        const duration = document.createElement("p");
        duration.className = "course-duration";
        duration.textContent = "Durasi: " + (data.durasi || "Belum ditentukan");

        const level = document.createElement("p");
        level.className = "course-level";
        level.textContent = "Tingkat: " + (data.tingkat || "-");

        const detailLink = document.createElement("a");
        detailLink.className = "detail-button";
        const kategoriAktif = params.get("kategori");
        detailLink.href = "../../HalamanUtama/InformasiPelatihan/DetailPelatihan/detail-pelatihan.html?id=" + encodeURIComponent(data.id) +
            (dariPeserta ? "&sumber=peserta" : "") +
            (kategoriAktif ? "&kategori=" + encodeURIComponent(kategoriAktif) : "");
        detailLink.textContent = "Lihat Detail →";

        info.append(category, title, description, duration, level, detailLink);
        card.append(image, info);
        return card;
    }

    // Mengambil nilai semua checkbox yang sedang dipilih.
    function ambilPilihan(elements) {
        return Array.from(elements)
            .filter(element => element.checked)
            .map(element => element.value);
    }

    // Menyaring data publik berdasarkan kata kunci, kategori, dan tingkat.
    function tampilkanPelatihan() {
        if (!Array.isArray(semuaPelatihan)) semuaPelatihan = [];

        const keyword = normalisasi(searchInput.value);
        const kategoriDipilih = ambilPilihan(categoryFilters).map(normalisasi);
        const tingkatDipilih = ambilPilihan(levelFilters).map(normalisasi);

        const hasil = semuaPelatihan.filter(data => {
            const teksCari = [data.judul, data.kategori, data.tingkat, data.deskripsi]
                .map(normalisasi).join(" ");
            const cocokCari = teksCari.includes(keyword);
            const cocokKategori = kategoriDipilih.length === 0 ||
                kategoriDipilih.includes(normalisasi(data.kategori));
            const cocokTingkat = tingkatDipilih.length === 0 ||
                tingkatDipilih.includes(normalisasi(data.tingkat));
            return cocokCari && cocokKategori && cocokTingkat;
        });

        container.querySelectorAll(".catalog-card").forEach(card => card.remove());
        hasil.forEach(data => container.insertBefore(buatKartu(data), noCourse));

        noCourse.hidden = hasil.length > 0;
        if (hasil.length === 0) {
            noCourse.textContent = semuaPelatihan.length === 0
                ? "Belum ada pelatihan yang dipublikasikan."
                : "Pelatihan tidak ditemukan. Coba kata kunci atau filter lainnya.";
        }
    }

    // Jika halaman dibuka dari kartu kategori Beranda, aktifkan filter terkait.
    const kategoriDariUrl = new URLSearchParams(window.location.search).get("kategori");
    if (kategoriDariUrl) {
        categoryFilters.forEach(input => {
            input.checked = normalisasi(input.value) === normalisasi(kategoriDariUrl);
        });
    }

    // Event pencarian dan filter diperbarui setiap kali input berubah.
    searchInput.addEventListener("input", tampilkanPelatihan);
    categoryFilters.forEach(input => input.addEventListener("change", tampilkanPelatihan));
    levelFilters.forEach(input => input.addEventListener("change", tampilkanPelatihan));

    // Tombol ini hanya menghapus pilihan kategori; filter tingkat tetap dipertahankan.
    if (showAllButton) {
        showAllButton.addEventListener("click", function () {
            categoryFilters.forEach(input => { input.checked = false; });
            tampilkanPelatihan();
        });
    }

    tampilkanPelatihan();
});
