document.addEventListener("DOMContentLoaded", function () {
    "use strict";
    const form = document.getElementById("loginForm");
    const email = document.getElementById("loginEmail");
    const password = document.getElementById("loginPassword");
    const emailError = document.getElementById("loginEmailError");
    const passwordError = document.getElementById("loginPasswordError");
    const tabs = document.querySelectorAll(".login-tab");
    const subtitle = document.getElementById("loginSubtitle");
    const toggle = document.getElementById("togglePassword");
    if (!form || !email || !password || !emailError || !passwordError || !window.SkillUpAPI) {
        console.error("Form login atau koneksi API tidak tersedia.");
        return;
    }

    let role = "user";
    function clearError(input, node) {
        node.textContent = "";
        node.classList.remove("show");
        input.classList.remove("input-invalid", "input-valid");
        input.removeAttribute("aria-invalid");
    }
    function showError(input, node, message) {
        node.textContent = message;
        node.classList.add("show");
        input.classList.add("input-invalid");
        input.setAttribute("aria-invalid", "true");
    }
    function clearAll() { clearError(email, emailError); clearError(password, passwordError); }

    tabs.forEach(tab => tab.addEventListener("click", function () {
        tabs.forEach(item => item.classList.remove("active"));
        this.classList.add("active");
        role = this.dataset.role === "admin" ? "admin" : "user";
        clearAll();
        email.value = "";
        password.value = "";
        if (subtitle) subtitle.textContent = role === "admin"
            ? "Masuk menggunakan akun Admin SkillUp."
            : "Masuk untuk melanjutkan proses pemetaan kebutuhan pelatihan.";
    }));

    if (toggle) toggle.addEventListener("click", function (event) {
        event.preventDefault();
        const visible = password.type === "password";
        password.type = visible ? "text" : "password";
        toggle.classList.toggle("show-password", visible);
        toggle.setAttribute("aria-label", visible ? "Sembunyikan password" : "Lihat password");
        toggle.setAttribute("aria-pressed", String(visible));
    });
    email.addEventListener("input", () => clearError(email, emailError));
    password.addEventListener("input", () => clearError(password, passwordError));

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        clearAll();
        const address = email.value.trim().toLowerCase();
        const secret = password.value;
        let valid = true;
        if (!address) { showError(email, emailError, "Email wajib diisi."); valid = false; }
        else if (!/^[a-z0-9]+(?:\.[a-z0-9]+)*@gmail\.com$/.test(address)) { showError(email, emailError, "Gunakan alamat Gmail yang valid."); valid = false; }
        if (!secret) { showError(password, passwordError, "Password wajib diisi."); valid = false; }
        if (!valid) return;

        const submit = form.querySelector('[type="submit"]');
        if (submit) { submit.disabled = true; submit.dataset.oldText = submit.textContent; submit.textContent = "Memproses..."; }
        try {
            const result = await window.SkillUpAPI.post("auth/login", {
                email: address, password: secret, role
            });
            // Snapshot ini hanya untuk menampilkan identitas pada komponen lama.
            // Otorisasi sebenarnya selalu diperiksa oleh sesi PHP di server.
            try { localStorage.setItem("skillupLoggedIn", JSON.stringify(result.user)); } catch (_) {}
            window.location.replace(role === "admin"
                ? "../../Admin/Dashboard/dashboard.html"
                : "../../Pengguna/Dashboard/dashboard-peserta.html");
        } catch (error) {
            if (error.errors && error.errors.email) showError(email, emailError, error.errors.email);
            else if (error.status === 401 || error.status === 403) showError(password, passwordError, "Email atau password tidak sesuai.");
            else {
                if (error.status === 503) showError(email, emailError, "Server/database belum siap. Pastikan PHP dan MySQL sudah dijalankan.");
                else showError(password, passwordError, error.message || "Login gagal. Silakan coba kembali.");
            }
        } finally {
            if (submit) { submit.disabled = false; submit.textContent = submit.dataset.oldText || "Masuk"; }
        }
    });
});
