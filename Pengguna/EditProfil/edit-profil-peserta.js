
/* =====================================================
   EDIT PROFIL PESERTA - SKILLUP
   Validasi, penyimpanan, foto, notifikasi, sinkronisasi
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // =================================================
    // 1. CEK LOGIN PESERTA
    // =================================================

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

    if (!user || user.role !== "user" || !user.email) {
        window.location.href = "../../Autentikasi/Login/login.html";
        return;
    }

    // =================================================
    // 2. AMBIL ELEMEN HTML
    // =================================================

    const profileForm = document.getElementById("profileForm");

    const namaInput = document.getElementById("nama");
    const emailInput = document.getElementById("email");
    const nomorInput = document.getElementById("nomor");
    const pendidikanInput = document.getElementById("pendidikan");
    const tanggalLahirInput = document.getElementById("tanggalLahir");
    const pengalamanInput = document.getElementById("pengalamanKerja");
    const alamatInput = document.getElementById("alamat");

    const initial = document.getElementById("initial");
    const avatarSmall = document.getElementById("avatarSmall");

    const photoInput = document.getElementById("photoInput");
    const uploadButton = document.getElementById("uploadButton");
    const photoError = document.getElementById("photoError");

    const logoutButton = document.getElementById("logoutButton");

    const successModal = document.getElementById("successModal");
    const closeSuccessModal = document.getElementById("closeSuccessModal");

    if (
        !profileForm ||
        !namaInput ||
        !emailInput ||
        !nomorInput ||
        !pendidikanInput ||
        !tanggalLahirInput ||
        !pengalamanInput ||
        !alamatInput
    ) {
        console.error("Elemen formulir Edit Profil tidak lengkap.");
        return;
    }

    // =================================================
    // 3. KUNCI DATA PESERTA
    // =================================================

    const emailAsli = String(user.email).trim();
    const emailLama = emailAsli.toLowerCase();

    user.email = emailLama;
    user.phone = String(user.phone || "").trim();

    let profileKey =
        "skillupProfile_" + encodeURIComponent(emailLama);

    const legacyProfileKey =
        "skillupProfile_" + encodeURIComponent(emailAsli);

    let notificationKey =
        "skillupNotifications_" + encodeURIComponent(emailLama);

    // =================================================
    // 4. AMBIL DATA PROFIL LAMA
    // =================================================

    function bacaJSON(key, nilaiDefault) {
        try {
            const data = JSON.parse(
                localStorage.getItem(key) || "null"
            );

            return data === null ? nilaiDefault : data;
        } catch (error) {
            return nilaiDefault;
        }
    }

    let profile =
        bacaJSON(profileKey, null) ||
        bacaJSON(legacyProfileKey, {}) ||
        {};

    let fotoProfil = profile.foto || "";
    let fotoFile = null;
    let fotoDihapus = false;

    // =================================================
    // 5. BATAS TANGGAL LAHIR
    // =================================================

    function tanggalHariIni() {
        const sekarang = new Date();

        const tahun = sekarang.getFullYear();
        const bulan = String(sekarang.getMonth() + 1).padStart(2, "0");
        const hari = String(sekarang.getDate()).padStart(2, "0");

        return `${tahun}-${bulan}-${hari}`;
    }

    tanggalLahirInput.max = tanggalHariIni();

    // =================================================
    // 6. PENYESUAIAN DATA PENDIDIKAN LAMA
    // =================================================

    function normalisasiPendidikan(nilai) {
        const pendidikan = String(nilai || "").trim();

        const pendidikanSetara = [
            "SMA",
            "SMK",
            "MA",
            "SMA/SMK",
            "SMA / SMK",
            "SMA/SMK/MA",
            "SMA / SMK / MA"
        ];

        if (pendidikanSetara.includes(pendidikan)) {
            return "SMA/SMK/MA";
        }

        return pendidikan;
    }

    // =================================================
    // 7. ISI FORM DENGAN DATA LAMA
    // =================================================

    namaInput.value = profile.nama || user.name || "";

    emailInput.value = String(
        profile.email || user.email
    ).trim().toLowerCase();

    emailInput.readOnly = true;
    emailInput.setAttribute("aria-readonly", "true");

    nomorInput.value = profile.nomor || user.phone || "";

    pendidikanInput.value =
        normalisasiPendidikan(profile.pendidikan);

    tanggalLahirInput.value = profile.tanggalLahir || "";
    pengalamanInput.value = profile.pengalamanKerja || "";
    alamatInput.value = profile.alamat || "";

    // =================================================
    // 8. INISIAL NAMA
    // =================================================

    function buatInisial(nama) {
        return String(nama || "Peserta")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map(kata => kata.charAt(0).toUpperCase())
            .join("") || "P";
    }

    // =================================================
    // 9. TAMPILKAN FOTO PROFIL
    // =================================================

    function tampilkanFoto() {
        const inisial = buatInisial(namaInput.value);

        if (initial) {
            initial.innerHTML = "";

            if (fotoProfil) {
                const img = document.createElement("img");

                img.src = fotoProfil;
                img.alt = "Foto Profil Peserta";

                img.onerror = function () {
                    fotoProfil = "";
                    initial.textContent = inisial;

                    if (avatarSmall) {
                        avatarSmall.textContent = inisial;
                    }
                };

                initial.appendChild(img);
            } else {
                initial.textContent = inisial;
            }
        }

        if (avatarSmall) {
            avatarSmall.innerHTML = "";

            if (fotoProfil) {
                const img = document.createElement("img");

                img.src = fotoProfil;
                img.alt = "Foto Peserta";

                img.onerror = function () {
                    avatarSmall.textContent = inisial;
                };

                avatarSmall.appendChild(img);
            } else {
                avatarSmall.textContent = inisial;
            }
        }
    }

    tampilkanFoto();

    namaInput.addEventListener("input", function () {
        if (!fotoProfil) {
            tampilkanFoto();
        }
    });

    // =================================================
    // 10. PILIH DAN PERIKSA FOTO
    // =================================================

    if (uploadButton && photoInput) {

        uploadButton.addEventListener("click", function () {
            photoInput.click();
        });

        photoInput.addEventListener("change", function () {

            const file = this.files[0];

            if (photoError) {
                photoError.textContent = "";
            }

            if (!file) return;

            if (!file.type.startsWith("image/")) {
                if (photoError) {
                    photoError.textContent =
                        "File harus berupa gambar.";
                }

                this.value = "";
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                if (photoError) {
                    photoError.textContent =
                        "Ukuran foto maksimal 5 MB.";
                }

                this.value = "";
                return;
            }

            const reader = new FileReader();

            reader.onload = function (event) {
                fotoProfil = event.target.result;
                fotoFile = file;
                fotoDihapus = false;
                tampilkanFoto();
            };

            reader.onerror = function () {
                if (photoError) {
                    photoError.textContent =
                        "Foto gagal dibaca. Silakan pilih foto lain.";
                }
            };

            reader.readAsDataURL(file);
        });
        uploadButton.addEventListener("skillup:photo-remove", function () {
            fotoProfil = "";
            fotoFile = null;
            fotoDihapus = true;
            photoInput.value = "";
            if (photoError) photoError.textContent = "";
            tampilkanFoto();
        });
    }

    // =================================================
    // 11. PESAN VALIDASI
    // =================================================

    const errorFields = {
        nama: document.getElementById("namaError"),
        email: document.getElementById("emailError"),
        nomor: document.getElementById("nomorError"),
        tanggalLahir: document.getElementById("tanggalLahirError"),
        pendidikan: document.getElementById("pendidikanError"),
        pengalamanKerja: document.getElementById("pengalamanKerjaError"),
        alamat: document.getElementById("alamatError")
    };

    const fieldInputs = {
        nama: namaInput,
        email: emailInput,
        nomor: nomorInput,
        tanggalLahir: tanggalLahirInput,
        pendidikan: pendidikanInput,
        pengalamanKerja: pengalamanInput,
        alamat: alamatInput
    };

    function tampilkanError(namaField, pesan) {
        const input = fieldInputs[namaField];
        const error = errorFields[namaField];

        if (!input || !error) return;

        error.textContent = pesan;
        input.classList.add("input-error");
        input.setAttribute("aria-invalid", "true");
    }

    function hapusError(namaField) {
        const input = fieldInputs[namaField];
        const error = errorFields[namaField];

        if (!input || !error) return;

        error.textContent = "";
        input.classList.remove("input-error");
        input.setAttribute("aria-invalid", "false");
    }

    function hapusSemuaError() {
        Object.keys(fieldInputs).forEach(hapusError);
    }

    // =================================================
    // 12. NORMALISASI INPUT
    // =================================================

    namaInput.addEventListener("input", function () {
        hapusError("nama");
    });

    nomorInput.addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 12);
        hapusError("nomor");
    });

    tanggalLahirInput.addEventListener("change", function () {
        hapusError("tanggalLahir");
    });

    pendidikanInput.addEventListener("change", function () {
        hapusError("pendidikan");
    });

    pengalamanInput.addEventListener("change", function () {
        hapusError("pengalamanKerja");
    });

    alamatInput.addEventListener("input", function () {
        hapusError("alamat");
    });

    // =================================================
    // 13. HITUNG USIA
    // =================================================

    function hitungUsia(tanggalLahir) {
        if (!tanggalLahir) return null;

        const tanggal = new Date(tanggalLahir + "T00:00:00");

        if (Number.isNaN(tanggal.getTime())) {
            return null;
        }

        const sekarang = new Date();

        let usia =
            sekarang.getFullYear() - tanggal.getFullYear();

        const belumUlangTahun =
            sekarang.getMonth() < tanggal.getMonth() ||
            (
                sekarang.getMonth() === tanggal.getMonth() &&
                sekarang.getDate() < tanggal.getDate()
            );

        if (belumUlangTahun) {
            usia--;
        }

        return usia;
    }

    // =================================================
    // 14. VALIDASI FORM
    // =================================================

    function validasiForm() {

        hapusSemuaError();

        let valid = true;
        let fieldPertama = null;

        function tandaiTidakValid(field) {
            valid = false;

            if (!fieldPertama) {
                fieldPertama = fieldInputs[field];
            }
        }

        // NAMA LENGKAP

        const nama = namaInput.value
            .trim()
            .replace(/\s+/g, " ");

        const jumlahHuruf =
            (nama.match(/\p{L}/gu) || []).length;

        if (!nama) {
            tampilkanError(
                "nama",
                "Nama lengkap wajib diisi."
            );
            tandaiTidakValid("nama");

        } else if (jumlahHuruf < 3) {
            tampilkanError(
                "nama",
                "Nama harus memiliki minimal 3 huruf."
            );
            tandaiTidakValid("nama");

        } else if (!/^[\p{L}\s]+$/u.test(nama)) {
            tampilkanError(
                "nama",
                "Nama hanya boleh menggunakan huruf dan spasi."
            );
            tandaiTidakValid("nama");
        }

        // EMAIL

        const email = String(user.email || "")
            .trim()
            .toLowerCase();

        if (!email) {
            tampilkanError(
                "email",
                "Email akun tidak ditemukan."
            );
            tandaiTidakValid("email");

        } else if (
            !/^[a-z0-9]+(?:\.[a-z0-9]+)*@gmail\.com$/.test(email)
        ) {
            tampilkanError(
                "email",
                "Email akun harus menggunakan Gmail dengan format yang valid."
            );
            tandaiTidakValid("email");
        }

        // NOMOR TELEPON

        const nomor = nomorInput.value.trim();

        if (!nomor) {
            tampilkanError(
                "nomor",
                "Nomor telepon wajib diisi."
            );
            tandaiTidakValid("nomor");

        } else if (!/^08\d{8,10}$/.test(nomor)) {
            tampilkanError(
                "nomor",
                "Nomor harus diawali 08 dan terdiri dari 10–12 digit."
            );
            tandaiTidakValid("nomor");
        }

        // TANGGAL LAHIR

        const tanggalLahir = tanggalLahirInput.value;

        if (!tanggalLahir) {
            tampilkanError(
                "tanggalLahir",
                "Tanggal lahir wajib diisi."
            );
            tandaiTidakValid("tanggalLahir");

        } else if (tanggalLahir > tanggalHariIni()) {
            tampilkanError(
                "tanggalLahir",
                "Tanggal lahir tidak boleh melebihi hari ini."
            );
            tandaiTidakValid("tanggalLahir");

        } else {
            const usia = hitungUsia(tanggalLahir);

            if (usia === null || usia < 17) {
                tampilkanError(
                    "tanggalLahir",
                    "Usia minimum peserta SkillUp adalah 17 tahun."
                );
                tandaiTidakValid("tanggalLahir");
            }
        }

        // PENDIDIKAN TERAKHIR

        const pendidikan = pendidikanInput.value;

        const pendidikanDiizinkan = [
            "SMA/SMK/MA",
            "Diploma",
            "S1",
            "S2",
            "S3"
        ];

        if (!pendidikan) {
            tampilkanError(
                "pendidikan",
                "Pendidikan terakhir wajib dipilih."
            );
            tandaiTidakValid("pendidikan");

        } else if (!pendidikanDiizinkan.includes(pendidikan)) {
            tampilkanError(
                "pendidikan",
                "Pendidikan minimal peserta adalah SMA/SMK/MA."
            );
            tandaiTidakValid("pendidikan");
        }

        // PENGALAMAN KERJA

        const pengalamanKerja = pengalamanInput.value;

        const pengalamanDiizinkan = [
            "Belum ada",
            "Informal",
            "Formal kurang dari 2 tahun",
            "Formal 2 tahun atau lebih"
        ];

        if (!pengalamanKerja) {
            tampilkanError(
                "pengalamanKerja",
                "Pengalaman kerja wajib dipilih."
            );
            tandaiTidakValid("pengalamanKerja");

        } else if (!pengalamanDiizinkan.includes(pengalamanKerja)) {
            tampilkanError(
                "pengalamanKerja",
                "Pilihan pengalaman kerja tidak valid."
            );
            tandaiTidakValid("pengalamanKerja");
        }

        // ALAMAT

        const alamat = alamatInput.value.trim();

        if (!alamat) {
            tampilkanError(
                "alamat",
                "Alamat wajib diisi."
            );
            tandaiTidakValid("alamat");

        } else if (alamat.length < 5) {
            tampilkanError(
                "alamat",
                "Alamat harus diisi dengan lebih lengkap."
            );
            tandaiTidakValid("alamat");
        }

        if (!valid && fieldPertama) {
            fieldPertama.focus();
        }

        return valid;
    }

    // =================================================
    // 15. NOTIFIKASI
    // =================================================

    const oldNotification =
        document.querySelector(".notification");

    if (oldNotification) {

        const wrapper = document.createElement("div");
        wrapper.className = "notification-wrapper";

        wrapper.innerHTML = `
            <button
                type="button"
                class="notification"
                id="notificationButton"
                aria-label="Buka notifikasi"
            >
                <svg
                    viewBox="0 0 24 24"
                    width="21"
                    height="21"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
                    <path d="M10 21h4"></path>
                </svg>

                <span
                    class="notification-badge"
                    id="notificationBadge"
                    hidden
                >0</span>
            </button>

            <div class="notification-panel" id="notificationPanel">
                <div class="notification-header">
                    <strong>Notifikasi</strong>

                    <button type="button" id="markAllRead">
                        Tandai semua dibaca
                    </button>
                </div>

                <div
                    class="notification-list"
                    id="notificationList"
                ></div>
            </div>
        `;

        oldNotification.replaceWith(wrapper);
    }

    const notificationButton =
        document.getElementById("notificationButton");

    const notificationBadge =
        document.getElementById("notificationBadge");

    const notificationPanel =
        document.getElementById("notificationPanel");

    const notificationList =
        document.getElementById("notificationList");

    const markAllRead =
        document.getElementById("markAllRead");

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

    function tampilkanNotifikasi() {

        if (!notificationBadge || !notificationList) {
            return;
        }

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

            notificationItem.append(title, message, date);

            notificationItem.addEventListener("click", function () {

                const updated = getNotifications();

                if (updated[index]) {
                    updated[index].dibaca = true;
                    updated[index].read = true;

                    saveNotifications(updated);
                    tampilkanNotifikasi();
                }
            });

            notificationList.appendChild(notificationItem);
        });
    }

    if (notificationButton && notificationPanel) {

        notificationButton.addEventListener("click", function (event) {
            event.stopPropagation();
            notificationPanel.classList.toggle("show");
        });

        notificationPanel.addEventListener("click", function (event) {
            event.stopPropagation();
        });

        document.addEventListener("click", function () {
            notificationPanel.classList.remove("show");
        });
    }

    if (markAllRead) {

        markAllRead.addEventListener("click", function () {

            const notifications = getNotifications().map(item => ({
                ...item,
                dibaca: true,
                read: true
            }));

            saveNotifications(notifications);
            tampilkanNotifikasi();
        });
    }

    window.addEventListener(
        "skillupNotificationsUpdated",
        tampilkanNotifikasi
    );

    window.addEventListener("storage", function (event) {
        if (event.key === notificationKey) {
            tampilkanNotifikasi();
        }
    });

    tampilkanNotifikasi();

    // =================================================
    // 16. SIMPAN DATA PROFIL
    // =================================================

    profileForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        if (!validasiForm()) return;

        const nama = namaInput.value.trim().replace(/\s+/g, " ");
        const nomor = nomorInput.value.trim();
        const pendidikan = pendidikanInput.value;
        const tanggalLahir = tanggalLahirInput.value;
        const pengalamanKerja = pengalamanInput.value;
        const alamat = alamatInput.value.trim();

        const submitButton = profileForm.querySelector('[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.dataset.oldText = submitButton.textContent;
            submitButton.textContent = "Menyimpan...";
        }

        try {
            const formData = new FormData();
            formData.append("name", nama);
            formData.append("phone", nomor);
            formData.append("birth_date", tanggalLahir);
            formData.append("education", pendidikan);
            formData.append("work_experience", pengalamanKerja);
            formData.append("address", alamat);
            if (fotoFile) formData.append("photo", fotoFile, fotoFile.name);
            if (fotoDihapus) formData.append("remove_photo", "1");

            await window.SkillUpAPI.upload("profile", formData, "POST");
            const latest = await window.SkillUpAPI.get("profile");

            user.name = latest.user.name;
            user.phone = latest.user.phone;
            user.email = latest.user.email;
            try {
                localStorage.setItem("skillupLoggedIn", JSON.stringify(latest.user));
                const p = latest.profile || {};
                const cached = {
                    nama: latest.user.name,
                    email: latest.user.email,
                    nomor: latest.user.phone,
                    tanggalLahir: p.birth_date || tanggalLahir,
                    pendidikan: p.education || pendidikan,
                    pengalamanKerja: p.work_experience || pengalamanKerja,
                    alamat: p.address || alamat,
                    foto: window.SkillUpAPI.assetUrl(p.photo_path || "")
                };
                localStorage.setItem("skillupProfile_" + encodeURIComponent(latest.user.email), JSON.stringify(cached));
            } catch (_) {}

            fotoFile = null;
            fotoDihapus = false;
            fotoProfil = window.SkillUpAPI.assetUrl(latest.profile?.photo_path || "");
            profile = {
                nama, email: latest.user.email, nomor,
                tanggalLahir, usia: hitungUsia(tanggalLahir),
                pendidikan, pengalamanKerja, alamat, foto: fotoProfil
            };
            tampilkanFoto();
            window.dispatchEvent(new Event("skillupProfileUpdated"));

            if (window.SkillUpPopup) {
                await window.SkillUpPopup.sukses(
                    "Profil Berhasil Diperbarui",
                    "Data profil dan foto Anda berhasil disimpan."
                );
            }
            window.location.href = "../Profil/profil-peserta.html";

        } catch (error) {
            console.error("Gagal menyimpan profil melalui server:", error);
            const errors = error.errors || {};
            const map = {
                name: "nama",
                phone: "nomor",
                birth_date: "tanggalLahir",
                education: "pendidikan",
                work_experience: "pengalamanKerja",
                address: "alamat"
            };
            Object.entries(errors).forEach(([key, message]) => {
                if (map[key]) tampilkanError(map[key], message);
            });
            if (error.message && !Object.keys(errors).length) {
                tampilkanError("nama", error.status === 503
                    ? "Server/database belum siap. Pastikan PHP dan MySQL sudah dijalankan."
                    : error.message);
            }
        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = submitButton.dataset.oldText || "Simpan Perubahan";
            }
        }
    });

    // =================================================
    // 17. TUTUP POP-UP BERHASIL
    // =================================================

    if (closeSuccessModal) {

        closeSuccessModal.addEventListener("click", function () {
            window.location.href =
                "../Profil/profil-peserta.html";
        });
    }

    // =================================================
    // 18. KELUAR DARI AKUN
    // =================================================

    if (logoutButton) {

        logoutButton.addEventListener("click", function () {
            localStorage.removeItem("skillupLoggedIn");
        });
    }

});
