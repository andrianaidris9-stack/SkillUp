/* =====================================================
   REGISTRASI PESERTA - PROTOTIPE FRONTEND SKILLUP
   Pendaftaran umum hanya membuat akun peserta.
   Akun Admin disediakan terpisah oleh pengelola.
===================================================== */

document.addEventListener("DOMContentLoaded", function () {

    // =========================================
    // AMBIL ELEMEN HTML
    // =========================================

    const form = document.getElementById("registerForm");

    const nameInput = document.getElementById("registerName");
    const emailInput = document.getElementById("registerEmail");
    const phoneInput = document.getElementById("registerPhone");
    const passwordInput = document.getElementById("registerPassword");

    const togglePassword = document.getElementById("togglePassword");
    const agreeTerms = document.getElementById("agreeTerms");

    const nameError = document.getElementById("registerNameError");
    const emailError = document.getElementById("registerEmailError");
    const phoneError = document.getElementById("registerPhoneError");
    const passwordError = document.getElementById("registerPasswordError");
    const termsError = document.getElementById("agreeTermsError");

    if (
        !form ||
        !nameInput ||
        !emailInput ||
        !phoneInput ||
        !passwordInput ||
        !agreeTerms
    ) {
        console.error("Elemen formulir register tidak ditemukan.");
        return;
    }

    // =========================================
    // FUNGSI MENAMPILKAN PESAN VALIDASI
    // =========================================

    function tampilkanError(input, tempatError, pesan) {

        tempatError.textContent = pesan;
        tempatError.classList.add("show");

        if (input) {
            input.classList.add("input-invalid");
            input.classList.remove("input-valid");
            input.setAttribute("aria-invalid", "true");
        }
    }

    // =========================================
    // FUNGSI MENGHAPUS PESAN VALIDASI
    // =========================================

    function hapusError(input, tempatError) {

        tempatError.textContent = "";
        tempatError.classList.remove("show");

        if (input) {
            input.classList.remove("input-invalid");
            input.classList.remove("input-valid");
            input.removeAttribute("aria-invalid");
        }
    }

    // =========================================
    // VALIDASI NAMA LENGKAP
    // =========================================

    function validasiNama() {

        const nama = nameInput.value.trim();

        hapusError(nameInput, nameError);

        if (nama === "") {
            tampilkanError(
                nameInput,
                nameError,
                "Nama lengkap wajib diisi."
            );
            return false;
        }

        const jumlahHuruf = (nama.match(/\p{L}/gu) || []).length;
        const formatNamaValid = /^[\p{L}][\p{L}\s.'’\-]*$/u.test(nama);

        if (jumlahHuruf < 3) {
            tampilkanError(
                nameInput,
                nameError,
                "Nama lengkap minimal terdiri dari 3 huruf."
            );
            return false;
        }

        if (!formatNamaValid) {
            tampilkanError(
                nameInput,
                nameError,
                "Nama hanya boleh berisi huruf, spasi, tanda titik, apostrof, atau tanda hubung."
            );
            return false;
        }

        nameInput.classList.add("input-valid");
        return true;
    }

    // =========================================
    // VALIDASI EMAIL GMAIL
    // =========================================

    function validasiEmail() {

        const email = emailInput.value.trim();

        hapusError(emailInput, emailError);

        if (email === "") {
            tampilkanError(
                emailInput,
                emailError,
                "Email wajib diisi."
            );
            return false;
        }

        const polaEmail = /^[a-z0-9]+(?:\.[a-z0-9]+)*@gmail\.com$/;

        if (!polaEmail.test(email)) {
            tampilkanError(
                emailInput,
                emailError,
                "Email harus menggunakan huruf kecil dan format nama@gmail.com (termasuk @gmail.com)."
            );
            return false;
        }

        emailInput.classList.add("input-valid");
        return true;
    }

    // =========================================
    // VALIDASI NOMOR HP
    // =========================================

    function validasiNomorHP() {

        const nomor = phoneInput.value.trim();

        hapusError(phoneInput, phoneError);

        if (nomor === "") {
            tampilkanError(
                phoneInput,
                phoneError,
                "Nomor HP wajib diisi."
            );
            return false;
        }

        const polaNomor = /^08\d{8,10}$/;

        if (!polaNomor.test(nomor)) {
            tampilkanError(
                phoneInput,
                phoneError,
                "Nomor HP harus diawali 08 dan terdiri dari 10 sampai 12 digit angka."
            );
            return false;
        }

        phoneInput.classList.add("input-valid");
        return true;
    }

    // =========================================
    // VALIDASI PASSWORD
    // =========================================

    function validasiPassword() {

        const password = passwordInput.value;

        hapusError(passwordInput, passwordError);

        if (password === "") {
            tampilkanError(
                passwordInput,
                passwordError,
                "Password wajib diisi."
            );
            return false;
        }

        if (password.length < 8) {
            tampilkanError(
                passwordInput,
                passwordError,
                "Password minimal harus terdiri dari 8 karakter."
            );
            return false;
        }

        const hurufBesar = /[A-Z]/.test(password);
        const hurufKecil = /[a-z]/.test(password);
        const angka = /[0-9]/.test(password);
        const karakterKhusus = /[^A-Za-z0-9]/.test(password);

        if (
            !hurufBesar ||
            !hurufKecil ||
            !angka ||
            !karakterKhusus
        ) {
            tampilkanError(
                passwordInput,
                passwordError,
                "Password harus mengandung huruf besar, huruf kecil, angka, dan karakter khusus."
            );
            return false;
        }

        passwordInput.classList.add("input-valid");
        return true;
    }

    // =========================================
    // VALIDASI PERSETUJUAN
    // =========================================

    function validasiPersetujuan() {

        termsError.textContent = "";
        termsError.classList.remove("show");

        if (!agreeTerms.checked) {
            tampilkanError(
                null,
                termsError,
                "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi."
            );

            agreeTerms.setAttribute("aria-invalid", "true");
            return false;
        }

        agreeTerms.removeAttribute("aria-invalid");
        return true;
    }

    // =========================================
    // TAMPIL / SEMBUNYIKAN PASSWORD
    // =========================================

    if (togglePassword) {

        togglePassword.addEventListener("click", function (event) {

            event.preventDefault();

            const tampilkanPassword =
                passwordInput.type === "password";

            passwordInput.type = tampilkanPassword ? "text" : "password";

            togglePassword.classList.toggle(
                "show-password",
                tampilkanPassword
            );

            togglePassword.setAttribute(
                "aria-label",
                tampilkanPassword
                    ? "Sembunyikan password"
                    : "Lihat password"
            );

            togglePassword.setAttribute(
                "aria-pressed",
                String(tampilkanPassword)
            );

        });
    }

    // =========================================
    // VALIDASI LANGSUNG SAAT MENGISI FORM
    // =========================================

    nameInput.addEventListener("input", validasiNama);

    emailInput.setAttribute("autocapitalize", "none");
    emailInput.setAttribute("spellcheck", "false");
    emailInput.addEventListener("input", function () {
        emailInput.value = emailInput.value.toLowerCase();
        validasiEmail();
    });

    phoneInput.addEventListener("input", validasiNomorHP);

    passwordInput.addEventListener("input", validasiPassword);

    agreeTerms.addEventListener("change", validasiPersetujuan);

    // =========================================
    // PROSES PENDAFTARAN
    // =========================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Jalankan semua validasi
        const namaValid = validasiNama();
        const emailValid = validasiEmail();
        const nomorValid = validasiNomorHP();
        const passwordValid = validasiPassword();
        const persetujuanValid = validasiPersetujuan();

        if (
            !namaValid ||
            !emailValid ||
            !nomorValid ||
            !passwordValid ||
            !persetujuanValid
        ) {
            return;
        }

        // Pendaftaran umum hanya membuat akun Peserta melalui backend PHP.
        const name = nameInput.value.trim().replace(/\s+/g, " ");
        const email = emailInput.value.trim().toLowerCase();
        const phone = phoneInput.value.trim();
        const password = passwordInput.value;

        const submit = form.querySelector('[type="submit"]');
        if (submit) {
            submit.disabled = true;
            submit.dataset.oldText = submit.textContent;
            submit.textContent = "Mendaftarkan...";
        }

        try {
            await window.SkillUpAPI.post("auth/register", {
                name, email, phone, password
            });

            await SkillUpPopup.sukses(
                "Pendaftaran Berhasil!",
                "Akun Peserta berhasil dibuat. Silakan login menggunakan email dan password yang telah didaftarkan."
            );
            window.location.href = "../Login/login.html";
        } catch (error) {
            const errors = error.errors || {};
            if (errors.name) tampilkanError(nameInput, nameError, errors.name);
            if (errors.email) tampilkanError(emailInput, emailError, errors.email);
            if (errors.phone) tampilkanError(phoneInput, phoneError, errors.phone);
            if (errors.password) tampilkanError(passwordInput, passwordError, errors.password);
            if (!Object.keys(errors).length) {
                await SkillUpPopup.gagal(
                    "Pendaftaran Gagal",
                    error.status === 503
                        ? "Server/database belum siap. Pastikan PHP dan MySQL sudah dijalankan."
                        : (error.message || "Akun gagal dibuat. Silakan coba kembali.")
                );
            }
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.textContent = submit.dataset.oldText || "Daftar";
            }
        }
    });

});
