
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // =========================================
    // 1. PEMERIKSAAN AKSES ADMIN
    // =========================================

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

    const adminName = document.getElementById("adminName");
    const adminAvatar = document.getElementById("adminAvatar");

    if (adminName) {
        adminName.textContent = akunAdmin.name || "Admin SkillUp";
    }

    if (adminAvatar) {
        adminAvatar.textContent = String(
            akunAdmin.name || "A"
        ).charAt(0).toUpperCase();
    }

    // =========================================
    // 2. MENGAMBIL ELEMEN HTML
    // =========================================

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const editForm = document.getElementById("editForm");

    const thumbnailInput = document.getElementById("thumbnailInput");
    const thumbnailPreview = document.getElementById("thumbnailPreview");
    const uploadBox = document.getElementById("uploadBox");
    const chooseFileButton = document.getElementById("chooseFileButton");
    const fileName = document.getElementById("fileName");
    const thumbnailError = document.getElementById("thumbnailError");

    const judulInput = document.getElementById("judul");
    const durasiInput = document.getElementById("durasi");
    const kategoriInput = document.getElementById("kategori");
    const hargaInput = document.getElementById("harga");
    const tingkatInput = document.getElementById("tingkat");
    const instrukturInput = document.getElementById("instruktur");
    const tanggalMulaiInput = document.getElementById("tanggalMulai");
    const tanggalSelesaiInput = document.getElementById("tanggalSelesai");
    const deskripsiInput = document.getElementById("deskripsi");

    if (
        !id ||
        !editForm ||
        !thumbnailInput ||
        !thumbnailPreview ||
        !uploadBox ||
        !chooseFileButton ||
        !judulInput ||
        !durasiInput ||
        !kategoriInput ||
        !hargaInput ||
        !tingkatInput ||
        !instrukturInput ||
        !tanggalMulaiInput ||
        !tanggalSelesaiInput ||
        !deskripsiInput
    ) {
        console.error("Elemen halaman Edit Pelatihan tidak ditemukan.");
        return;
    }

    // =========================================
    // 3. FUNGSI NOTIFIKASI
    // =========================================

    function tampilkanSukses(judul, pesan) {
        if (window.SkillUpPopup) {
            window.SkillUpPopup.sukses(judul, pesan);
        } else {
            console.error(pesan);
        }
    }

    function tampilkanGagal(judul, pesan) {
        if (window.SkillUpPopup) {
            window.SkillUpPopup.gagal(judul, pesan);
        } else {
            console.error(pesan);
        }
    }

    function tampilkanInformasi(judul, pesan) {
        if (window.SkillUpPopup) {
            window.SkillUpPopup.informasi(judul, pesan);
        } else {
            console.error(pesan);
        }
    }

    // =========================================
    // 4. MEMERIKSA SUMBER DATA
    // =========================================

    if (
        !window.SkillUpPelatihan ||
        typeof window.SkillUpPelatihan.ambilById !== "function" ||
        typeof window.SkillUpPelatihan.simpan !== "function"
    ) {
        tampilkanGagal(
            "Data Tidak Tersedia",
            "Pengelola data pelatihan tidak ditemukan. Silakan muat ulang halaman."
        );
        return;
    }

    const Pelatihan = window.SkillUpPelatihan;

    let pelatihan;

    try {
        pelatihan = await Pelatihan.ambilById(id);
    } catch (error) {
        console.error("Kesalahan mengambil data pelatihan:", error);

        tampilkanGagal(
            "Gagal Memuat Data",
            "Data pelatihan tidak dapat dibaca."
        );
        return;
    }

    if (!pelatihan) {
        tampilkanInformasi(
            "Data Tidak Ditemukan",
            "Data pelatihan yang ingin diedit tidak ditemukan."
        );

        window.setTimeout(function () {
            window.location.href = "../DataPelatihan/pelatihan.html";
        }, 2000);

        return;
    }

    // =========================================
    // 5. KONFIGURASI
    // =========================================

    const BATAS_FILE = 5 * 1024 * 1024;
    const BATAS_DIMENSI = 1200;
    const BATAS_KOMPRESI = 700000;

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

    let thumbnailBaru = pelatihan.thumbnail || pelatihan.gambar || "";
    let sedangMenyimpan = false;
    const draftImageKey = "skillup-draft-training-edit:image:" + id;
    try {
        const gambarDraftEdit = sessionStorage.getItem(draftImageKey);
        if (gambarDraftEdit) thumbnailBaru = gambarDraftEdit;
    } catch (error) { console.warn("Draft gambar edit tidak dapat dibaca.", error); }

    // =========================================
    // 6. MENGISI FORM DENGAN DATA LAMA
    // =========================================

    judulInput.value = pelatihan.judul || "";
    durasiInput.value = String(pelatihan.durasi || "").replace(/\s*jam$/i, "").trim();
    kategoriInput.value = pelatihan.kategori || "";
    hargaInput.value = pelatihan.harga || "Rp0";
    tingkatInput.value = pelatihan.tingkat || "";
    instrukturInput.value = pelatihan.instruktur || "";

    tanggalMulaiInput.value = pelatihan.tanggalMulai || "";
    tanggalSelesaiInput.value = pelatihan.tanggalSelesai || "";

    deskripsiInput.value = pelatihan.deskripsi || "";

    const statusValue =
        String(pelatihan.status || "Draft").toLowerCase() === "published"
            ? "Published"
            : "Draft";

    const statusInput = document.querySelector(
        `input[name="status"][value="${statusValue}"]`
    );

    if (statusInput) {
        statusInput.checked = true;
    }

    // =========================================
    // 7. MENAMPILKAN GAMBAR LAMA
    // =========================================

    if (thumbnailBaru) {
        thumbnailPreview.src = thumbnailBaru;
        thumbnailPreview.hidden = false;
        thumbnailPreview.classList.add("is-visible");

        if (fileName) {
            fileName.textContent = "Gambar saat ini";
        }
    }

    // =========================================
    // 8. VALIDASI INLINE
    // =========================================

    function tampilkanError(input, pesan) {
        const errorElement = document.getElementById(
            input.id + "Error"
        );

        input.classList.add("input-invalid");
        input.classList.remove("input-valid");
        input.setAttribute("aria-invalid", "true");

        if (errorElement) {
            errorElement.textContent = pesan;
            errorElement.classList.add("show");
        }
    }

    function hapusError(input) {
        const errorElement = document.getElementById(
            input.id + "Error"
        );

        input.classList.remove("input-invalid");
        input.classList.add("input-valid");
        input.setAttribute("aria-invalid", "false");

        if (errorElement) {
            errorElement.textContent = "";
            errorElement.classList.remove("show");
        }
    }

    function bersihkanError(input) {
        const errorElement = document.getElementById(
            input.id + "Error"
        );

        input.classList.remove("input-invalid", "input-valid");
        input.removeAttribute("aria-invalid");

        if (errorElement) {
            errorElement.textContent = "";
            errorElement.classList.remove("show");
        }
    }

    function tampilkanErrorGambar(pesan) {
        if (!thumbnailError) return;

        thumbnailError.textContent = pesan;
        thumbnailError.classList.add("show");
        uploadBox.classList.add("has-error");
    }

    function bersihkanErrorGambar() {
        if (thumbnailError) {
            thumbnailError.textContent = "";
            thumbnailError.classList.remove("show");
        }

        uploadBox.classList.remove("has-error");
    }

    const fieldWajib = [
        judulInput,
        durasiInput,
        kategoriInput,
        tingkatInput,
        instrukturInput,
        tanggalMulaiInput,
        tanggalSelesaiInput,
        deskripsiInput
    ];

    fieldWajib.forEach(function (input) {
        input.addEventListener("input", function () {
            if (input.value.trim()) {
                hapusError(input);
            } else {
                bersihkanError(input);
            }

            if (
                input === tanggalMulaiInput &&
                tanggalMulaiInput.value
            ) {
                tanggalSelesaiInput.min = tanggalMulaiInput.value;
            }

            if (
                input === tanggalSelesaiInput &&
                tanggalSelesaiInput.value &&
                tanggalMulaiInput.value &&
                tanggalSelesaiInput.value < tanggalMulaiInput.value
            ) {
                tampilkanError(
                    tanggalSelesaiInput,
                    "Tanggal selesai tidak boleh sebelum tanggal mulai."
                );
            }
        });

        input.addEventListener("change", function () {
            if (input.value.trim()) {
                hapusError(input);
            }
        });
    });

    tanggalSelesaiInput.min = tanggalMulaiInput.value || "";

    // =========================================
    // 9. PEMERIKSAAN KATEGORI DAN TINGKAT
    // =========================================

    function kategoriValid(kategori) {
        return KATEGORI_RESMI.some(function (item) {
            return item.toLowerCase() ===
                String(kategori).trim().toLowerCase();
        });
    }

    function tingkatValid(tingkat) {
        return TINGKAT_RESMI.includes(tingkat);
    }

    // =========================================
    // 10. MEMBUKA PILIHAN GAMBAR
    // =========================================

    function bukaPilihanGambar() {
        thumbnailInput.value = "";
        thumbnailInput.click();
    }

    chooseFileButton.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();

        bukaPilihanGambar();
    });

    uploadBox.addEventListener("click", function (event) {
        if (event.target.closest("button")) return;
        if (event.target.closest("[data-image-viewer]")) return;

        bukaPilihanGambar();
    });

    // =========================================
    // 11. MEMPROSES GAMBAR BARU
    // =========================================

    function prosesThumbnail(file) {
        if (!file) return;

        bersihkanErrorGambar();

        if (!FORMAT_DIIZINKAN.includes(file.type)) {
            tampilkanErrorGambar(
                "Format gambar harus JPG atau PNG."
            );

            thumbnailInput.value = "";
            return;
        }

        if (file.size > BATAS_FILE) {
            tampilkanErrorGambar(
                "Ukuran gambar maksimal 5 MB."
            );

            thumbnailInput.value = "";
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

                    context.fillStyle = "#FFFFFF";

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
                        hasilKompresi.length > BATAS_KOMPRESI
                    ) {
                        throw new Error(
                            "Ukuran gambar hasil kompresi masih terlalu besar."
                        );
                    }

                    // Ganti gambar lama hanya setelah gambar baru berhasil diproses.
                    thumbnailBaru = hasilKompresi;
                    try { sessionStorage.setItem(draftImageKey, hasilKompresi); } catch (error) { console.warn("Draft gambar edit tidak dapat disimpan.", error); }

                    thumbnailPreview.src = hasilKompresi;
                    thumbnailPreview.classList.add("is-visible");

                    if (fileName) {
                        fileName.textContent = file.name;
                    }

                    bersihkanErrorGambar();

                } catch (error) {
                    console.error("Kesalahan pemrosesan gambar:", error);

                    tampilkanErrorGambar(
                        "Gambar gagal diproses atau ukurannya masih terlalu besar. Silakan pilih gambar lain."
                    );

                    thumbnailInput.value = "";
                }
            };

            gambar.onerror = function () {
                tampilkanErrorGambar(
                    "Gambar tidak dapat dibuka. Silakan pilih gambar lain."
                );

                thumbnailInput.value = "";
            };

            gambar.src = event.target.result;
        };

        reader.onerror = function () {
            tampilkanErrorGambar(
                "Gambar gagal dibaca. Silakan pilih file lain."
            );

            thumbnailInput.value = "";
        };

        reader.readAsDataURL(file);
    }

    thumbnailInput.addEventListener("change", function () {
        const file = this.files[0];

        if (file) {
            prosesThumbnail(file);
        }
    });

    // =========================================
    // 12. DRAG AND DROP GAMBAR
    // =========================================

    uploadBox.addEventListener("dragover", function (event) {
        event.preventDefault();
        uploadBox.classList.add("drag-over");
    });

    uploadBox.addEventListener("dragleave", function (event) {
        if (!uploadBox.contains(event.relatedTarget)) {
            uploadBox.classList.remove("drag-over");
        }
    });

    uploadBox.addEventListener("drop", function (event) {
        event.preventDefault();

        uploadBox.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (file) {
            thumbnailInput.value = "";
            prosesThumbnail(file);
        }
    });

    // =========================================
    // 13. VALIDASI TANGGAL
    // =========================================

    tanggalMulaiInput.addEventListener("change", function () {
        tanggalSelesaiInput.min = this.value;

        if (
            tanggalSelesaiInput.value &&
            tanggalSelesaiInput.value < this.value
        ) {
            tanggalSelesaiInput.value = "";

            tampilkanError(
                tanggalSelesaiInput,
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );
        }
    });

    tanggalSelesaiInput.addEventListener("change", function () {
        if (
            tanggalMulaiInput.value &&
            this.value &&
            this.value < tanggalMulaiInput.value
        ) {
            tampilkanError(
                tanggalSelesaiInput,
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );
        } else if (this.value) {
            hapusError(tanggalSelesaiInput);
        }
    });

    // =========================================
    // 14. VALIDASI SELURUH FORMULIR
    // =========================================

    function validasiFormulir() {
        let valid = true;
        let inputPertamaError = null;

        function tandaiTidakValid(input, pesan) {
            tampilkanError(input, pesan);
            valid = false;

            if (!inputPertamaError) {
                inputPertamaError = input;
            }
        }

        fieldWajib.forEach(function (input) {
            if (!input.value.trim()) {
                tandaiTidakValid(
                    input,
                    input === judulInput ? "Judul pelatihan wajib diisi." :
                    input === instrukturInput ? "Nama instruktur wajib diisi." :
                    "Bagian ini wajib diisi."
                );
            } else {
                hapusError(input);
            }
        });

        const durasi = durasiInput.value.trim();
        if (durasi && !/^[1-9]\d{0,3}$/.test(durasi)) {
            tandaiTidakValid(
                durasiInput,
                "Durasi harus berupa angka bulat lebih dari 0."
            );
        }

        const judul = judulInput.value.trim();
        if (judul && /^\d+$/.test(judul)) {
            tandaiTidakValid(judulInput, "Judul pelatihan harus berupa teks, bukan angka saja.");
        }

        const instruktur = instrukturInput.value.trim();
        const hurufInstruktur = (instruktur.match(/\p{L}/gu) || []).length;
        if (instruktur && (!/^[\p{L}][\p{L}\s.'’\-]*$/u.test(instruktur) || hurufInstruktur < 3)) {
            tandaiTidakValid(instrukturInput, "Nama instruktur hanya boleh menggunakan huruf dan pemisah nama yang wajar, minimal 3 huruf.");
        }

        if (
            kategoriInput.value &&
            !kategoriValid(kategoriInput.value)
        ) {
            tandaiTidakValid(
                kategoriInput,
                "Silakan pilih salah satu kategori resmi SkillUp."
            );
        }

        if (
            tingkatInput.value &&
            !tingkatValid(tingkatInput.value)
        ) {
            tandaiTidakValid(
                tingkatInput,
                "Tingkat pelatihan tidak valid."
            );
        }

        if (
            tanggalMulaiInput.value &&
            tanggalSelesaiInput.value &&
            tanggalSelesaiInput.value < tanggalMulaiInput.value
        ) {
            tandaiTidakValid(
                tanggalSelesaiInput,
                "Tanggal selesai tidak boleh sebelum tanggal mulai."
            );
        }

        const statusDipilih = document.querySelector(
            'input[name="status"]:checked'
        );

        const statusError = document.getElementById("statusError");

        if (!statusDipilih) {
            valid = false;

            if (statusError) {
                statusError.textContent = "Silakan pilih status publikasi.";
                statusError.classList.add("show");
            }

            if (!inputPertamaError) {
                inputPertamaError = document.querySelector(
                    'input[name="status"]'
                );
            }
        } else if (statusError) {
            statusError.textContent = "";
            statusError.classList.remove("show");
        }

        if (!valid && inputPertamaError) {
            inputPertamaError.focus();
        }

        return valid;
    }

    // =========================================
    // 15. MENYIMPAN PERUBAHAN PELATIHAN
    // =========================================

    editForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        if (sedangMenyimpan) return;

        if (!validasiFormulir()) {
            return;
        }

        const statusDipilih = document.querySelector(
            'input[name="status"]:checked'
        );

        const dataBaru = {
            ...pelatihan,

            id: String(pelatihan.id || id),

            judul: judulInput.value.trim(),
            durasi: durasiInput.value.trim() + " Jam",
            kategori: KATEGORI_RESMI.find(function (item) {
                return item.toLowerCase() ===
                    kategoriInput.value.trim().toLowerCase();
            }),

            harga: hargaInput.value.trim() || "Rp0",
            tingkat: tingkatInput.value,
            instruktur: instrukturInput.value.trim(),

            tanggalMulai: tanggalMulaiInput.value,
            tanggalSelesai: tanggalSelesaiInput.value,

            status: statusDipilih.value,

            deskripsi: deskripsiInput.value.trim(),

            thumbnail: thumbnailBaru,

            tanggalDiperbarui: new Date().toISOString()
        };

        sedangMenyimpan = true;

        const tombolSubmit = editForm.querySelector(
            '[type="submit"]'
        );

        if (tombolSubmit) {
            tombolSubmit.disabled = true;
            tombolSubmit.textContent = "Menyimpan...";
        }

        try {
            await Pelatihan.simpan(dataBaru);

            window.dispatchEvent(new Event("skillup:draft-saved"));
            sessionStorage.removeItem(draftImageKey);

            tampilkanSukses(
                "Perubahan Berhasil",
                "Informasi pelatihan berhasil diperbarui."
            );

            window.setTimeout(function () {
                window.location.href = "../DataPelatihan/pelatihan.html";
            }, 2000);

        } catch (error) {
            console.error(
                "Kesalahan penyimpanan pelatihan:",
                error
            );

            tampilkanGagal(
                "Gagal Menyimpan Perubahan",
                error.message || "Perubahan pelatihan gagal disimpan. Periksa koneksi server dan coba kembali."
            );

            sedangMenyimpan = false;

            if (tombolSubmit) {
                tombolSubmit.disabled = false;
                tombolSubmit.textContent = "Simpan Perubahan";
            }
        }
    });

});
