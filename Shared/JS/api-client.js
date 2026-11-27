/* SkillUp Tahap 5: klien API bersama. Semua permintaan menggunakan sesi PHP. */
(function () {
    "use strict";
    const script = document.currentScript;
    const apiUrl = new URL("../../Backend/api/index.php", script.src);
    let csrf = "";
    let bootstrapPromise = null;

    async function readResponse(response) {
        let data;
        try { data = await response.json(); }
        catch (_) { throw new Error("Server mengirim respons yang tidak dapat dibaca."); }
        if (data && data.csrf) csrf = data.csrf;
        if (!response.ok || data.success === false) {
            const error = new Error(data.message || "Permintaan gagal.");
            error.status = response.status;
            error.errors = data.errors || {};
            throw error;
        }
        return data;
    }

    function urlFor(route) {
        const url = new URL(apiUrl.href);
        url.searchParams.set("route", route);
        return url.href;
    }

    async function bootstrap(force) {
        if (force) bootstrapPromise = null;
        if (!bootstrapPromise) {
            bootstrapPromise = fetch(urlFor("auth/bootstrap"), {
                method: "GET", credentials: "same-origin",
                headers: { "Accept": "application/json" }
            }).then(readResponse).catch(error => {
                bootstrapPromise = null;
                throw error;
            });
        }
        return bootstrapPromise;
    }

    function assetUrl(path) {
        if (!path) return "";
        const value = String(path);
        if (/^(data:|https?:|blob:)/i.test(value)) return value;
        return new URL("../../" + value.replace(/^\/+/, ""), script.src).href;
    }

    function cacheSession(data) {
        if (!data || !data.user) return;
        const user = data.user;
        try { localStorage.setItem("skillupLoggedIn", JSON.stringify(user)); } catch (_) {}
        const p = data.profile || {};
        if (user.role === "user") {
            const profile = {
                nama: user.name || "",
                email: user.email || "",
                nomor: user.phone || "",
                tanggalLahir: p.birth_date || "",
                pendidikan: p.education || "",
                pengalamanKerja: p.work_experience || "",
                alamat: p.address || "",
                foto: assetUrl(p.photo_path || "")
            };
            try { localStorage.setItem("skillupProfile_" + encodeURIComponent(user.email), JSON.stringify(profile)); } catch (_) {}
        } else {
            const admin = { ...user, fotoProfil: assetUrl(p.photo_path || "") };
            try { localStorage.setItem("skillupLoggedIn", JSON.stringify(admin)); } catch (_) {}
        }
    }

    async function request(route, options) {
        const opts = options || {};
        const method = (opts.method || "GET").toUpperCase();
        const headers = new Headers(opts.headers || {});
        headers.set("Accept", "application/json");
        let body = opts.body;

        if (!["GET", "HEAD"].includes(method)) {
            await bootstrap();
            if (csrf) headers.set("X-CSRF-Token", csrf);
            if (body && !(body instanceof FormData) && typeof body !== "string") {
                headers.set("Content-Type", "application/json");
                body = JSON.stringify(body);
            }
        }

        const response = await fetch(urlFor(route), {
            method, headers, body, credentials: "same-origin"
        });
        const data = await readResponse(response);
        if (data.user && data.csrf) {
            csrf = data.csrf;
            bootstrapPromise = Promise.resolve({ user: data.user, csrf });
        }
        return data;
    }

    async function upload(route, formData, method) {
        return request(route, {
            method: method || "POST",
            body: formData
        });
    }

    window.SkillUpAPI = {
        bootstrap,
        request,
        get: route => request(route),
        post: (route, body) => request(route, { method: "POST", body: body || {} }),
        put: (route, body) => request(route, { method: "PUT", body: body || {} }),
        delete: route => request(route, { method: "DELETE" }),
        upload,
        async me() {
            const data = await request("auth/me");
            cacheSession(data);
            return data;
        },
        async requireRole(role, loginUrl) {
            try {
                const data = await request("auth/me");
                if (role && data.user.role !== role) throw new Error("Role tidak sesuai.");
                return data;
            } catch (error) {
                window.location.replace(loginUrl || "/Autentikasi/Login/login.html");
                throw error;
            }
        },
        assetUrl,
        clearLocalSession() {
            try { localStorage.removeItem("skillupLoggedIn"); } catch (_) {}
        }
    };

    window.SkillUpSessionReady = bootstrap().then(data => {
        cacheSession(data);
        return data;
    }).catch(error => {
        console.warn("SkillUp API belum tersambung:", error.message);
        return null;
    });
})();
