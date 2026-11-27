/* Logika pemuatan dan penampilan data Profil Peserta. */


document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // =====================================
    // 1. CEK LOGIN PESERTA
    // =====================================
    const loggedIn = localStorage.getItem("skillupLoggedIn");

    if (!loggedIn) {
        window.location.href = "../../Autentikasi/Login/login.html";
        return;
    }

    let user;

    try {
        user = JSON.parse(loggedIn);
    } catch (error) {
        localStorage.removeItem("skillupLoggedIn");
        window.location.href = "../../Autentikasi/Login/login.html";
        return;
    }

    if (!user || user.role !== "user") {
        window.location.href = "../../Autentikasi/Login/login.html";
        return;
    }

    // =====================================
    // 2. IDENTITAS DAN ELEMEN
    // =====================================
    const nama = document.getElementById("nama");
    const email = document.getElementById("email");
    const pendidikan = document.getElementById("pendidikan");
    const tanggalLahir = document.getElementById("tanggalLahir");
    const usia = document.getElementById("usia");
    const pengalamanKerja = document.getElementById("pengalamanKerja");
    const nomor = document.getElementById("nomor");
    const alamat = document.getElementById("alamat");

    const initial = document.getElementById("initial");
    const avatarSmall = document.getElementById("avatarSmall");

    const logoutButton = document.getElementById("logoutButton");

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationBadge =
        document.getElementById("notificationBadge");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationList =
        document.getElementById("notificationList");

    const markAllReadButton =
        document.getElementById("markAllRead");

    const emailNormal = String(user.email || "").trim().toLowerCase();
    const profileKey = "skillupProfile_" + encodeURIComponent(emailNormal);
    const legacyProfileKey = "skillupProfile_" + encodeURIComponent(user.email || "");

    const notificationKey =
        "skillupNotifications_" + encodeURIComponent(String(user.email || "").trim().toLowerCase());

    // =====================================
    // 3. MEMBUAT INISIAL NAMA
    // =====================================
    function buatInisial(namaLengkap) {
        return String(namaLengkap || "Peserta")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(kata => kata.charAt(0).toUpperCase())
            .join("") || "P"; 
    }

    // =====================================
    // 4. MENAMPILKAN FOTO
    // =====================================
    function tampilkanFoto(element, foto, teksInisial, teksAlt) {
        if (!element) return;

        element.innerHTML = "";

        if (foto) {
            const img = document.createElement("img");

            img.src = foto;
            img.alt = teksAlt;

            img.onerror = function () {
                element.textContent = teksInisial;
            };

            element.appendChild(img);
        } else {
            element.textContent = teksInisial;
        }
    }

    // Menghitung usia berdasarkan tanggal lahir yang tersimpan pada profil.
    function hitungUsia(tanggal) {
        if (!tanggal) return null;
        const lahir = new Date(tanggal + "T00:00:00");
        if (Number.isNaN(lahir.getTime())) return null;
        const hariIni = new Date();
        let umur = hariIni.getFullYear() - lahir.getFullYear();
        const belumUlangTahun =
            hariIni.getMonth() < lahir.getMonth() ||
            (hariIni.getMonth() === lahir.getMonth() && hariIni.getDate() < lahir.getDate());
        if (belumUlangTahun) umur--;
        return umur;
    }

    // =====================================
    // 5. MEMUAT DATA PROFIL
    // =====================================
    function loadProfile() {
        let profile = {};

        try {
            profile = JSON.parse(
                localStorage.getItem(profileKey) ||
                localStorage.getItem(legacyProfileKey) || "{}"
            ) || {};
        } catch (error) {
            profile = {};
        }

        const namaLengkap =
            profile.nama || user.name || "Pengguna";

        if (nama) {
            nama.textContent = namaLengkap;
        }

        if (email) {
            email.textContent =
                String(profile.email || user.email || "-").toLowerCase();
        }

        if (pendidikan) {
            pendidikan.textContent = profile.pendidikan || "Belum diisi";
        }

        if (tanggalLahir) {
            tanggalLahir.textContent = profile.tanggalLahir || "Belum diisi";
        }

        if (usia) {
            const umur = hitungUsia(profile.tanggalLahir);
            usia.textContent = umur === null ? "Belum diisi" : umur + " tahun";
        }

        if (pengalamanKerja) {
            pengalamanKerja.textContent = profile.pengalamanKerja || "Belum diisi";
        }

        if (nomor) {
            nomor.textContent = profile.nomor || user.phone || "Belum diisi";
        }

        if (alamat) {
            alamat.textContent =
                profile.alamat || "Belum diisi";
        }

        const inisial = buatInisial(namaLengkap);

        tampilkanFoto(
            initial,
            profile.foto,
            inisial,
            "Foto Profil Peserta"
        );

       tampilkanFoto(
    avatarSmall,
    profile.foto,
    inisial.charAt(0),
    "Foto Profil Peserta"
);
    }

    loadProfile();

    // Sinkronisasi profil
    window.addEventListener("storage", function (event) {
        if (event.key === profileKey) {
            loadProfile();
        }
    });

    window.addEventListener("skillupProfileUpdated", loadProfile);

    // =====================================
    // 6. MENGAMBIL DATA NOTIFIKASI
    // =====================================
    function getNotifications() {
        try {
            const data = JSON.parse(
                localStorage.getItem(notificationKey) || "[]"
            );

            return Array.isArray(data) ? data : [];
        } catch (error) {
            return [];
        }
    }

    function isUnread(item) {
        return !(item.dibaca === true || item.read === true);
    }

    function saveNotifications(notifications) {
        localStorage.setItem(
            notificationKey,
            JSON.stringify(notifications)
        );

        window.dispatchEvent(
            new Event("skillupNotificationsUpdated")
        );
    }

    // =====================================
    // 7. MENAMPILKAN NOTIFIKASI
    // =====================================
    function renderNotifications() {
        if (!notificationList || !notificationBadge) return;

        const notifications = getNotifications();

        const unreadCount =
            notifications.filter(isUnread).length;

        notificationBadge.textContent = unreadCount;
        notificationBadge.hidden = unreadCount === 0;

        notificationList.innerHTML = "";

        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="notification-empty">
                    Belum ada notifikasi.
                </div>
            `;
            return;
        }

        notifications.forEach((item, index) => {
            const notificationItem =
                document.createElement("div");

            notificationItem.className = "notification-item";

            if (isUnread(item)) {
                notificationItem.classList.add("unread");
            }

            const title = document.createElement("strong");
            title.textContent =
                item.judul || item.title || "Notifikasi";

            const message = document.createElement("p");
            message.textContent =
                item.pesan || item.message || "";

            const date = document.createElement("small");
            date.textContent =
                item.tanggal || item.waktu || item.date || "";

            notificationItem.appendChild(title);
            notificationItem.appendChild(message);
            notificationItem.appendChild(date);

            notificationItem.addEventListener("click", function () {
                const updated = getNotifications();

                if (updated[index]) {
                    updated[index].dibaca = true;
                    updated[index].read = true;

                    saveNotifications(updated);
                    renderNotifications();
                }
            });

            notificationList.appendChild(notificationItem);
        });
    }

    // =====================================
    // 8. BUKA DAN TUTUP NOTIFIKASI
    // =====================================
    if (notificationButton && notificationPanel) {
        notificationButton.addEventListener("click", function (event) {
            event.stopPropagation();

            notificationPanel.hidden =
                !notificationPanel.hidden;
        });

        notificationPanel.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        document.addEventListener("click", function () {
            notificationPanel.hidden = true;
        });
    }

    // =====================================
    // 9. TANDAI SEMUA DIBACA
    // =====================================
    if (markAllReadButton) {
        markAllReadButton.addEventListener("click", function () {
            const updated = getNotifications().map(item => ({
                ...item,
                dibaca: true,
                read: true
            }));

            saveNotifications(updated);
            renderNotifications();
        });
    }

    // Sinkronisasi notifikasi dalam tab yang sama
    window.addEventListener(
        "skillupNotificationsUpdated",
        renderNotifications
    );

    // Sinkronisasi notifikasi antar-tab
    window.addEventListener("storage", function (event) {
        if (event.key === notificationKey) {
            renderNotifications();
        }
    });

    renderNotifications();

    // =====================================
    // 10. KELUAR DARI AKUN
    // =====================================
    if (logoutButton) {
        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("skillupLoggedIn");
        });
    }

});
