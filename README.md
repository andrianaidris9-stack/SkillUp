# SkillUp — Pengelolaan Pelatihan Kerja Kota Ternate

SkillUp adalah sistem pengelolaan pelatihan kerja yang membantu Admin mengelola akun peserta, program pelatihan, asesmen, penilaian praktik, dan hasil klasifikasi kebutuhan pelatihan menggunakan Decision Tree ID3.

## Tahap pengembangan

- **Tahap 3 — HTML dan CSS:** struktur halaman, komponen antarmuka, tata letak responsif, navigasi, dan aset visual.
- **Tahap 4 — JavaScript:** interaksi halaman, validasi sisi browser, alur peserta/Admin, asesmen, penilaian praktik, dan prototipe Decision Tree.
- **Tahap 5 — PHP dan MySQL:** backend API, database relasional, autentikasi berbasis sesi, role-based access control, validasi server, penyimpanan data permanen, audit log, dan OTP reset password melalui SMTP.

## Struktur proyek

```text
SkillUp/
├── Admin/                 # Dashboard dan pengelolaan oleh Admin
├── Algoritma/             # Pengujian Decision Tree di browser
├── Assets/                # Logo, ikon, dan gambar
├── Autentikasi/           # Daftar, Login, Lupa Password
├── Backend/
│   ├── api/index.php      # Endpoint API PHP
│   ├── config/            # Konfigurasi koneksi database
│   ├── database/          # schema.sql dan seed.sql
│   ├── bin/               # Pembuatan akun Admin via CLI
│   └── uploads/           # Foto profil dan sampul program
├── Dataset/               # Dataset CSV untuk Decision Tree
├── Dokumentasi/           # ERD, alur, dan catatan proyek
├── HalamanUtama/          # Beranda dan katalog publik
├── Pengguna/              # Dashboard dan fitur Peserta
└── Shared/                # JavaScript/CSS bersama, API client, kamera foto
```

## Alur utama sistem

1. Calon peserta mendaftar. Pendaftaran publik hanya dapat membuat akun Peserta.
2. Peserta login dan melengkapi profil: tanggal lahir, pendidikan, pengalaman kerja, nomor HP, alamat, dan foto.
3. Peserta mengirim satu Asesmen Awal: minat bidang, kemampuan komputer, dan komunikasi.
4. Admin memeriksa data asesmen dan mencatat penilaian keterampilan praktik.
5. Admin menjalankan klasifikasi Decision Tree ID3 pada data peserta yang memenuhi syarat.
6. Sistem menyimpan hasil klasifikasi dan menghubungkannya dengan program pelatihan aktif pada kategori yang diprediksi.
7. Peserta melihat hasil klasifikasi dan program rekomendasi pada akun masing-masing.

## Delapan kategori pelatihan

- KEC — Kecantikan dan Tata Rias
- KUL — Kuliner dan Tata Boga
- TEK — Teknik dan Alat Berat
- BUS — Tata Busana dan Kerajinan
- ADM — Administrasi dan Teknologi
- LIS — Kelistrikan dan Keterampilan Teknik
- PAR — Pariwisata dan Perhotelan
- WIR — Kewirausahaan

## Menjalankan aplikasi (XAMPP)

1. Instal dan jalankan Apache serta MySQL melalui XAMPP.
2. Salin folder proyek ke `C:\xampp\htdocs\SkillUp` (nama folder boleh berbeda).
3. Buka phpMyAdmin, lalu jalankan `Backend/database/schema.sql`.
4. Jalankan `Backend/database/seed.sql` untuk memasukkan delapan program katalog contoh yang sudah ada pada prototipe. Langkah ini dapat dilewati jika ingin mengisi program sendiri.
5. Salin `Backend/.env.example` menjadi `Backend/.env`, lalu sesuaikan konfigurasi database. Nilai default cocok untuk XAMPP standar (`root` tanpa password); ubah jika MySQL milikmu memakai kredensial berbeda.
6. Pastikan PHP memiliki ekstensi `pdo_mysql`, `fileinfo`, dan `openssl`.
7. Buka terminal pada folder `Backend`, lalu jalankan `composer install` untuk memasang PHPMailer.
8. Buat akun Admin melalui terminal pada folder `Backend`:
   `php bin/create-admin.php`
   Isi nama, email, nomor HP, dan password Admin ketika diminta. Jangan membuat akun Admin melalui halaman Daftar.
