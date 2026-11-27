/* Pemeriksaan sesi dan role di server untuk setiap halaman privat. */
(function () {
    "use strict";
    const script = document.currentScript;
    const params = new URL(script.src).searchParams;
    const role = params.get("role");
    const loginUrl = new URL("../../Autentikasi/Login/login.html", script.src).href;

    document.addEventListener("DOMContentLoaded", async function () {
        if (!window.SkillUpAPI) {
            window.location.replace(loginUrl);
            return;
        }
        try {
            const result = await window.SkillUpAPI.me();
            if (role && result.user.role !== role) throw new Error("Role tidak sesuai.");
            try { localStorage.setItem("skillupLoggedIn", JSON.stringify(result.user)); } catch (_) {}
            window.dispatchEvent(new CustomEvent("skillup:server-session-ready", { detail: result }));
        } catch (_) {
            window.SkillUpAPI.clearLocalSession();
            window.location.replace(loginUrl);
        }
    });
})();
