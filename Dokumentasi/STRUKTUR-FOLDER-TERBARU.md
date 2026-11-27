# Struktur Folder SkillUp (Tahap 3–4)

## Halaman utama website
Semua halaman publik dikelompokkan di dalam `HalamanUtama/`:
- `HalamanUtama/Beranda/` — halaman awal.
- `HalamanUtama/InformasiPelatihan/` — katalog pelatihan publik.
- `HalamanUtama/InformasiPelatihan/DetailPelatihan/` — detail dari katalog publik.
- `HalamanUtama/Tentang/` — informasi tentang SkillUp.

## Halaman peserta
Halaman peserta berada di `Pengguna/`. Folder `Pengguna/InformasiPelatihan/` masih menyimpan halaman katalog lama untuk kompatibilitas, tetapi tidak ditampilkan sebagai menu sidebar peserta. Alur peserta menuju detail program melalui kartu pada Hasil Rekomendasi. Sumber data katalog tetap bersama melalui `Shared/JS/data-pelatihan.js`.

## Area lain
Folder `Admin`, `Autentikasi`, `Algoritma`, `Assets`, `Dataset`, `Dokumentasi`, dan `Shared` tetap berada di tingkat utama proyek.

## Halaman yang dibuka pertama kali
Buka `HalamanUtama/Beranda/index.html` untuk menjalankan halaman awal website.
