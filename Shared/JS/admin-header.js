/* =====================================================
   ADMIN HEADER SKILLUP
   Mengatur nama dan foto profil admin pada topbar.
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    const adminNameElement =
        document.getElementById("adminName");

    const adminAvatarElement =
        document.getElementById("adminAvatar");


    // ================================================
    // 1. MEMBACA DATA ADMIN
    // ================================================

    function ambilDataAdmin() {

        try {

            const admin = JSON.parse(
                localStorage.getItem("skillupLoggedIn") || "null"
            );

            if (!admin || admin.role !== "admin") {
                return null;
            }

            return admin;

        } catch (error) {

            console.error("Gagal membaca data admin:", error);
            return null;

        }

    }


    // ================================================
    // 2. MEMBUAT INISIAL NAMA
    // ================================================

    function buatInisial(nama) {

        const kata = String(nama || "Admin")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (kata.length === 0) {
            return "A";
        }

        if (kata.length === 1) {
            return kata[0].substring(0, 2).toUpperCase();
        }

        return (
            kata[0][0] + kata[1][0]
        ).toUpperCase();

    }


    // ================================================
    // 3. MEMPERBARUI HEADER
    // ================================================

    function perbaruiHeaderAdmin() {

        const admin = ambilDataAdmin();

        if (!admin) {
            return;
        }

        const nama = admin.name || "Admin SkillUp";
        const foto = admin.fotoProfil || "";

        // Perbarui nama admin.
        if (adminNameElement) {
            adminNameElement.textContent = nama;
        }

        // Perbarui foto admin.
        if (adminAvatarElement) {

            adminAvatarElement.replaceChildren();

            if (foto) {

                const gambar = document.createElement("img");

                gambar.src = foto;
                gambar.alt = "Foto profil " + nama;

                gambar.onerror = function () {

                    adminAvatarElement.replaceChildren();

                    adminAvatarElement.textContent =
                        buatInisial(nama);

                };

                adminAvatarElement.appendChild(gambar);

            } else {

                adminAvatarElement.textContent =
                    buatInisial(nama);

            }

        }

    }


    // ================================================
    // 4. TAMPILKAN SAAT HALAMAN DIBUKA
    // ================================================

    perbaruiHeaderAdmin();


    // ================================================
    // 5. PERBARUI JIKA DATA BERUBAH DI TAB LAIN
    // ================================================

    window.addEventListener("storage", function (event) {

        if (
            event.key === "skillupLoggedIn" ||
            event.key === "skillupAccounts"
        ) {

            perbaruiHeaderAdmin();

        }

    });


    // ================================================
    // 6. PERBARUI SETELAH EDIT PROFIL
    // ================================================

    window.addEventListener(
        "skillupProfileUpdated",
        perbaruiHeaderAdmin
    );

});
