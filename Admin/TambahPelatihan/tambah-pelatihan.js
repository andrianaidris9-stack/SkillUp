
/* =====================================================
   TAMBAH DATA PELATIHAN SKILLUP
   Validasi, unggah gambar, dan penyimpanan data.
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // =================================================
    // 1. PEMERIKSAAN AKSES ADMIN
    // =================================================

    let akunAdmin;

    try {
        akunAdmin = JSON.parse(
            localStorage.getItem("skillupLoggedIn") || "null"
        );
    } catch (error) {
        akunAdmin = null;
    }

    if (!akunAdmin || akunAdmin.role !== "admin") {
        window.location.href = "../../Autentikasi/Login/login.html";
        return;
    }

    // Nama dan foto header dikelola oleh admin-header.js.


    // =================================================
    // 2. MENGAMBIL ELEMEN HTML
    // =================================================

    const thumbnailInput = document.getElementById("thumbnailInput");
    const imagePreview = document.getElementById("imagePreview");
    const uploadArea = document.getElementById("uploadArea");
    const chooseFileButton = document.getElementById("chooseFileButton");
    const trainingForm = document.getElementById("trainingForm");

    const tanggalMulaiInput = document.getElementById("tanggalMulai");
    const tanggalSelesaiInput = document.getElementById("tanggalSelesai");

    const judulInput = document.getElementById("judul");
    const durasiInput = document.getElementById("durasi");
    const kategoriInput = document.getElementById("kategori");
    const hargaInput = document.getElementById("harga");
    const tingkatInput = document.getElementById("tingkat");
    const instrukturInput = document.getElementById("instruktur");
    const deskripsiInput = document.getElementById("deskripsi");

    const tombolSubmit = document.getElementById("saveTrainingButton");

    if (
        !thumbnailInput ||
        !imagePreview ||
        !uploadArea ||
        !chooseFileButton ||
        !trainingForm ||
        !tanggalMulaiInput ||
        !tanggalSelesaiInput ||
        !judulInput ||
        !durasiInput ||
        !kategoriInput ||
        !hargaInput ||
        !tingkatInput ||
        !instrukturInput ||
        !deskripsiInput
    ) {
        console.error("Elemen form tambah pelatihan tidak ditemukan.");
        return;
    }


    // =================================================
    // 3. MEMERIKSA SUMBER DATA
    // =================================================

    if (
        !window.SkillUpPelatihan ||
        typeof window.SkillUpPelatihan.simpan !== "function"
    ) {
        console.error(
            "Fungsi penyimpanan data pelatihan tidak ditemukan."
        );

        if (window.SkillUpPopup) {
            SkillUpPopup.gagal(
                "Sistem Tidak Tersedia",
                "Fungsi penyimpanan data pelatihan tidak ditemukan. Silakan muat ulang halaman."
            );
        }

        return;
    }

    const Pelatihan = window.SkillUpPelatihan;

    let thumbnailData = "";
    let sedangMenyimpan = false;

    const BATAS_FILE = 5 * 1024 * 1024;
    const BATAS_DIMENSI = 1000;

    const FORMAT_DIIZINKAN = [
        "image/jpeg",
        "image/png"
    ];

    const KATEGORI_RESMI = [
        "Kecantikan dan Tata Rias",
        "Kuliner dan Tata Boga",
        "Teknik dan Alat Berat",
        "Tata Busana dan Kerajinan",
        "Administrasi dan Teknologi",
        "Kelistrikan dan Keterampilan Teknik",
        "Pariwisata dan Perhotelan",
        "Kewirausahaan"
    ];

    const TINGKAT_RESMI = [
        "Pemula",
        "Menengah",
        "Mahir"
    ];


    // =================================================
    // 4. FUNGSI POP-UP
    // =================================================

    function tampilkanPopupGagal(judul, pesan) {

        if (
            window.SkillUpPopup &&
            typeof SkillUpPopup.gagal === "function"
        ) {
            SkillUpPopup.gagal(judul, pesan);
        } else {
            console.error(judul + ": " + pesan);
        }
    }

    function tampilkanPopupSukses(judul, pesan) {

        if (
            window.SkillUpPopup &&
            typeof SkillUpPopup.sukses === "function"
        ) {
            SkillUpPopup.sukses(judul, pesan);
        } else {
            console.error(judul + ": " + pesan);
        }
    }


    // =================================================
    // 5. FUNGSI VALIDASI INLINE
    // =================================================

    const daftarError = {
        judul: document.getElementById("judulError"),
        durasi: document.getElementById("durasiError"),
        kategori: document.getElementById("kategoriError"),
        tingkat: document.getElementById("tingkatError"),
        instruktur: document.getElementById("instrukturError"),
        tanggalMulai: document.getElementById("tanggalMulaiError"),
        tanggalSelesai: document.getElementById("tanggalSelesaiError"),
        deskripsi: document.getElementById("deskripsiError"),
        thumbnail: document.getElementById("thumbnailError")
    };

    function tampilkanError(input, elemenError, pesan) {

        if (!input || !elemenError) return;

        elemenError.textContent = pesan;
        elemenError.classList.add("show");

        input.classList.add("input-invalid");
        input.classList.remove("input-valid");

        input.setAttribute("aria-invalid", "true");
    }

    function hapusError(input, elemenError) {

        if (elemenError) {
            elemenError.textContent = "";
            elemenError.classList.remove("show");
        }

        if (input) {
            input.classList.remove("input-invalid");
            input.classList.remove("input-valid");

            input.setAttribute("aria-invalid", "false");
        }
    }

    function tandaiValid(input, elemenError) {

        hapusError(input, elemenError);

        if (input && input.value.trim()) {
            input.classList.add("input-valid");
        }
    }


    // =================================================
    // 6. FUNGSI BANTUAN GAMBAR
    // =================================================

    function bersihkanGambar() {

        thumbnailData = "";
        try { sessionStorage.removeItem("skillup-draft-training-create:image"); } catch (_) {}

        thumbnailInput.value = "";

        imagePreview.removeAttribute("src");
        imagePreview.classList.remove("is-visible");
        imagePreview.hidden = true;
    }

    function tampilkanGambar(data) {

        thumbnailData = data;
        try { sessionStorage.setItem("skillup-draft-training-create:image", data); } catch (error) { console.warn("Draft gambar tidak dapat disimpan.", error); }

        imagePreview.src = data;
        imagePreview.hidden = false;
        imagePreview.classList.add("is-visible");

        hapusError(null, daftarError.thumbnail);
    }

    try {
        const gambarDraft = sessionStorage.getItem("skillup-draft-training-create:image");
        if (gambarDraft) tampilkanGambar(gambarDraft);
    } catch (error) { console.warn("Draft gambar tidak dapat dipulihkan.", error); }

    function bukaPilihanGambar() {

        thumbnailInput.value = "";
        thumbnailInput.click();
    }

    function tampilkanErrorGambar(pesan) {

        if (daftarError.thumbnail) {
            daftarError.thumbnail.textContent = pesan;
            daftarError.thumbnail.classList.add("show");
        }
    }


    // =================================================
    // 7. MEMPROSES GAMBAR
    // =================================================

    function prosesGambar(file) {

        if (!file) return;

        hapusError(null, daftarError.thumbnail);

        const namaFile = file.name.toLowerCase();

        const ekstensiValid =
            namaFile.endsWith(".jpg") ||
            namaFile.endsWith(".jpeg") ||
            namaFile.endsWith(".png");

        if (
            !FORMAT_DIIZINKAN.includes(file.type) &&
            !ekstensiValid
        ) {
            tampilkanErrorGambar(
                "Format gambar harus JPG atau PNG."
            );
            return;
        }

        if (file.size > BATAS_FILE) {

            tampilkanErrorGambar(
                "Ukuran gambar maksimal 5 MB."
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = function (event) {

            const gambar = new Image();

            gambar.onload = function () {

                try {

                    const canvas = document.createElement("canvas");

                    const skala = Math.min(
                        1,
                        BATAS_DIMENSI / Math.max(
                            gambar.width,
                            gambar.height
                        )
                    );

                    canvas.width = Math.max(
                        1,
                        Math.round(gambar.width * skala)
                    );

                    canvas.height = Math.max(
                        1,
                        Math.round(gambar.height * skala)
                    );

                    const context = canvas.getContext("2d");

                    if (!context) {
                        throw new Error("Canvas tidak dapat digunakan.");
                    }

                    context.fillStyle = "#ffffff";

                    context.fillRect(
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    context.drawImage(
                        gambar,
                        0,
                        0,
                        canvas.width,
                        canvas.height
                    );

                    const hasilKompresi = canvas.toDataURL(
                        "image/jpeg",
                        0.65
                    );

                    if (
                        !hasilKompresi ||
                        hasilKompresi.length > 700000
                    ) {
                        throw new Error(
                            "Ukuran gambar hasil kompresi masih terlalu besar."
                        );
                    }

                    tampilkanGambar(hasilKompresi);

                } catch (error) {

                    tampilkanErrorGambar(
                        "Gambar gagal diproses atau ukurannya masih terlalu besar. Silakan pilih gambar lain."
                    );

                    console.error(
                        "Kesalahan pemrosesan gambar:",
                        error
                    );
                }
            };

            gambar.onerror = function () {

                tampilkanErrorGambar(
                    "Gambar tidak dapat dibuka. Silakan pilih gambar lain."
                );
            };

            gambar.src = event.target.result;
        };

        reader.onerror = function () {

            tampilkanErrorGambar(
                "Gambar gagal dibaca. Silakan pilih file lain."
            );
        };

        reader.readAsDataURL(file);
    }


    // =================================================
    // 8. EVENT UNGGAH GAMBAR
    // =================================================

    chooseFileButton.addEventListener("click", function (event) {

        event.preventDefault();
        event.stopPropagation();

        bukaPilihanGambar();
    });

    uploadArea.addEventListener("click", function (event) {

        if (event.target.closest("button")) return;

        bukaPilihanGambar();
    });

    thumbnailInput.addEventListener("change", function () {

        const file = this.files[0];

        if (file) {
            prosesGambar(file);
        }
    });


    // =================================================
    // 9. DRAG AND DROP GAMBAR
    // =================================================

    uploadArea.addEventListener("dragover", function (event) {

        event.preventDefault();

        uploadArea.classList.add("drag-over");
    });

    uploadArea.addEventListener("dragleave", function (event) {

        if (!uploadArea.contains(event.relatedTarget)) {
            uploadArea.classList.remove("drag-over");
        }
    });

    uploadArea.addEventListener("drop", function (event) {

        event.preventDefault();

        uploadArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (file) {
            prosesGambar(file);
        }
    });


    // =================================================
    // 10. VALIDASI TANGGAL
    // =================================================

    tanggalMulaiInput.addEventListener("change", function () {

        tanggalSelesaiInput.min = this.value;

        if (
            tanggalSelesaiInput.value &&
            tanggalSelesaiInput.value < this.value
        ) {
            tampilkanError(
                tanggalSelesaiInput,
                daftarError.tanggalSelesai,
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );
        } else if (tanggalSelesaiInput.value) {
            tandaiValid(
                tanggalSelesaiInput,
                daftarError.tanggalSelesai
            );
        } else {
            hapusError(
                tanggalSelesaiInput,
                daftarError.tanggalSelesai
            );
        }

        if (this.value) {
            tandaiValid(this, daftarError.tanggalMulai);
        } else {
            hapusError(this, daftarError.tanggalMulai);
        }
    });

    tanggalSelesaiInput.addEventListener("change", function () {

        if (!this.value) {
            hapusError(this, daftarError.tanggalSelesai);
            return;
        }

        if (
            tanggalMulaiInput.value &&
            this.value < tanggalMulaiInput.value
        ) {
            tampilkanError(
                this,
                daftarError.tanggalSelesai,
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );
        } else {
            tandaiValid(this, daftarError.tanggalSelesai);
        }
    });


    // =================================================
    // 11. VALIDASI KATEGORI DAN TINGKAT
    // =================================================

    function kategoriValid(kategori) {

        return KATEGORI_RESMI.some(function (item) {

            return item.toLowerCase() ===
                String(kategori).trim().toLowerCase();

        });
    }

    kategoriInput.addEventListener("change", function () {

        if (!this.value) {
            hapusError(this, daftarError.kategori);
            return;
        }

        if (kategoriValid(this.value)) {
            tandaiValid(this, daftarError.kategori);
        } else {
            tampilkanError(
                this,
                daftarError.kategori,
                "Silakan pilih salah satu dari delapan kategori resmi SkillUp."
            );
        }
    });

    tingkatInput.addEventListener("change", function () {

        if (!this.value) {
            hapusError(this, daftarError.tingkat);
            return;
        }

        if (TINGKAT_RESMI.includes(this.value)) {
            tandaiValid(this, daftarError.tingkat);
        } else {
            tampilkanError(
                this,
                daftarError.tingkat,
                "Tingkat pelatihan tidak valid."
            );
        }
    });


    // =================================================
    // 12. VALIDASI LANGSUNG PADA KOLOM
    // =================================================

    const daftarInputTeks = [
        [judulInput, daftarError.judul],
        [durasiInput, daftarError.durasi],
        [instrukturInput, daftarError.instruktur],
        [deskripsiInput, daftarError.deskripsi]
    ];

    daftarInputTeks.forEach(function ([input, elemenError]) {

        input.addEventListener("input", function () {

            if (this.value.trim()) {
                tandaiValid(this, elemenError);
            } else {
                hapusError(this, elemenError);
            }
        });
    });


    // =================================================
    // 13. VALIDASI SELURUH FORMULIR
    // =================================================

    function validasiFormulir() {

        let formulirValid = true;

        const inputPertamaError = [];

        function periksaWajib(input, elemenError, pesan) {

            if (!input.value.trim()) {

                tampilkanError(
                    input,
                    elemenError,
                    pesan
                );

                formulirValid = false;
                inputPertamaError.push(input);

            } else {

                tandaiValid(input, elemenError);
            }
        }

        periksaWajib(
            judulInput,
            daftarError.judul,
            "Judul pelatihan wajib diisi."
        );

        periksaWajib(
            durasiInput,
            daftarError.durasi,
            "Durasi pelatihan wajib diisi."
        );

        const durasi = durasiInput.value.trim();
        if (durasi && !/^[1-9]\d{0,3}$/.test(durasi)) {
            tampilkanError(
                durasiInput,
                daftarError.durasi,
                "Durasi harus berupa angka bulat lebih dari 0."
            );
            formulirValid = false;
            inputPertamaError.push(durasiInput);
        } else if (durasi) {
            tandaiValid(durasiInput, daftarError.durasi);
        }

        if (!kategoriInput.value) {

            tampilkanError(
                kategoriInput,
                daftarError.kategori,
                "Silakan pilih kategori pelatihan."
            );

            formulirValid = false;
            inputPertamaError.push(kategoriInput);

        } else if (!kategoriValid(kategoriInput.value)) {

            tampilkanError(
                kategoriInput,
                daftarError.kategori,
                "Kategori pelatihan tidak valid."
            );

            formulirValid = false;
            inputPertamaError.push(kategoriInput);

        } else {

            tandaiValid(
                kategoriInput,
                daftarError.kategori
            );
        }

        if (!TINGKAT_RESMI.includes(tingkatInput.value)) {

            tampilkanError(
                tingkatInput,
                daftarError.tingkat,
                "Silakan pilih tingkat kesulitan pelatihan."
            );

            formulirValid = false;
            inputPertamaError.push(tingkatInput);

        } else {

            tandaiValid(
                tingkatInput,
                daftarError.tingkat
            );
        }

        periksaWajib(
            instrukturInput,
            daftarError.instruktur,
            "Nama instruktur wajib diisi."
        );

        const judul = judulInput.value.trim();
        if (judul && /^\d+$/.test(judul)) {
            tampilkanError(judulInput, daftarError.judul, "Judul pelatihan harus berupa teks, bukan angka saja.");
            formulirValid = false;
            inputPertamaError.push(judulInput);
        }

        const instruktur = instrukturInput.value.trim();
        const hurufInstruktur = (instruktur.match(/\p{L}/gu) || []).length;
        if (instruktur && (!/^[\p{L}][\p{L}\s.'’\-]*$/u.test(instruktur) || hurufInstruktur < 3)) {
            tampilkanError(instrukturInput, daftarError.instruktur, "Nama instruktur hanya boleh menggunakan huruf dan pemisah nama yang wajar, minimal 3 huruf.");
            formulirValid = false;
            inputPertamaError.push(instrukturInput);
        }

        if (!tanggalMulaiInput.value) {

            tampilkanError(
                tanggalMulaiInput,
                daftarError.tanggalMulai,
                "Tanggal mulai wajib diisi."
            );

            formulirValid = false;
            inputPertamaError.push(tanggalMulaiInput);

        } else {

            tandaiValid(
                tanggalMulaiInput,
                daftarError.tanggalMulai
            );
        }

        if (!tanggalSelesaiInput.value) {

            tampilkanError(
                tanggalSelesaiInput,
                daftarError.tanggalSelesai,
                "Tanggal selesai wajib diisi."
            );

            formulirValid = false;
            inputPertamaError.push(tanggalSelesaiInput);

        } else if (
            tanggalMulaiInput.value &&
            tanggalSelesaiInput.value < tanggalMulaiInput.value
        ) {

            tampilkanError(
                tanggalSelesaiInput,
                daftarError.tanggalSelesai,
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );

            formulirValid = false;
            inputPertamaError.push(tanggalSelesaiInput);

        } else {

            tandaiValid(
                tanggalSelesaiInput,
                daftarError.tanggalSelesai
            );
        }

        periksaWajib(
            deskripsiInput,
            daftarError.deskripsi,
            "Deskripsi pelatihan wajib diisi."
        );

        if (inputPertamaError.length > 0) {
            inputPertamaError[0].focus();
        }

        return formulirValid;
    }


    // =================================================
    // 14. MENYIMPAN DATA PELATIHAN
    // =================================================

    trainingForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (sedangMenyimpan) return;

        if (!validasiFormulir()) {
            return;
        }

        const statusTerpilih = document.querySelector(
            'input[name="status"]:checked'
        );

        const kategori = kategoriInput.value;

        const pelatihan = {

            id: null,

            judul: judulInput.value.trim(),

            durasi: durasiInput.value.trim() + " Jam",

            kategori: KATEGORI_RESMI.find(function (item) {
                return item.toLowerCase() ===
                    kategori.trim().toLowerCase();
            }),

            harga: hargaInput.value.trim() || "Rp0",

            tingkat: tingkatInput.value,

            instruktur: instrukturInput.value.trim(),

            tanggalMulai: tanggalMulaiInput.value,

            tanggalSelesai: tanggalSelesaiInput.value,

            tanggalDiperbarui: new Date().toISOString(),

            status: statusTerpilih
                ? statusTerpilih.value
                : "Draft",

            deskripsi: deskripsiInput.value.trim(),

            thumbnail: thumbnailData
        };

        sedangMenyimpan = true;

        if (tombolSubmit) {
            tombolSubmit.disabled = true;
            tombolSubmit.textContent = "Menyimpan...";
        }

        try {

            await Pelatihan.simpan(pelatihan);

            window.dispatchEvent(new Event("skillup:draft-saved"));
            sessionStorage.removeItem("skillup-draft-training-create:image");

            tampilkanPopupSukses(
                "Pelatihan Berhasil Ditambahkan",
                "Data pelatihan berhasil disimpan. Kamu akan diarahkan ke halaman Data Pelatihan."
            );

            window.setTimeout(function () {

                window.location.href =
                    "../DataPelatihan/pelatihan.html";

            }, 2000);

        } catch (error) {

            console.error(
                "Kesalahan penyimpanan pelatihan:",
                error
            );

            tampilkanPopupGagal(
                "Gagal Menyimpan Pelatihan",
                error.status === 503 ? "Server/database belum siap. Pastikan PHP dan MySQL sudah dijalankan." : (error.message || "Data pelatihan gagal disimpan. Periksa data dan coba kembali.")
            );

            sedangMenyimpan = false;

            if (tombolSubmit) {
                tombolSubmit.disabled = false;
                tombolSubmit.textContent = "Simpan Pelatihan";
            }
        }
    });

});
