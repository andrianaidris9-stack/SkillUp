
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // =========================================
    // CEK LOGIN ADMIN
    // =========================================

    let admin;

    try {
        admin = JSON.parse(
            localStorage.getItem("skillupLoggedIn") || "null"
        );
    } catch (error) {
        admin = null;
    }

    if (!admin || admin.role !== "admin") {
        window.location.href =
            "../../Autentikasi/Login/login.html";
        return;
    }

    // =========================================
    // AMBIL ELEMEN HTML
    // =========================================

    const profileForm = document.getElementById(
        "editAdminProfileForm"
    );

    const namaInput = document.getElementById("adminFullName");
    const emailInput = document.getElementById("adminEmail");

    const namaError = document.getElementById(
        "adminFullNameError"
    );

    const emailError = document.getElementById(
        "adminEmailError"
    );

    const photoInput = document.getElementById(
        "adminPhotoInput"
    );

    const choosePhotoButton = document.getElementById(
        "choosePhotoButton"
    );

    const photoInitial = document.getElementById("photoInitial");
    const adminPhoto = document.getElementById("adminPhoto");
    const photoError = document.getElementById("photoError");

    const saveButton = document.getElementById(
        "saveProfileButton"
    );

    // =========================================
    // PERIKSA ELEMEN
    // =========================================

    if (
        !profileForm ||
        !namaInput ||
        !emailInput ||
        !namaError ||
        !emailError ||
        !photoInput ||
        !choosePhotoButton ||
        !photoInitial ||
        !adminPhoto ||
        !photoError ||
        !saveButton
    ) {
        console.error(
            "Elemen Edit Profil Admin tidak ditemukan."
        );
        return;
    }

    // =========================================
    // PENGATURAN
    // =========================================

    const BATAS_FILE = 5 * 1024 * 1024;
    const BATAS_DIMENSI = 1000;
    const BATAS_KOMPRESI = 700000;

    const FORMAT_FOTO = [
        "image/jpeg",
        "image/png"
    ];

    let fotoProfil = admin.fotoProfil || "";
    let fotoFile = null;
    let fotoDihapus = false;
    let sedangMenyimpan = false;

    // =========================================
    // POPUP
    // =========================================

    function tampilkanSukses(judul, pesan) {
        if (window.SkillUpPopup) {
            SkillUpPopup.sukses(judul, pesan);
        } else {
            alert(pesan);
        }
    }

    function tampilkanGagal(judul, pesan) {
        if (window.SkillUpPopup) {
            SkillUpPopup.gagal(judul, pesan);
        } else {
            alert(pesan);
        }
    }

    // =========================================
    // INISIAL NAMA
    // =========================================

    function buatInisial(nama) {

        const daftarKata = String(nama || "Admin")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (daftarKata.length >= 2) {
            return (
                daftarKata[0][0] +
                daftarKata[1][0]
            ).toUpperCase();
        }

        return daftarKata[0]
            ? daftarKata[0].substring(0, 2).toUpperCase()
            : "A";
    }

    // =========================================
    // TAMPILKAN FOTO PREVIEW
    // =========================================

    function tampilkanFoto() {

        const inisial = buatInisial(namaInput.value);

        if (fotoProfil) {

            adminPhoto.src = fotoProfil;
            adminPhoto.alt = "Foto Profil Admin";
            adminPhoto.hidden = false;

            photoInitial.hidden = true;

        } else {

            adminPhoto.removeAttribute("src");
            adminPhoto.hidden = true;

            photoInitial.textContent = inisial;
            photoInitial.hidden = false;
        }
    }

    // =========================================
    // ISI FORM DENGAN DATA ADMIN
    // =========================================

    namaInput.value = admin.name || "";
    emailInput.value = admin.email || "";
    emailInput.readOnly = true;
    emailInput.setAttribute("aria-readonly", "true");

    tampilkanFoto();

    // =========================================
    // VALIDASI NAMA
    // =========================================

    function validasiNama() {

        const nama = namaInput.value.trim();

        if (!nama) {
            tampilkanError(
                namaInput,
                namaError,
                "Nama lengkap wajib diisi."
            );
            return false;
        }

        const jumlahHuruf = (nama.match(/\p{L}/gu) || []).length;

        if (jumlahHuruf < 3) {
            tampilkanError(
                namaInput,
                namaError,
                "Nama lengkap minimal terdiri dari 3 huruf."
            );
            return false;
        }

        if (!/^[\p{L}][\p{L}\s.'’\-]*$/u.test(nama)) {
            tampilkanError(
                namaInput,
                namaError,
                "Nama hanya boleh berisi huruf, spasi, tanda titik, apostrof, atau tanda hubung."
            );
            return false;
        }

        hapusError(namaInput, namaError);
        namaInput.classList.add("input-valid");

        return true;
    }

    // =========================================
    // VALIDASI EMAIL GMAIL
    // =========================================

    function validasiEmail() {
        // Email Admin adalah identitas login. Pada prototipe lokal,
        // email akun demo tidak boleh diubah dari halaman profil.
        const email = String(emailInput.value || "").trim().toLowerCase();
        const emailAkun = String(admin.email || "").trim().toLowerCase();

        if (!emailAkun || email !== emailAkun) {
            tampilkanError(
                emailInput,
                emailError,
                "Email login Admin tidak dapat diubah dari halaman ini."
            );
            return false;
        }

        hapusError(emailInput, emailError);
        return true;
    }

    // =========================================
    // FUNGSI ERROR
    // =========================================

    function tampilkanError(input, tempatError, pesan) {

        tempatError.textContent = pesan;
        tempatError.classList.add("show");

        input.classList.add("input-invalid");
        input.classList.remove("input-valid");

        input.setAttribute("aria-invalid", "true");
    }

    function hapusError(input, tempatError) {

        tempatError.textContent = "";
        tempatError.classList.remove("show");

        input.classList.remove("input-invalid");
        input.classList.remove("input-valid");

        input.removeAttribute("aria-invalid");
    }

    function hapusErrorFoto() {

        photoError.textContent = "";
        photoError.classList.remove("show");
    }

    function tampilkanErrorFoto(pesan) {

        photoError.textContent = pesan;
        photoError.classList.add("show");
    }

    // =========================================
    // VALIDASI SAAT MENGETIK
    // =========================================

    namaInput.addEventListener("input", function () {

        if (namaError.classList.contains("show")) {
            validasiNama();
        }

        tampilkanFoto();
    });

    emailInput.addEventListener("input", function () {

        if (emailError.classList.contains("show")) {
            validasiEmail();
        }
    });

    // =========================================
    // PILIH FOTO
    // =========================================

    choosePhotoButton.addEventListener("click", function () {
        photoInput.click();
    });

    // =========================================
    // PROSES KOMPRESI FOTO
    // =========================================

    function prosesGambar(file) {

        return new Promise((resolve, reject) => {

            if (!FORMAT_FOTO.includes(file.type)) {
                reject(
                    new Error("Format foto harus JPG atau PNG.")
                );
                return;
            }

            if (file.size > BATAS_FILE) {
                reject(
                    new Error("Ukuran foto maksimal 5 MB.")
                );
                return;
            }

            const reader = new FileReader();

            reader.onerror = function () {
                reject(new Error("Foto tidak dapat dibaca."));
            };

            reader.onload = function (event) {

                const image = new Image();

                image.onerror = function () {
                    reject(new Error("File foto tidak valid."));
                };

                image.onload = function () {

                    let width = image.width;
                    let height = image.height;

                    const skala = Math.min(
                        1,
                        BATAS_DIMENSI / Math.max(width, height)
                    );

                    width = Math.round(width * skala);
                    height = Math.round(height * skala);

                    const canvas = document.createElement("canvas");

                    canvas.width = width;
                    canvas.height = height;

                    const context = canvas.getContext("2d");

                    if (!context) {
                        reject(
                            new Error("Foto gagal diproses.")
                        );
                        return;
                    }

                    context.fillStyle = "#FFFFFF";
                    context.fillRect(0, 0, width, height);

                    context.drawImage(
                        image,
                        0,
                        0,
                        width,
                        height
                    );

                    let kualitas = 0.8;

                    let hasilFoto = canvas.toDataURL(
                        "image/jpeg",
                        kualitas
                    );

                    while (
                        hasilFoto.length > BATAS_KOMPRESI &&
                        kualitas > 0.3
                    ) {

                        kualitas -= 0.1;

                        hasilFoto = canvas.toDataURL(
                            "image/jpeg",
                            kualitas
                        );
                    }

                    if (hasilFoto.length > BATAS_KOMPRESI) {
                        reject(
                            new Error(
                                "Ukuran foto setelah diproses masih terlalu besar. Pilih foto lain."
                            )
                        );
                        return;
                    }

                    resolve(hasilFoto);
                };

                image.src = event.target.result;
            };

            reader.readAsDataURL(file);
        });
    }

    // =========================================
    // EVENT PILIH FOTO
    // =========================================

    photoInput.addEventListener("change", async function () {

        const file = this.files[0];

        if (!file) return;

        hapusErrorFoto();

        try {

            const hasilFoto = await prosesGambar(file);

            fotoProfil = hasilFoto;
            const fotoBlob = await (await fetch(hasilFoto)).blob();
            fotoFile = new File([fotoBlob], "foto-profil.jpg", { type: "image/jpeg" });
            fotoDihapus = false;

            tampilkanFoto();

        } catch (error) {

            tampilkanErrorFoto(error.message);

        } finally {

            photoInput.value = "";
        }
    });

    choosePhotoButton.addEventListener("skillup:photo-remove", function () {
        fotoProfil = "";
        fotoFile = null;
        fotoDihapus = true;
        photoInput.value = "";
        hapusErrorFoto();
        tampilkanFoto();
    });

    // =========================================
    // SIMPAN PERUBAHAN PROFIL
    // =========================================

    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();
        if (sedangMenyimpan) return;

        hapusError(namaInput, namaError);
        hapusError(emailInput, emailError);

        const namaValid = validasiNama();
        const emailValid = validasiEmail();
        if (!namaValid || !emailValid) {
            if (!namaValid) namaInput.focus();
            else emailInput.focus();
            return;
        }

        sedangMenyimpan = true;
        saveButton.disabled = true;
        saveButton.textContent = "Menyimpan...";

        try {
            const formData = new FormData();
            formData.append("name", namaInput.value.trim());
            if (fotoFile) formData.append("photo", fotoFile, fotoFile.name);
            if (fotoDihapus) formData.append("remove_photo", "1");

            await window.SkillUpAPI.upload("profile", formData, "POST");
            const latest = await window.SkillUpAPI.get("profile");
            admin = { ...latest.user, fotoProfil: window.SkillUpAPI.assetUrl(latest.profile?.photo_path || "") };
            fotoProfil = admin.fotoProfil;
            fotoFile = null;
            fotoDihapus = false;

            try { localStorage.setItem("skillupLoggedIn", JSON.stringify(admin)); } catch (_) {}
            window.dispatchEvent(new Event("skillupProfileUpdated"));

            tampilkanSukses(
                "Profil Berhasil Diperbarui",
                "Nama dan foto profil Admin berhasil disimpan."
            );
            window.setTimeout(function () {
                window.location.href = "profil-admin.html";
            }, 1200);

        } catch (error) {
            console.error("Gagal menyimpan profil Admin:", error);
            const errors = error.errors || {};
            if (errors.name) tampilkanError(namaInput, namaError, errors.name);
            else tampilkanGagal(
                "Profil Gagal Disimpan",
                error.status === 503
                    ? "Server/database belum siap. Pastikan PHP dan MySQL sudah dijalankan."
                    : (error.message || "Data profil tidak berhasil disimpan.")
            );
            sedangMenyimpan = false;
            saveButton.disabled = false;
            saveButton.textContent = "Simpan Perubahan";
        }
    });

});
