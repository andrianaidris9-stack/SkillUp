/* Detail Pelatihan Admin: selalu membaca sumber data bersama yang sama dengan katalog. */
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    let admin;
    try {
        admin = JSON.parse(localStorage.getItem("skillupLoggedIn") || "null");
    } catch (_) {
        admin = null;
    }

    if (!admin || admin.role !== "admin") {
        window.location.href = "../../Autentikasi/Login/login.html";
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    const card = document.getElementById("detailCard");
    const close = document.getElementById("closeButton");

    if (close) {
        close.addEventListener("click", function () {
            window.location.href = "../DataPelatihan/pelatihan.html";
        });
    }

    function gagal(pesan) {
        if (card) {
            card.innerHTML = "";
            const p = document.createElement("p");
            p.className = "admin-empty";
            p.textContent = pesan;
            card.appendChild(p);
        }
    }

    const sumber = window.SkillUpPelatihan;
    if (!id || !sumber || typeof sumber.ambilById !== "function") {
        gagal("Data pelatihan tidak tersedia.");
        return;
    }

    const data = await sumber.ambilById(id);
    if (!data) {
        gagal("Pelatihan tidak ditemukan.");
        return;
    }

    const isi = (elementId, value) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        if (value === 0) {
            el.textContent = "0";
            return;
        }
        el.textContent = value || "-";
    };

    function formatTingkat(tingkat) {
        const nilai = String(tingkat ?? "").trim().toLowerCase();
        const peta = {
            "beginner": "Pemula",
            "pemula": "Pemula",
            "intermediate": "Menengah",
            "menengah": "Menengah",
            "advanced": "Mahir",
            "mahir": "Mahir",
            "lanjutan": "Mahir"
        };
        return peta[nilai] || tingkat || "-";
    }

    function formatStatus(status) {
        const nilai = String(status ?? "").trim().toLowerCase();
        if (["published", "publish", "dipublikasikan", "terbit"].includes(nilai)) {
            return "Dipublikasikan";
        }
        if (["draft", "draf"].includes(nilai)) {
            return "Draf";
        }
        return status || "-";
    }

    function formatHarga(item) {
        const raw = item?.harga ?? item?.fee;
        if (raw === null || raw === undefined || raw === "") {
            return "-";
        }
        const angka = Number(String(raw).replace(/[^0-9.-]+/g, ""));
        if (Number.isNaN(angka)) {
            return String(raw);
        }
        if (angka <= 0) {
            return "Gratis (Rp 0)";
        }
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(angka);
    }

    function formatDurasi(item) {
        const raw = item?.durasi ?? item?.duration_hours;
        if (raw === null || raw === undefined || raw === "") {
            return "-";
        }
        if (typeof raw === "number" || /^\d+$/.test(String(raw).trim())) {
            return `${String(raw).trim()} Jam`;
        }
        return String(raw);
    }

    function formatTanggal(value) {
        if (!value) return "-";
        const str = String(value).trim();
        const isoDate = /^\d{4}-\d{2}-\d{2}$/.test(str) ? new Date(str + "T00:00:00") : new Date(str);
        return Number.isNaN(isoDate.getTime())
            ? str
            : new Intl.DateTimeFormat("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
              }).format(isoDate);
    }

    // Gambar sampul: tampilkan jika tersedia, sembunyikan jika kosong/gagal dimuat.
    const image = document.getElementById("trainingImage");
    const coverSrc = data.thumbnail || data.gambar || data.cover_image || "";
    if (image && coverSrc) {
        image.src = coverSrc;
        image.alt = data.judul || data.title
            ? "Sampul " + (data.judul || data.title)
            : "Sampul Pelatihan";
        image.hidden = false;
        image.classList.add("is-visible");
        image.onerror = function () {
            this.hidden = true;
            this.classList.remove("is-visible");
        };
    }

    const judul = data.judul ?? data.title;
    const deskripsi = data.deskripsi ?? data.description;
    const kategori = data.kategori ?? data.category_name ?? data.category_code;
    const tingkat = data.tingkat ?? data.level;
    const statusTeks = formatStatus(data.status);
    const tanggalMulai = data.tanggalMulai ?? data.start_date;
    const tanggalSelesai = data.tanggalSelesai ?? data.end_date;
    const instruktur = data.instruktur ?? data.instructor;

    isi("trainingTitle", judul);
    isi("trainingStatus", statusTeks);
    isi("trainingDescription", deskripsi);
    isi("category", kategori);
    isi("level", formatTingkat(tingkat));
    isi("hargapelatihan", formatHarga(data));
    isi("duration", formatDurasi(data));
    isi("instructor", instruktur);
    isi("startDate", formatTanggal(tanggalMulai));
    isi("endDate", formatTanggal(tanggalSelesai));
    isi("statusInformation", statusTeks);
});