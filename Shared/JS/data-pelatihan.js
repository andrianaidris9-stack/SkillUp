/* Sumber data pelatihan SkillUp melalui API PHP/MySQL. */
(function () {
    "use strict";
    const CATEGORY = {
        KEC: "Kecantikan dan Tata Rias",
        KUL: "Kuliner dan Tata Boga",
        TEK: "Teknik dan Alat Berat",
        BUS: "Tata Busana dan Kerajinan",
        ADM: "Administrasi dan Teknologi",
        LIS: "Kelistrikan dan Keterampilan Teknik",
        PAR: "Pariwisata dan Perhotelan",
        WIR: "Kewirausahaan"
    };
    const CODE = Object.fromEntries(Object.entries(CATEGORY).map(([code, name]) => [name, code]));
    const script = document.currentScript || document.querySelector('script[src*="data-pelatihan.js"]');
    const assetFolder = script ? new URL("../../Assets/img/pelatihan/", script.src) : null;
    const ICON = {
        KEC:"kecantikan.svg",KUL:"kuliner.svg",TEK:"teknik.svg",BUS:"busana.svg",
        ADM:"administrasi.svg",LIS:"kelistrikan.svg",PAR:"pariwisata.svg",WIR:"kewirausahaan.svg"
    };
    function fallbackImage(code) {
        return assetFolder && ICON[code] ? new URL(ICON[code], assetFolder).href : "";
    }
    function toView(row) {
        const code = row.category_code || CODE[row.category] || row.kategori;
        const start = row.start_date || row.tanggalMulai || "";
        const end = row.end_date || row.tanggalSelesai || "";
        const fee = Number(row.fee ?? 0);
        return {
            id: String(row.id),
            judul: row.title || row.judul || "",
            kategori: row.category || CATEGORY[code] || row.kategori || "",
            category_code: code,
            tingkat: row.level || row.tingkat || "Pemula",
            durasi: `${row.duration_hours ?? (parseInt(row.durasi,10) || 0)} Jam`,
            harga: "Rp" + (Number.isFinite(fee) ? fee.toLocaleString("id-ID") : "0"),
            instruktur: row.instructor || row.instruktur || "",
            tanggalMulai: start,
            tanggalSelesai: end,
            tanggalDiperbarui: row.updated_at || row.tanggalDiperbarui || "",
            status: row.status || "Draft",
            deskripsi: row.description || row.deskripsi || "",
            thumbnail: row.cover_image
                ? window.SkillUpAPI.assetUrl(row.cover_image)
                : (row.thumbnail || fallbackImage(code)),
            cover_image: row.cover_image || null
        };
    }
    function feeNumber(value) {
        const digits = String(value ?? "0").replace(/[^\d]/g, "");
        return Number(digits || 0);
    }
    async function toFormData(data) {
        const fd = new FormData();
        fd.append("title", data.judul || "");
        fd.append("category_code", data.category_code || CODE[data.kategori] || "");
        fd.append("level", data.tingkat || "Pemula");
        fd.append("duration_hours", String(parseInt(data.durasi, 10) || 0));
        fd.append("fee", String(feeNumber(data.harga)));
        fd.append("instructor", data.instruktur || "");
        fd.append("start_date", data.tanggalMulai || "");
        fd.append("end_date", data.tanggalSelesai || "");
        fd.append("status", data.status || "Draft");
        fd.append("description", data.deskripsi || "");
        const image = data.thumbnail || "";
        if (typeof image === "string" && image.startsWith("data:image/")) {
            const blob = await (await fetch(image)).blob();
            fd.append("cover", blob, "cover-pelatihan.jpg");
        }
        return fd;
    }
    async function ambilSemua() {
        const result = await window.SkillUpAPI.get("trainings");
        return (result.trainings || []).map(toView);
    }
    async function ambilById(id) {
        const result = await window.SkillUpAPI.get("trainings/" + encodeURIComponent(id));
        return result.training ? toView(result.training) : null;
    }
    async function simpan(data) {
        const fd = await toFormData(data);
        if (data.id && /^\d+$/.test(String(data.id))) {
            await window.SkillUpAPI.upload("admin/trainings/" + encodeURIComponent(data.id), fd, "POST");
        } else {
            await window.SkillUpAPI.upload("admin/trainings", fd, "POST");
        }
        return data;
    }
    async function hapus(id) {
        return window.SkillUpAPI.delete("admin/trainings/" + encodeURIComponent(id));
    }
    window.SkillUpPelatihan = {
        ambilSemua,
        ambilById,
        simpan,
        hapus,
        async ambilPublikasi() {
            const result = await window.SkillUpAPI.get("trainings");
            return (result.trainings || []).filter(item => item.status === "Published").map(toView);
        },
        kategori: CATEGORY
    };
})();
