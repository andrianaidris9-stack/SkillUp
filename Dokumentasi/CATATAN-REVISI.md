# Catatan Revisi SkillUp

- Logo resmi tetap menggunakan `Assets/img/logo-skillup.png`.
- Halaman publik sudah diarahkan ke tujuan sistem pemetaan kebutuhan pelatihan kerja, bukan platform pembelajaran online.
- Navigasi FAQ dan tombol ajakan daftar yang berulang pada halaman Tentang/Detail Pelatihan dihilangkan.
- Katalog dan pengelolaan Admin menggunakan delapan kategori resmi SkillUp.
- Ilustrasi kategori disimpan sebagai SVG lokal di `Assets/img/pelatihan/`.
- Form pendaftaran umum hanya membuat akun Peserta.
- Data latar belakang peserta dikelola pada Profil; asesmen awal hanya meminta minat dan kemampuan komputer/komunikasi.
- Keterampilan praktik dicatat Admin berdasarkan tes/pengamatan.
- Halaman Data Peserta, Data Asesmen, Hasil Klasifikasi, Profil Admin, dan Hasil Rekomendasi disiapkan sebagai modul alur baru.
- Modul LMS lama yang tidak lagi sesuai dengan tujuan SkillUp dikeluarkan dari struktur aktif.
- PHP/MySQL belum termasuk revisi ini.
- Halaman Data Peserta menyediakan penghapusan akun dengan pembersihan data profil, notifikasi, asesmen, dan hasil klasifikasi terkait.
- Halaman Data Asesmen menggabungkan pembacaan asesmen peserta dan penilaian praktik Admin; asesmen yang sudah dinilai dipertahankan sebagai riwayat dan tidak dihapus permanen.
- Hasil Klasifikasi dapat diproses ulang dan hasil yang tidak valid dapat dihapus tanpa menghapus data asesmen.
- Validasi nama pendaftar hanya menerima huruf dan pemisah nama yang wajar, dengan minimal tiga huruf.
- Tautan sinkronisasi foto profil pada Dashboard Peserta diperbaiki agar menggunakan file profile-sync yang benar.
- CTA berulang pada hero Beranda dihapus, tombol Dashboard Peserta diarahkan ke halaman rekomendasi internal, dan footer tidak lagi menampilkan tahun/atribusi lama yang tidak diperlukan.
- Penyimpanan data Tahap 4 tetap menggunakan localStorage; autentikasi aman dan penyimpanan server tetap menjadi pekerjaan Tahap 5.

## Sinkronisasi akun dan asesmen

- Email pendaftaran dan pemulihan password dinormalisasi menjadi huruf kecil dan divalidasi dengan pola Gmail `nama@gmail.com`.
- Nomor HP dari akun pendaftaran menjadi nilai awal pada Edit Profil; profil tetap menyimpan nomor pada properti `nomor` dan akun pada properti `phone`.
- Email profil mengikuti identitas login dan ditampilkan dalam huruf kecil agar perubahan email tidak memutus relasi data peserta.
- Data Asesmen Admin, Penilaian Teknis, dan Dashboard Admin menggabungkan daftar asesmen global dengan kunci asesmen per akun.
- Seluruh halaman harus dibuka melalui alamat/origin Live Server yang sama. `localStorage` pada `file://`, `localhost`, dan port yang berbeda tidak saling berbagi data.
- Dashboard Peserta menampilkan minat bidang sebagai informasi ringkasan dan hanya menyediakan satu tombol aksi utama. Katalog tidak menjadi menu sidebar peserta; peserta membuka detail program melalui Hasil Rekomendasi.
- Peserta mengirim satu asesmen awal aktif. Setelah dikirim, peserta tidak dapat mengubah atau menghapus jawaban; koreksi/asesmen ulang dikelola Admin dan riwayat tetap dipertahankan.


## Penyelarasan lanjutan Tahap 3–4

- Navigasi peserta dibatasi menjadi Dashboard, Profil, Asesmen Awal, dan Hasil Rekomendasi. Katalog tidak lagi menjadi menu tersendiri di Dashboard; akses detail pelatihan tetap berasal dari hasil rekomendasi.
- Topbar peserta dan Admin menggunakan tinggi tetap dan scrollbar gutter stabil untuk mengurangi pergeseran horizontal/vertikal antarhalaman.
- Edit Profil Peserta dan Admin menyediakan menu Kelola Foto: Ambil Foto, Pilih dari Galeri, dan Lihat Foto ukuran besar. Pemrosesan dan penyimpanan foto tetap menggunakan validasi halaman masing-masing.
- Foto pada halaman Profil Peserta dan Profil Admin dapat dibuka dalam tampilan besar.
- Email Admin demo dipertahankan sebagai identitas login dan tidak dapat diubah dari halaman Edit Profil.
- Pemulihan password lokal tanpa OTP dinonaktifkan. Integrasi OTP Gmail menunggu backend dan layanan email pada Tahap 5.
