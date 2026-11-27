
/* =====================================================
   ASESMEN AWAL PESERTA - SKILLUP
   - Peserta mengisi dan mengirim asesmen.
   - Setelah dikirim, asesmen terkunci.
   - Peserta tidak dapat menghapus atau mengubah asesmen.
   - Koreksi dan asesmen ulang melalui Admin.
   - Data profil diambil dari Profil Peserta.
===================================================== */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    // ==========================================
    // 1. VALIDASI AKUN PESERTA
    // ==========================================

    let akunLogin;

    try {
        akunLogin = JSON.parse(
            localStorage.getItem("skillupLoggedIn") || "null"
        );
    } catch (error) {
        akunLogin = null;
    }

    if (!akunLogin || akunLogin.role !== "user") {
        window.location.href =
            "../../Autentikasi/Login/login.html";
        return;
    }

    const email = String(akunLogin.email || "").trim().toLowerCase();
    const emailKey = encodeURIComponent(email);

    const profileKey = "skillupProfile_" + emailKey;
    const legacyProfileKey =
        "skillupProfile_" +
        encodeURIComponent(akunLogin.email || "");

    const assessmentKey = "skillupAsesmenAwal_" + emailKey;
    const allAssessmentKey = "skillupAsesmenAwal";
    const resultKey = "skillupHasilKlasifikasi";

    const form = document.getElementById("assessmentForm");
    const interestInput = document.getElementById("minat");
    const resultCard = document.getElementById("hasilPrediksi");
    const statusText = document.getElementById("statusPrediksi");
    const resultName = document.getElementById("namaBidang");
    const resultDescription =
        document.getElementById("keteranganPrediksi");

    const resetButton =
        document.getElementById("resetAssessment");

    const deleteButton =
        document.getElementById("deleteAssessment");

    if (!form || !interestInput || !resultCard) return;

    // ==========================================
    // 2. DATA BIDANG PELATIHAN
    // ==========================================

    const bidang = {
        KEC: "Kecantikan dan Tata Rias",
        KUL: "Kuliner dan Tata Boga",
        TEK: "Teknik dan Alat Berat",
        BUS: "Tata Busana dan Kerajinan",
        ADM: "Administrasi dan Teknologi",
        LIS: "Kelistrikan dan Keterampilan Teknik",
        PAR: "Pariwisata dan Perhotelan",
        WIR: "Kewirausahaan"
    };

    // ==========================================
    // 3. FUNGSI BANTU
    // ==========================================

    function bacaJSON(key, fallback) {
        try {
            const value = JSON.parse(localStorage.getItem(key));
            return value ?? fallback;
        } catch (error) {
            console.error("Gagal membaca " + key, error);
            return fallback;
        }
    }

    function hitungUsia(tanggalLahir) {
        if (!tanggalLahir) return null;

        const lahir = new Date(tanggalLahir + "T00:00:00");

        if (Number.isNaN(lahir.getTime())) return null;

        const hariIni = new Date();

        let umur =
            hariIni.getFullYear() - lahir.getFullYear();

        if (
            hariIni.getMonth() < lahir.getMonth() ||
            (
                hariIni.getMonth() === lahir.getMonth() &&
                hariIni.getDate() < lahir.getDate()
            )
        ) {
            umur--;
        }

        return umur;
    }

    function ambilProfil() {
        return bacaJSON(
            profileKey,
            bacaJSON(legacyProfileKey, {})
        );
    }

    function buatInisial(nama) {
        const kata = String(nama || "Peserta")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        return kata
            .slice(0, 2)
            .map(item => item.charAt(0).toUpperCase())
            .join("") || "P";
    }

    function tampilkanAvatar(profil) {
        const avatar = document.getElementById("userAvatar");

        if (!avatar) return;

        const nama =
            profil.nama || akunLogin.name || "Peserta";

        const inisial = buatInisial(nama);

        avatar.innerHTML = "";

        if (profil.foto) {
            const gambar = document.createElement("img");

            gambar.src = profil.foto;
            gambar.alt = "Foto Profil Peserta";

            gambar.onerror = function () {
                avatar.innerHTML = "";
                avatar.textContent = inisial.charAt(0);
            };

            avatar.appendChild(gambar);
        } else {
            avatar.textContent = inisial.charAt(0);
        }
    }

    // ==========================================
    // 4. RINGKASAN PROFIL PESERTA
    // ==========================================

    let profilAktif = ambilProfil();
    let umurAktif = hitungUsia(profilAktif.tanggalLahir);

    function tampilkanRingkasanProfil() {

        profilAktif = ambilProfil();
        umurAktif = hitungUsia(profilAktif.tanggalLahir);

        const summaryUsia =
            document.getElementById("summaryUsia");

        const summaryPendidikan =
            document.getElementById("summaryPendidikan");

        const summaryPengalaman =
            document.getElementById("summaryPengalaman");

        if (summaryUsia) {
            summaryUsia.textContent =
                umurAktif !== null
                    ? umurAktif + " tahun"
                    : "Belum diisi";
        }

        if (summaryPendidikan) {
            summaryPendidikan.textContent =
                profilAktif.pendidikan || "Belum diisi";
        }

        if (summaryPengalaman) {
            summaryPengalaman.textContent =
                profilAktif.pengalamanKerja || "Belum diisi";
        }

        tampilkanAvatar(profilAktif);
    }

    // ==========================================
    // 5. FUNGSI RADIO
    // ==========================================

    function ambilRadio(name) {
        return form.querySelector(
            'input[name="' + name + '"]:checked'
        )?.value || "";
    }

    function isiRadio(name, value) {
        const option = form.querySelector(
            'input[name="' + name + '"][value="' + value + '"]'
        );

        if (option) {
            option.checked = true;
        }
    }

    // ==========================================
    // 6. MEMBACA DATA ASESMEN
    // ==========================================

    let asesmenAktif = null;

    function ubahAsesmenServer(data) {
        if (!data) return null;
        const classified = Boolean(data.predicted_category_code);
        return {
            id: data.id,
            minat_bidang: data.interest_category_code,
            kemampuan_komputer: data.computer_level,
            kemampuan_komunikasi: data.communication_level,
            keterampilan_praktik: data.practical_level || null,
            status_asesmen: classified
                ? "Rekomendasi tersedia"
                : (data.practical_level ? "Siap untuk klasifikasi" : "Menunggu penilaian keterampilan praktik oleh Admin"),
            hasil_prediksi: classified ? {
                kode: data.predicted_category_code,
                nama: data.predicted_category,
                keterangan: data.classification_explanation || "Prediksi berdasarkan pohon keputusan ID3."
            } : null,
            tanggal_dibuat: data.submitted_at
        };
    }

    function cariAsesmenPeserta() {
        return asesmenAktif;
    }

    // ==========================================
    // 7. MENAMPILKAN STATUS ASESMEN
    // ==========================================

    function tampilkanStatus(data) {

        if (!data) {
            resultCard.hidden = true;
            return;
        }

        resultCard.hidden = false;

        if (data.hasil_prediksi) {

            statusText.textContent =
                "Hasil klasifikasi sudah tersedia.";

            resultName.textContent =
                data.hasil_prediksi.nama ||
                bidang[data.hasil_prediksi.kode] ||
                "Rekomendasi tersedia";

            resultDescription.textContent =
                data.hasil_prediksi.keterangan ||
                "Hasil ini merupakan rekomendasi pendukung keputusan.";

        } else {

            statusText.textContent =
                data.status_asesmen ||
                "Menunggu pemeriksaan Admin.";

            resultName.textContent =
                "Menunggu penilaian keterampilan praktik";

            resultDescription.textContent =
                "Admin akan mencatat hasil penilaian praktik. Setelah proses penilaian selesai, sistem dapat memproses klasifikasi kebutuhan pelatihan.";
        }
    }

    // ==========================================
    // 8. MENGUNCI ASESMEN YANG SUDAH DIKIRIM
    // ==========================================

    function kunciAsesmen() {

        // Semua kolom tidak dapat diubah lagi.
        form.querySelectorAll("input, select, textarea")
            .forEach(elemen => {
                elemen.disabled = true;
            });

        // Tombol isi ulang tidak ditampilkan.
        if (resetButton) {
            resetButton.hidden = true;
        }

        // Tombol hapus tidak digunakan oleh peserta.
        if (deleteButton) {
            deleteButton.hidden = true;
        }

        // Tombol simpan disembunyikan.
        const submitButton =
            form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.hidden = true;
        }

        // Menampilkan keterangan asesmen terkunci.
        let pesanKunci =
            document.getElementById("assessmentLockedNotice");

        if (!pesanKunci) {

            pesanKunci = document.createElement("div");

            pesanKunci.id = "assessmentLockedNotice";
            pesanKunci.className = "assessment-locked-notice";

            pesanKunci.textContent =
                "Asesmen telah dikirim kepada Admin. Jawaban tidak dapat diubah atau dihapus. Jika terdapat kesalahan, silakan hubungi Admin untuk mengajukan koreksi.";

            const tombolArea = form.querySelector(".tombol");

            if (tombolArea) {
                tombolArea.insertAdjacentElement(
                    "beforebegin",
                    pesanKunci
                );
            } else {
                form.appendChild(pesanKunci);
            }
        }

        form.dataset.locked = "true";
    }

    // ==========================================
    // 9. MEMUAT ASESMEN SEBELUMNYA
    // ==========================================

    function muatAsesmen() {

        const data = cariAsesmenPeserta();

        if (!data) {
            tampilkanStatus(null);
            return false;
        }

        interestInput.value =
            data.minat_bidang || "";

        isiRadio(
            "kemampuan_komputer",
            data.kemampuan_komputer || ""
        );

        isiRadio(
            "kemampuan_komunikasi",
            data.kemampuan_komunikasi || ""
        );

        tampilkanStatus(data);

        // Asesmen yang sudah tersimpan dianggap telah dikirim.
        kunciAsesmen();

        return true;
    }

    // ==========================================
    // 10. VALIDASI PROFIL
    // ==========================================

    tampilkanRingkasanProfil();

    if (
        !profilAktif.tanggalLahir ||
        !profilAktif.pendidikan ||
        !profilAktif.pengalamanKerja ||
        umurAktif === null ||
        umurAktif < 17
    ) {

        await SkillUpPopup.peringatan(
            "Profil Belum Lengkap",
            "Lengkapi tanggal lahir, pendidikan terakhir, dan pengalaman kerja pada Profil Peserta. Usia minimal untuk mengikuti asesmen adalah 17 tahun."
        );

        window.location.href =
            "../EditProfil/edit-profil-peserta.html";

        return;
    }

    // Ambil status asesmen dari database, bukan localStorage.
    try {
        const serverAssessment = await window.SkillUpAPI.get("assessment/initial");
        asesmenAktif = ubahAsesmenServer(serverAssessment.assessment);
    } catch (error) {
        console.error("Gagal memuat asesmen dari server:", error);
        await SkillUpPopup.gagal(
            "Asesmen Belum Dapat Dimuat",
            error.status === 503
                ? "Server/database belum siap. Pastikan PHP dan MySQL sudah dijalankan."
                : (error.message || "Silakan muat ulang halaman.")
        );
        return;
    }

    // Hapus penanda pengisian ulang versi lama.
    sessionStorage.removeItem(
        "skillupAsesmenBaru_" + emailKey
    );

    // Periksa apakah peserta sudah pernah mengirim asesmen.
    const sudahAdaAsesmen = muatAsesmen();

    // ==========================================
    // 11. MENYIMPAN ASESMEN BARU
    // ==========================================

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        // Perlindungan tambahan agar asesmen tidak ditimpa.
        if (
            form.dataset.locked === "true" ||
            cariAsesmenPeserta()
        ) {

            await SkillUpPopup.peringatan(
                "Asesmen Sudah Dikirim",
                "Asesmen Anda sudah tersimpan. Hubungi Admin jika ingin mengajukan koreksi atau asesmen ulang."
            );

            kunciAsesmen();
            return;
        }

        if (!form.reportValidity()) return;

        const kemampuanKomputer =
            ambilRadio("kemampuan_komputer");

        const kemampuanKomunikasi =
            ambilRadio("kemampuan_komunikasi");

        if (
            !interestInput.value ||
            !kemampuanKomputer ||
            !kemampuanKomunikasi
        ) {

            await SkillUpPopup.peringatan(
                "Asesmen Belum Lengkap",
                "Lengkapi minat bidang, kemampuan komputer, dan kemampuan komunikasi terlebih dahulu."
            );

            return;
        }

        // Ambil profil terbaru.
        const profilTerbaru = ambilProfil();
        const usiaTerbaru =
            hitungUsia(profilTerbaru.tanggalLahir);

        if (
            !profilTerbaru.tanggalLahir ||
            !profilTerbaru.pendidikan ||
            !profilTerbaru.pengalamanKerja ||
            usiaTerbaru === null ||
            usiaTerbaru < 17
        ) {

            await SkillUpPopup.peringatan(
                "Profil Belum Lengkap",
                "Periksa kembali data profil Anda. Usia minimal untuk mengikuti asesmen adalah 17 tahun."
            );

            return;
        }

        // Cek ulang agar tidak menggantikan data yang sudah ada.
        if (cariAsesmenPeserta()) {
            await SkillUpPopup.peringatan(
                "Asesmen Sudah Tersimpan",
                "Asesmen Anda sudah tercatat. Silakan hubungi Admin jika membutuhkan perubahan."
            );

            kunciAsesmen();
            return;
        }

        try {
            await window.SkillUpAPI.post("assessment/initial", {
                interest_category_code: interestInput.value,
                computer_level: kemampuanKomputer,
                communication_level: kemampuanKomunikasi
            });
            const latest = await window.SkillUpAPI.get("assessment/initial");
            asesmenAktif = ubahAsesmenServer(latest.assessment);

            tampilkanStatus(asesmenAktif);
            kunciAsesmen();

            await SkillUpPopup.sukses(
                "Asesmen Berhasil Dikirim",
                "Asesmen Anda sudah tersimpan di database dan dikirim untuk diperiksa Admin. Jawaban tidak dapat diubah atau dihapus setelah dikirim."
            );
        } catch (error) {
            console.error("Gagal menyimpan asesmen ke server:", error);
            const message = error.status === 409
                ? "Asesmen Anda sudah pernah dikirim. Hubungi Admin jika membutuhkan koreksi."
                : (error.message || "Data asesmen tidak berhasil disimpan.");
            await SkillUpPopup.gagal("Asesmen Gagal Dikirim", message);
            if (error.status === 409) {
                const latest = await window.SkillUpAPI.get("assessment/initial").catch(() => null);
                if (latest) {
                    asesmenAktif = ubahAsesmenServer(latest.assessment);
                    tampilkanStatus(asesmenAktif);
                    kunciAsesmen();
                }
            }
        }
    });

    // ==========================================
    // 12. TOMBOL ISI ULANG
    // ==========================================

    // Hanya tersedia sebelum asesmen dikirim.
    if (resetButton) {

        resetButton.addEventListener("click", async function () {

            if (
                form.dataset.locked === "true" ||
                cariAsesmenPeserta()
            ) {

                await SkillUpPopup.peringatan(
                    "Asesmen Sudah Dikirim",
                    "Anda tidak dapat mengisi ulang asesmen yang sudah dikirim. Hubungi Admin untuk mengajukan asesmen ulang."
                );

                kunciAsesmen();
                return;
            }

            const pilihan = await SkillUpPopup.konfirmasi(
                "Isi Ulang Asesmen",
                "Apakah Anda yakin ingin mengosongkan semua jawaban dan mengisi kembali asesmen?"
            );

            if (!pilihan) return;

            form.reset();
            interestInput.focus();
        });
    }

    // ==========================================
    // 13. PEMBARUAN PROFIL
    // ==========================================

    window.addEventListener(
        "skillupProfileUpdated",
        function () {
            tampilkanRingkasanProfil();
        }
    );

    window.addEventListener("storage", function (event) {

        if (
            event.key === profileKey ||
            event.key === legacyProfileKey ||
            event.key === "skillupLoggedIn"
        ) {
            tampilkanRingkasanProfil();
        }
    });

});
