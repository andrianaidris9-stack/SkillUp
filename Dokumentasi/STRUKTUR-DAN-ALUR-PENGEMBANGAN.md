# Struktur dan Alur Pengembangan SkillUp

## Kesepakatan Teknis
- Gunakan kode lama sebagai referensi dan pertahankan fungsi yang masih sesuai dengan alur pengembangan terbaru.
- HTML digunakan untuk struktur halaman, CSS untuk tampilan, dan JavaScript untuk interaksi serta logika pada sisi browser.
- Backend menggunakan PHP dan MySQL untuk menangani proses server, autentikasi, otorisasi, dan penyimpanan data secara permanen.
- Gunakan logo resmi `Assets/img/logo-skillup.png`.
- Terapkan satu sistem warna, tipografi, ukuran komponen, dan pola navigasi agar seluruh halaman memiliki tampilan yang konsisten.
- Algoritma Decision Tree tetap menjadi inti dalam proses pemetaan kebutuhan pelatihan peserta.

## Peran Pengguna

### 1. Admin
Admin bertanggung jawab untuk:
- Mengelola data peserta.
- Mengelola program dan informasi pelatihan.
- Memeriksa data asesmen awal peserta.
- Melakukan penilaian keterampilan praktik.
- Memproses dan meninjau hasil klasifikasi.
- Mengelola profil Admin.

### 2. Peserta
Peserta dapat:
- Melakukan pendaftaran dan login.
- Melengkapi serta mengelola profil.
- Mengisi asesmen awal.
- Melihat hasil klasifikasi dan rekomendasi pelatihan.
- Melihat informasi program pelatihan yang tersedia.

Tidak terdapat peran Instruktur yang terpisah. Penilaian keterampilan praktik dilakukan dan dicatat oleh Admin berdasarkan hasil tes atau pengamatan terhadap peserta.

Pendaftaran publik hanya dapat membuat akun dengan peran Peserta. Pembuatan akun Admin dilakukan melalui mekanisme khusus di sisi backend.

## Alur Peserta dan Admin
1. Peserta melakukan pendaftaran akun dan login ke sistem.
2. Peserta melengkapi profil yang mencakup tanggal lahir atau usia, pendidikan terakhir, pengalaman kerja, nomor telepon, dan alamat.
3. Peserta mengisi asesmen awal yang mencakup minat bidang, kemampuan komputer, dan kemampuan komunikasi.
4. Admin melakukan penilaian keterampilan praktik peserta berdasarkan indikator yang telah ditentukan.
5. Sistem menggabungkan data profil, asesmen awal, dan penilaian praktik sebagai masukan untuk proses klasifikasi menggunakan algoritma Decision Tree.
6. Admin meninjau hasil klasifikasi dan pemetaan kebutuhan pelatihan.
7. Peserta dapat melihat hasil klasifikasi serta rekomendasi program pelatihan melalui akun masing-masing.

## Aturan Data dan Algoritma
- Atribut yang digunakan dalam model mencakup usia, pendidikan, pengalaman kerja, minat bidang, kemampuan komputer, kemampuan komunikasi, dan keterampilan praktik.
- Dataset latih disimpan secara terpisah dari data asesmen operasional peserta yang tersimpan di database.
- Dataset yang digunakan saat ini merupakan data sintetis atau dummy untuk kebutuhan pengembangan dan pengujian sistem.
- Hasil pengujian menggunakan dataset sintetis tidak boleh dinyatakan sebagai bukti akurasi lapangan yang telah tervalidasi.
- Algoritma Decision Tree digunakan sebagai alat bantu pengambilan keputusan untuk memetakan kebutuhan pelatihan peserta, bukan sebagai sistem penempatan otomatis.
- Hasil klasifikasi dan rekomendasi tetap dapat ditinjau oleh Admin sesuai kebutuhan sistem.

## Tahapan Pengembangan

### Tahap 3 — Perancangan Antarmuka
- Implementasi struktur halaman menggunakan HTML.
- Pengembangan tampilan menggunakan CSS.
- Penerapan konsistensi UI/UX pada seluruh halaman website.

### Tahap 4 — Pengembangan Fungsionalitas
- Implementasi interaksi dan logika browser menggunakan JavaScript.
- Penerapan validasi formulir.
- Pengembangan autentikasi prototipe.
- Pengelolaan data peserta dan program pelatihan.
- Implementasi asesmen awal dan penilaian keterampilan praktik.
- Implementasi algoritma Decision Tree dan rekomendasi pelatihan.

### Tahap 5 — Pengembangan Backend
- Implementasi backend menggunakan PHP dan database MySQL.
- Penerapan autentikasi dan otorisasi di sisi server berdasarkan peran pengguna.
- Pengelolaan serta penyimpanan data secara permanen.
- Implementasi API untuk menghubungkan antarmuka dengan backend.
- Penerapan keamanan, termasuk password hashing, PDO prepared statements, pengelolaan sesi, dan perlindungan CSRF.
- Implementasi pengiriman serta verifikasi kode OTP melalui email untuk proses reset password.
- Pengelolaan riwayat asesmen, penilaian praktik, klasifikasi, dan aktivitas penting sistem.