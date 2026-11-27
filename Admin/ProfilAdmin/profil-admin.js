
/* =====================================================
   PROFIL ADMIN SKILLUP
   Menampilkan informasi profil utama admin.
   Header dikelola oleh admin-header.js.
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // ================================================
    // 1. MENGAMBIL ELEMEN HTML
    // ================================================

    const profileDisplayName =
        document.getElementById("profileDisplayName");

    const profileDisplayEmail =
        document.getElementById("profileDisplayEmail");

    const profileAdminName =
        document.getElementById("profileAdminName");

    const profileAdminEmail =
        document.getElementById("profileAdminEmail");

    const profileInitial =
        document.getElementById("profileInitial");

    const profileAdminPhoto =
        document.getElementById("profileAdminPhoto");


    // ================================================
    // 2. MEMBACA DATA ADMIN
    // ================================================

    let admin;

    try {

        admin = JSON.parse(
            localStorage.getItem("skillupLoggedIn") || "null"
        );

    } catch (error) {

        console.error("Gagal membaca data admin:", error);
        admin = null;
    }


    // ================================================
    // 3. PERIKSA HAK AKSES
    // ================================================

    if (!admin || admin.role !== "admin") {

        window.location.href =
            "../../Autentikasi/Login/login.html";

        return;
    }


    // ================================================
    // 4. MENYIAPKAN DATA ADMIN
    // ================================================

    const nama = String(admin.name || "Admin SkillUp");
    const email = admin.email || "-";
    const foto = admin.fotoProfil || "";


    // ================================================
    // 5. MEMBUAT INISIAL NAMA
    // ================================================

    function buatInisial(namaAdmin) {

        const daftarKata = String(namaAdmin || "Admin")
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


    // ================================================
    // 6. MENAMPILKAN INFORMASI ADMIN
    // ================================================

    if (profileDisplayName) {
        profileDisplayName.textContent = nama;
    }

    if (profileDisplayEmail) {
        profileDisplayEmail.textContent = email;
    }

    if (profileAdminName) {
        profileAdminName.textContent = nama;
    }

    if (profileAdminEmail) {
        profileAdminEmail.textContent = email;
    }


    // ================================================
    // 7. MENAMPILKAN FOTO PROFIL
    // ================================================

    const inisial = buatInisial(nama);

    if (profileInitial) {

        profileInitial.textContent = inisial;
        profileInitial.hidden = Boolean(foto);

    }

    if (profileAdminPhoto) {

        if (foto) {

            profileAdminPhoto.src = foto;
            profileAdminPhoto.alt = "Foto Profil " + nama;
            profileAdminPhoto.hidden = false;

            profileAdminPhoto.onerror = function () {

                profileAdminPhoto.hidden = true;

                if (profileInitial) {
                    profileInitial.hidden = false;
                }

            };

        } else {

            profileAdminPhoto.removeAttribute("src");
            profileAdminPhoto.hidden = true;

            if (profileInitial) {
                profileInitial.hidden = false;
            }

        }

    }


    // ================================================
    // 8. PERBARUI JIKA PROFIL BERUBAH
    // ================================================

    window.addEventListener("skillupProfileUpdated", function () {

        try {

            const adminTerbaru = JSON.parse(
                localStorage.getItem("skillupLoggedIn") || "null"
            );

            if (!adminTerbaru || adminTerbaru.role !== "admin") {
                return;
            }

            const namaBaru = String(
                adminTerbaru.name || "Admin SkillUp"
            );

            const emailBaru = adminTerbaru.email || "-";
            const fotoBaru = adminTerbaru.fotoProfil || "";
            const inisialBaru = buatInisial(namaBaru);

            if (profileDisplayName) {
                profileDisplayName.textContent = namaBaru;
            }

            if (profileDisplayEmail) {
                profileDisplayEmail.textContent = emailBaru;
            }

            if (profileAdminName) {
                profileAdminName.textContent = namaBaru;
            }

            if (profileAdminEmail) {
                profileAdminEmail.textContent = emailBaru;
            }

            if (profileInitial) {
                profileInitial.textContent = inisialBaru;
                profileInitial.hidden = Boolean(fotoBaru);
            }

            if (profileAdminPhoto) {

                if (fotoBaru) {

                    profileAdminPhoto.src = fotoBaru;
                    profileAdminPhoto.alt = "Foto Profil " + namaBaru;
                    profileAdminPhoto.hidden = false;

                } else {

                    profileAdminPhoto.removeAttribute("src");
                    profileAdminPhoto.hidden = true;

                    if (profileInitial) {
                        profileInitial.hidden = false;
                    }

                }

            }

        } catch (error) {

            console.error(
                "Gagal memperbarui tampilan profil:",
                error
            );

        }

    });

});
