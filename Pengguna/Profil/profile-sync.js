
/* =====================================================
   PROFILE SYNC - SKILLUP
   Sinkronisasi foto dan inisial peserta di semua halaman
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;
    function ambilAkun() {
        try {
            return JSON.parse(
                localStorage.getItem("skillupLoggedIn") || "null"
            );
        } catch (error) {
            return null;
        }
    }

    function buatInisial(nama) {
        return String(nama || "Peserta")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(kata => kata.charAt(0).toUpperCase())
            .join("") || "P";
    }

    function tampilkanAvatar(element, foto, inisial, alt) {
        if (!element) return;

        element.replaceChildren();

        if (foto) {
            const img = document.createElement("img");
            img.src = foto;
            img.alt = alt;

            img.onerror = function () {
                element.textContent = inisial;
            };

            element.appendChild(img);
        } else {
            element.textContent = inisial;
        }
    }

    function sinkronkanProfil() {
        const akun = ambilAkun();

        if (!akun || !akun.email) return;

        const profileKey = "skillupProfile_" + encodeURIComponent(String(akun.email || "").trim().toLowerCase());
        const legacyProfileKey = "skillupProfile_" + encodeURIComponent(akun.email);

        let profile = {};

        try {
            profile = JSON.parse(
                localStorage.getItem(profileKey) || localStorage.getItem(legacyProfileKey) || "{}"
            ) || {};
        } catch (error) {
            profile = {};
        }

        const nama = profile.nama || akun.name || "Peserta";
        const inisial = buatInisial(nama);
        const foto = profile.foto || "";

        // Avatar pada header halaman peserta.
        tampilkanAvatar(
            document.getElementById("userAvatar"),
            foto,
            inisial.charAt(0),
            "Foto Profil Peserta"
        );

        tampilkanAvatar(
            document.getElementById("avatarSmall"),
            foto,
            inisial.charAt(0),
            "Foto Profil Peserta"
        );

        // Foto utama pada halaman Profil dan Edit Profil.
        tampilkanAvatar(
            document.getElementById("initial"),
            foto,
            inisial,
            "Foto Profil Peserta"
        );
    }

    sinkronkanProfil();

    // Pembaruan profil pada tab yang sama.
    window.addEventListener("skillupProfileUpdated", sinkronkanProfil);

    // Pembaruan profil dari tab browser lain.
    window.addEventListener("storage", function (event) {
        const akun = ambilAkun();

        if (!akun || !akun.email) return;

        const profileKey = "skillupProfile_" + encodeURIComponent(String(akun.email || "").trim().toLowerCase());
        const legacyProfileKey = "skillupProfile_" + encodeURIComponent(akun.email);

        if (event.key === profileKey || event.key === "skillupLoggedIn") {
            sinkronkanProfil();
        }
    });
});