9. Buka `http://localhost/SkillUp/HalamanUtama/Beranda/index.html`.

Jangan membuka halaman menggunakan `file://` atau Live Server untuk penggunaan backend. PHP harus dijalankan melalui Apache atau server PHP.

## Konfigurasi OTP Gmail

Fitur Lupa Password memakai kode OTP 6 digit yang berlaku 15 menit. Agar email benar-benar terkirim:

1. Siapkan akun Gmail pengirim dan App Password.
2. Isi `SKILLUP_SMTP_HOST`, `SKILLUP_SMTP_PORT`, `SKILLUP_SMTP_USER`, `SKILLUP_SMTP_PASS`, dan `SKILLUP_MAIL_FROM` pada `Backend/.env`.
3. Pastikan `composer install` sudah dijalankan.

Jangan menaruh App Password di JavaScript atau mengunggah file `.env` ke repositori.

## Keamanan dan pengelolaan data

- Password disimpan dengan `password_hash()` dan diverifikasi menggunakan `password_verify()`.
- Query database menggunakan PDO prepared statements.
- Sesi PHP diregenerasi setelah login; endpoint memeriksa autentikasi dan role pada server.
- Token CSRF digunakan untuk permintaan yang mengubah data.
- Validasi email Gmail, nomor HP, password, usia, pendidikan, tanggal pelatihan, dan file gambar dilakukan di server.
- Login memiliki pembatasan percobaan; OTP reset memiliki masa berlaku, batas percobaan, hash, dan penggunaan satu kali.
- Foto profil mendukung Ambil Foto melalui kamera browser, Galeri, Lihat Foto, dan Hapus Foto pada halaman profil Admin serta Peserta.
- Data asesmen dan penilaian praktik menyimpan riwayat. Akun peserta dinonaktifkan dan program pelatihan/hasil klasifikasi diarsipkan agar relasi data tidak rusak.
- Detail ERD dan penjelasan untuk persiapan asprak tersedia pada `Dokumentasi/ERD-SKILLUP-TAHAP5.md`.
- Penjelasan endpoint dan instalasi teknis tersedia pada `Backend/README.md`.
- Skenario pengujian manual tersedia pada `Dokumentasi/RENCANA-PENGUJIAN-TAHAP5.md`.

## Catatan

- Dua role: Peserta dan Admin. Penilaian praktik, klasifikasi, dan data pelatihan dikelola Admin.
- OTP lupa password: jika `SKILLUP_DEBUG=1` dan SMTP belum diisi, kode OTP ditampilkan di pop-up (mode pengembangan). Setelah SMTP Gmail diisi, kode dikirim lewat email. Matikan `SKILLUP_DEBUG` saat dikumpulkan.
- Hasil klasifikasi resmi dihitung oleh PHP. Folder `Algoritma/` hanya untuk pengujian ID3 di browser.
- Dataset latih tidak lagi memuat pendidikan SMP karena pendaftar minimal SMA/SMK/MA.

- Dataset `Dataset/SkillUp_Dataset_100.csv` berisi data contoh/sintetis. Hasil klasifikasi adalah rekomendasi pendukung keputusan, bukan bukti akurasi pada data lapangan.
- Dataset CSV adalah data latih model, sedangkan `training_programs` adalah katalog program nyata yang dikelola Admin. Keduanya sengaja dipisahkan.
- Data peserta operasional tidak otomatis ditambahkan ke dataset latih.
- Foto program bawaan kategori memakai ilustrasi SVG lokal. Foto yang diunggah Admin disimpan sebagai file dan path-nya dicatat di database.
- Database Tahap 5 dimulai sebagai penyimpanan baru. Delapan program contoh dari prototipe sudah disiapkan melalui `seed.sql`; akun, profil, dan asesmen yang sebelumnya hanya tersimpan di `localStorage` browser tidak ikut berada di dalam arsip RAR dan tidak dapat dipindahkan otomatis dari sini. Peserta perlu mendaftar kembali pada database baru.
- Fitur lama seperti FAQ, Materi, Evaluasi, Monitoring, dan Sertifikat tidak termasuk alur SkillUp saat ini.
