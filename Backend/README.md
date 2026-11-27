# SkillUp — Backend Tahap 5 (PHP + MySQL)

Backend ini ditambahkan ke proyek Tahap 3–4 yang sudah ada. Desain halaman, logo, aset, dan alur inti tetap dipertahankan.

## Kebutuhan
- PHP 8.1 atau lebih baru
- MySQL 8.0+ / MariaDB yang mendukung JSON dan generated columns
- Ekstensi PHP: `pdo_mysql`, `fileinfo`, `openssl`, `session`
- Composer (untuk PHPMailer dan fitur OTP email)

## Instalasi lokal dengan XAMPP
1. Salin folder proyek ke `C:\xampp\htdocs\SkillUp`.
2. Jalankan Apache dan MySQL dari XAMPP.
3. Buka phpMyAdmin, buat/import database dengan menjalankan `Backend/database/schema.sql`.
4. Jalankan juga `Backend/database/seed.sql` untuk memasukkan delapan program katalog contoh yang sebelumnya sudah tersedia pada prototipe. Jika program contoh tidak ingin digunakan, langkah ini boleh dilewati.
5. Salin `Backend/.env.example` menjadi `Backend/.env`, lalu sesuaikan host, nama database, username, dan password MySQL. File `.env` dibaca otomatis oleh konfigurasi PHP dan tidak boleh diunggah ke repositori.
6. Buka terminal pada folder `Backend`, lalu jalankan `composer install`.
7. Buat akun Admin dari terminal:
   `php bin/create-admin.php`
   Isi nama, Gmail, nomor HP, dan password Admin saat diminta. Password minimal 8 karakter dan memuat huruf besar, huruf kecil, angka, serta karakter khusus. Pendaftaran publik tidak dapat membuat Admin.
8. Buka `http://localhost/SkillUp/HalamanUtama/Beranda/index.html`.

> Jika folder proyek memiliki nama lain, gunakan nama folder tersebut pada URL. Jangan membuka halaman melalui `file://` atau Live Server; backend PHP harus dijalankan melalui Apache/PHP.

## Akun Admin
Akun Admin tidak lagi dibuat otomatis oleh JavaScript dan tidak ada password demo yang disimpan di browser. Gunakan `Backend/bin/create-admin.php` untuk membuat akun Admin pertama.

## Konfigurasi OTP Gmail
1. Buat App Password khusus untuk aplikasi email pengirim.
2. Isi variabel SMTP pada environment server. Jangan menaruh password email pada JavaScript atau mengunggahnya ke repositori.
3. Pastikan `composer install` telah memasang PHPMailer.
4. Endpoint reset password mengirim kode 6 digit yang berlaku 15 menit dan hanya dapat digunakan sekali. Jika SMTP belum diatur, proses pengiriman tidak dapat berjalan; sistem tidak mengubah password secara diam-diam.

## Endpoint API
Semua endpoint berada pada `Backend/api/index.php?route=...` dan menggunakan sesi PHP, JSON, serta token CSRF untuk permintaan yang mengubah data.

- `GET auth/bootstrap`, `GET auth/me`
- `POST auth/register`, `POST auth/login`, `POST auth/logout`
- `POST auth/forgot-password`, `POST auth/reset-password`
- `GET profile`, `POST profile`, `DELETE profile/photo`
- `GET categories`, `GET trainings`, `GET trainings/{id}`
- `POST admin/trainings`, `POST admin/trainings/{id}`, `DELETE admin/trainings/{id}`
- `GET admin/participants`, `DELETE admin/participants/{id}` (menonaktifkan akun agar riwayat tetap aman)
- `GET/POST assessment/initial`
- `GET admin/assessments`, `POST admin/assessments/{id}/practical`, `POST admin/assessments/{id}/correct`
- `GET admin/classifications`, `POST admin/classifications/process`, `DELETE admin/classifications/{id}`
- `GET participant/recommendations`, `GET admin/dashboard`

## Keamanan yang diterapkan
- Password disimpan dengan `password_hash()` dan diverifikasi memakai `password_verify()`.
- Query database menggunakan PDO prepared statements.
- Sesi diregenerasi setelah login; cookie HttpOnly dan SameSite=Lax (Secure saat HTTPS). Perubahan password menaikkan versi sesi agar sesi lama tidak berlaku.
- Endpoint memeriksa role pada server, bukan hanya menyembunyikan tombol di browser.
- Token CSRF diwajibkan untuk permintaan yang mengubah data; login dan registrasi juga meminta token bootstrap.
- Validasi Gmail, password, nomor telepon, usia minimal 17 tahun, pendidikan minimal SMA/SMK/MA, tanggal pelatihan, dan unggahan gambar dilakukan di server.
- Login dibatasi maksimal 10 kegagalan per email/IP dalam 15 menit; permintaan OTP dibatasi maksimal 3 kali per akun dalam 15 menit.
- Foto hanya menerima JPEG/PNG/WEBP, maksimal 5 MB, MIME diperiksa melalui `fileinfo`, nama file acak, dan direktori unggahan melarang eksekusi skrip.
- Penilaian praktik dan hasil klasifikasi menyimpan riwayat. Program pelatihan dan akun peserta dinonaktifkan/diarsipkan, bukan dihapus secara fisik jika dapat memutus relasi.
- Aksi penting dicatat dalam `activity_logs`.

## ERD ringkas
- `users` 1—1 `participant_profiles` atau `admin_profiles`
- `training_categories` 1—N `training_programs`
- `users` (peserta) 1—N `initial_assessments` (riwayat; satu yang aktif)
- `initial_assessments` 1—N `practical_assessments` (riwayat; satu yang aktif)
- `users` (Admin) 1—N `practical_assessments`
- `initial_assessments` + `practical_assessments` menjadi sumber `classifications`
- `classifications` 1—N `classification_recommendations`
- `training_programs` 1—N `classification_recommendations`
- `users` 1—N `password_reset_tokens` dan `activity_logs`

Dataset CSV tetap menjadi dataset latih Decision Tree, terpisah dari data operasional peserta dan katalog program pelatihan.


Rencana pengujian manual tersedia pada `../Dokumentasi/RENCANA-PENGUJIAN-TAHAP5.md`.
