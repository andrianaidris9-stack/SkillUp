
/*
=========================================================
SKILLUP - ALGORITMA DECISION TREE ID3
Dataset: SkillUp_Dataset_100.csv
Target: kebutuhan_pelatihan
=========================================================
*/

(function () {
    "use strict";

    const alamatScript = document.currentScript
        ? document.currentScript.src
        : "";

    const NAMA_DATASET = "SkillUp_Dataset_100.csv";

    const ATRIBUT = [
        "usia",
        "pendidikan",
        "pengalaman_kerja",
        "minat_bidang",
        "kemampuan_komputer",
        "kemampuan_komunikasi",
        "keterampilan_praktik"
    ];

    const TARGET = "kebutuhan_pelatihan";

    const DAFTAR_TARGET = [
        "KEC", "KUL", "TEK", "BUS",
        "ADM", "LIS", "PAR", "WIR"
    ];

    const NAMA_TARGET = {
        KEC: "Kecantikan dan Tata Rias",
        KUL: "Kuliner dan Tata Boga",
        TEK: "Teknik dan Alat Berat",
        BUS: "Tata Busana dan Kerajinan",
        ADM: "Administrasi dan Teknologi",
        LIS: "Kelistrikan dan Keterampilan Teknik",
        PAR: "Pariwisata dan Perhotelan",
        WIR: "Kewirausahaan"
    };

    let dataLatih = [];
    let pohonKeputusan = null;
    let informasiModel = null;
    let prosesMuatDataset = null;


    /* =================================================
       1. NORMALISASI TEKS
    ================================================= */

    function teksNormal(nilai) {
        return String(nilai ?? "").trim();
    }


    /* =================================================
       2. MEMBACA CSV
    ================================================= */

    function bacaCSV(teks) {

        const baris = [];
        let kolom = [];
        let nilai = "";
        let dalamKutipan = false;

        for (let i = 0; i < teks.length; i++) {

            const karakter = teks[i];
            const berikutnya = teks[i + 1];

            if (karakter === '"') {

                if (dalamKutipan && berikutnya === '"') {
                    nilai += '"';
                    i++;
                } else {
                    dalamKutipan = !dalamKutipan;
                }

            } else if (
                karakter === "," &&
                !dalamKutipan
            ) {

                kolom.push(nilai.trim());
                nilai = "";

            } else if (
                (karakter === "\n" || karakter === "\r") &&
                !dalamKutipan
            ) {

                if (
                    karakter === "\r" &&
                    berikutnya === "\n"
                ) {
                    i++;
                }

                kolom.push(nilai.trim());

                if (kolom.some(item => item !== "")) {
                    baris.push(kolom);
                }

                kolom = [];
                nilai = "";

            } else {

                nilai += karakter;

            }
        }

        if (dalamKutipan) {
            throw new Error(
                "Format CSV tidak valid: terdapat tanda kutip yang belum ditutup."
            );
        }

        if (nilai !== "" || kolom.length > 0) {

            kolom.push(nilai.trim());

            if (kolom.some(item => item !== "")) {
                baris.push(kolom);
            }
        }

        if (baris.length < 2) {
            throw new Error(
                "File CSV kosong atau tidak memiliki data."
            );
        }

        const header = baris[0].map(item =>
            item.replace(/^\uFEFF/, "")
                .trim()
                .toLowerCase()
        );

        const headerWajib = [
            ...ATRIBUT,
            TARGET
        ];

        const headerTidakAda = headerWajib.filter(
            nama => !header.includes(nama)
        );

        if (headerTidakAda.length > 0) {
            throw new Error(
                "Kolom CSV tidak lengkap. Kolom yang tidak ditemukan: " +
                headerTidakAda.join(", ")
            );
        }

        return baris.slice(1).map(item => {

            const objek = {};

            header.forEach((nama, index) => {
                objek[nama] = item[index] ?? "";
            });

            return objek;
        });
    }


    /* =================================================
       3. NORMALISASI USIA
       Usia 17-24 masuk kelompok 18-24 pada dataset.
    ================================================= */

    function normalisasiUsia(nilai) {

        const teks = teksNormal(nilai);

        if (
            teks === "18-24" ||
            teks === "18–24"
        ) {
            return "18-24";
        }

        if (
            teks === "25-34" ||
            teks === "25–34"
        ) {
            return "25-34";
        }

        if (teks === "35+") {
            return "35+";
        }

        const usia = Number(teks);

        if (!Number.isFinite(usia)) {
            return teks;
        }

        if (usia >= 17 && usia <= 24) {
            return "18-24";
        }

        if (usia >= 25 && usia <= 34) {
            return "25-34";
        }

        if (usia >= 35) {
            return "35+";
        }

        return teks;
    }


    /* =================================================
       4. NORMALISASI PENDIDIKAN
    ================================================= */

    function normalisasiPendidikan(nilai) {

        const teks = teksNormal(nilai)
            .toUpperCase()
            .replace(/\s*\/\s*/g, "/");

        if ([
            "SMA",
            "SMK",
            "MA",
            "SMA/SMK",
            "SMA/SMK/MA"
        ].includes(teks)) {

            return "SMA/SMK";
        }

        if ([
            "DIPLOMA",
            "S1",
            "S2",
            "S3",
            "DIPLOMA/S1"
        ].includes(teks)) {

            return "Diploma/S1";
        }

        return teks;
    }


    /* =================================================
       5. NORMALISASI KEMAMPUAN
    ================================================= */

    function normalisasiKemampuan(nilai) {

        const teks = teksNormal(nilai).toLowerCase();

        const daftar = {
            "1": "Dasar",
            "dasar": "Dasar",

            "2": "Menengah",
            "menengah": "Menengah",

            "3": "Mahir",
            "mahir": "Mahir"
        };

        return daftar[teks] || "";
    }


    /* =================================================
       6. NORMALISASI MINAT
    ================================================= */

    function normalisasiMinat(nilai) {

        const teks = teksNormal(nilai);

        const kode = teks.toUpperCase();

        if (DAFTAR_TARGET.includes(kode)) {
            return kode;
        }

        const namaKeKode = {
            "kecantikan dan tata rias": "KEC",
            "kuliner dan tata boga": "KUL",
            "teknik dan alat berat": "TEK",
            "tata busana dan kerajinan": "BUS",
            "administrasi dan teknologi": "ADM",
            "kelistrikan dan keterampilan teknik": "LIS",
            "pariwisata dan perhotelan": "PAR",
            "kewirausahaan": "WIR"
        };

        return namaKeKode[teks.toLowerCase()] || kode;
    }


    /* =================================================
       7. NORMALISASI TARGET
    ================================================= */

    function normalisasiTarget(nilai) {

        const teks = teksNormal(nilai);

        const kode = teks.toUpperCase();

        if (DAFTAR_TARGET.includes(kode)) {
            return kode;
        }

        const namaKeKode = {
            "kecantikan dan tata rias": "KEC",
            "kuliner dan tata boga": "KUL",
            "teknik dan alat berat": "TEK",
            "tata busana dan kerajinan": "BUS",
            "administrasi dan teknologi": "ADM",
            "kelistrikan dan keterampilan teknik": "LIS",
            "pariwisata dan perhotelan": "PAR",
            "kewirausahaan": "WIR"
        };

        return namaKeKode[teks.toLowerCase()] || kode;
    }


    /* =================================================
       8. NORMALISASI SATU BARIS DATA
    ================================================= */

    function normalisasiBaris(data) {

        return {

            usia: normalisasiUsia(data.usia),

            pendidikan: normalisasiPendidikan(
                data.pendidikan
            ),

            pengalaman_kerja: teksNormal(
                data.pengalaman_kerja
            ),

            minat_bidang: normalisasiMinat(
                data.minat_bidang
            ),

            kemampuan_komputer: normalisasiKemampuan(
                data.kemampuan_komputer
            ),

            kemampuan_komunikasi: normalisasiKemampuan(
                data.kemampuan_komunikasi
            ),

            keterampilan_praktik: normalisasiKemampuan(
                data.keterampilan_praktik ??
                data.kemampuan_teknis
            ),

            kebutuhan_pelatihan: normalisasiTarget(
                data.kebutuhan_pelatihan ??
                data.kategori_target
            )
        };
    }


    /* =================================================
       9. ENTROPY
    ================================================= */

    function hitungEntropy(data) {

        if (!data.length) return 0;

        const jumlahKelas = {};

        data.forEach(item => {

            const kelas = item[TARGET];

            jumlahKelas[kelas] =
                (jumlahKelas[kelas] || 0) + 1;

        });

        let entropy = 0;

        Object.values(jumlahKelas).forEach(jumlah => {

            const probabilitas = jumlah / data.length;

            entropy -= probabilitas * Math.log2(
                probabilitas
            );

        });

        return entropy;
    }


    /* =================================================
       10. MEMBAGI DATA
    ================================================= */

    function bagiData(data, atribut) {

        const kelompok = {};

        data.forEach(item => {

            const nilai = item[atribut];

            if (!kelompok[nilai]) {
                kelompok[nilai] = [];
            }

            kelompok[nilai].push(item);

        });

        return kelompok;
    }


    /* =================================================
       11. INFORMATION GAIN
    ================================================= */

    function hitungGain(data, atribut) {

        if (!data.length) return 0;

        const entropyAwal = hitungEntropy(data);

        const kelompok = bagiData(data, atribut);

        let entropySesudah = 0;

        Object.values(kelompok).forEach(grup => {

            const bobot = grup.length / data.length;

            entropySesudah +=
                bobot * hitungEntropy(grup);

        });

        return entropyAwal - entropySesudah;
    }


    /* =================================================
       12. KELAS MAYORITAS
    ================================================= */

    function kelasTerbanyak(data) {

        const jumlah = {};

        data.forEach(item => {

            const kelas = item[TARGET];

            jumlah[kelas] =
                (jumlah[kelas] || 0) + 1;

        });

        return Object.keys(jumlah).sort((a, b) =>
            jumlah[b] - jumlah[a] ||
            a.localeCompare(b)
        )[0];
    }


    /* =================================================
       13. MEMBENTUK POHON ID3
    ================================================= */

    function buatPohon(data, atributTersedia) {

        if (!data.length) {
            throw new Error(
                "Data kosong saat membentuk pohon keputusan."
            );
        }

        const mayoritas = kelasTerbanyak(data);

        const kelasUnik = [
            ...new Set(data.map(item => item[TARGET]))
        ];

        // Jika seluruh data memiliki kelas yang sama.
        if (kelasUnik.length === 1) {

            return {
                jenis: "daun",
                hasil: kelasUnik[0],
                jumlahData: data.length
            };
        }

        // Jika seluruh atribut sudah digunakan.
        if (atributTersedia.length === 0) {

            return {
                jenis: "daun",
                hasil: mayoritas,
                jumlahData: data.length
            };
        }

        // Menghitung gain setiap atribut.
        const daftarGain = atributTersedia.map(atribut => ({
            atribut,
            gain: hitungGain(data, atribut)
        }));

        daftarGain.sort((a, b) =>
            b.gain - a.gain ||
            a.atribut.localeCompare(b.atribut)
        );

        const terbaik = daftarGain[0];

        // Tidak ada atribut yang dapat memberikan pemisahan.
        if (terbaik.gain <= 0) {

            return {
                jenis: "daun",
                hasil: mayoritas,
                jumlahData: data.length
            };
        }

        const atributTerbaik = terbaik.atribut;

        const kelompok = bagiData(
            data,
            atributTerbaik
        );

        const atributBerikutnya = atributTersedia.filter(
            atribut => atribut !== atributTerbaik
        );

        const cabang = {};

        Object.keys(kelompok).sort().forEach(nilai => {

            cabang[nilai] = buatPohon(
                kelompok[nilai],
                atributBerikutnya
            );

        });

        return {

            jenis: "node",

            atribut: atributTerbaik,

            gain: terbaik.gain,

            hasilMayoritas: mayoritas,

            jumlahData: data.length,

            cabang

        };
    }


    /* =================================================
       14. MELATIH MODEL
    ================================================= */

    function latihModel(data) {

        if (!Array.isArray(data) || data.length === 0) {

            throw new Error(
                "Data pelatihan tidak tersedia."
            );
        }

        const hasilNormalisasi = data.map(
            normalisasiBaris
        );

        const dataValid = hasilNormalisasi.filter(item => {

            return (

                item.usia &&

                item.pendidikan &&

                item.pengalaman_kerja &&

                item.minat_bidang &&

                item.kemampuan_komputer &&

                item.kemampuan_komunikasi &&

                item.keterampilan_praktik &&

                DAFTAR_TARGET.includes(item[TARGET])

            );
        });

        if (dataValid.length !== data.length) {

            throw new Error(
                "Ada baris dataset tidak lengkap atau target tidak valid. " +
                "Data valid: " + dataValid.length +
                " dari " + data.length + "."
            );
        }

        dataLatih = dataValid;

        pohonKeputusan = buatPohon(
            dataLatih,
            [...ATRIBUT]
        );

        informasiModel = {

            jumlahData: dataLatih.length,

            jumlahAtribut: ATRIBUT.length,

            entropyAwal: hitungEntropy(dataLatih),

            akarPohon: pohonKeputusan.atribut || "Daun",

            atribut: [...ATRIBUT],

            target: TARGET

        };

        console.log(
            "Model Decision Tree ID3 berhasil dilatih."
        );

        console.log(
            "Informasi model:",
            informasiModel
        );

        console.log(
            "Pohon keputusan:",
            pohonKeputusan
        );

        return informasiModel;
    }


    /* =================================================
       15. MEMUAT DATASET
       Mendukung dua kemungkinan lokasi:
       - Algoritma/Dataset/
       - Dataset/ di luar folder Algoritma/
    ================================================= */

    async function ambilFileDataset() {

        if (!alamatScript) {

            throw new Error(
                "Alamat decision-tree.js tidak ditemukan."
            );
        }

        const daftarAlamat = [

            new URL(
                "../Dataset/" + NAMA_DATASET,
                alamatScript
            ),

            new URL(
                "./Dataset/" + NAMA_DATASET,
                alamatScript
            )

        ];

        let kesalahanTerakhir = null;

        for (const alamat of daftarAlamat) {

            try {

                const respons = await fetch(alamat);

                if (!respons.ok) {

                    kesalahanTerakhir = new Error(
                        "HTTP " + respons.status +
                        " saat membaca " + alamat.href
                    );

                    continue;
                }

                const teks = await respons.text();

                if (!teks.trim()) {

                    kesalahanTerakhir = new Error(
                        "File dataset kosong: " + alamat.href
                    );

                    continue;
                }

                console.info(
                    "Dataset berhasil ditemukan:",
                    alamat.href
                );

                return teks;

            } catch (error) {

                kesalahanTerakhir = error;

            }
        }

        throw new Error(
            "Dataset " + NAMA_DATASET +
            " tidak ditemukan pada lokasi yang diperiksa. " +
            (kesalahanTerakhir?.message || "")
        );
    }


    async function muatDataset() {

        // Model sudah berhasil dilatih.
        if (pohonKeputusan && informasiModel) {
            return informasiModel;
        }

        // Jika proses pemuatan sedang berjalan, gunakan proses yang sama.
        if (prosesMuatDataset) {
            return prosesMuatDataset;
        }

        prosesMuatDataset = (async function () {

            const teksCSV = await ambilFileDataset();

            const dataCSV = bacaCSV(teksCSV);

            return latihModel(dataCSV);

        })();

        try {

            return await prosesMuatDataset;

        } catch (error) {

            prosesMuatDataset = null;

            pohonKeputusan = null;

            informasiModel = null;

            dataLatih = [];

            throw error;

        }
    }


    /* =================================================
       16. PREDIKSI
    ================================================= */

    function prediksi(dataPeserta) {

        if (!pohonKeputusan) {

            throw new Error(
                "Model belum dilatih. Jalankan muatDataset() dahulu."
            );
        }

        const peserta = normalisasiBaris(dataPeserta);

        // Memeriksa kelengkapan atribut peserta.
        for (const atribut of ATRIBUT) {

            if (!peserta[atribut]) {

                throw new Error(
                    "Data peserta belum lengkap pada atribut: " +
                    atribut
                );
            }
        }

        let simpul = pohonKeputusan;

        while (simpul.jenis === "node") {

            const nilai = peserta[simpul.atribut];

            if (
                Object.prototype.hasOwnProperty.call(
                    simpul.cabang,
                    nilai
                )
            ) {

                simpul = simpul.cabang[nilai];

            } else {

                // Jika nilai tidak ditemukan pada cabang,
                // gunakan kelas mayoritas pada simpul tersebut.

                const kode = simpul.hasilMayoritas;

                return {

                    kode,

                    nama: NAMA_TARGET[kode],

                    keterangan:
                        "Prediksi menggunakan kelas mayoritas karena " +
                        "nilai atribut tidak ditemukan pada cabang.",

                    atributTidakDikenal: simpul.atribut

                };
            }
        }

        const kode = simpul.hasil;

        return {

            kode,

            nama: NAMA_TARGET[kode],

            keterangan:
                "Prediksi berdasarkan pohon keputusan ID3."

        };
    }


    /* =================================================
       17. INFORMASI MODEL
    ================================================= */

    function getInformasiModel() {

        return informasiModel
            ? { ...informasiModel }
            : null;
    }

    function getPohonKeputusan() {
        return pohonKeputusan;
    }

    function getDataLatih() {

        return dataLatih.map(item => ({
            ...item
        }));
    }


    /* =================================================
       18. API UNTUK FILE LAIN
    ================================================= */

    window.SkillUpDecisionTree = {

        muatDataset,

        latihModel,

        prediksi,

        hitungEntropy,

        hitungGain,

        getInformasiModel,

        getPohonKeputusan,

        getDataLatih

    };

})();
