# Rencana Pengujian Tahap 5 SkillUp

Dokumen ini berisi skenario uji manual setelah PHP dan MySQL dijalankan di XAMPP. Kolom hasil aktual diisi setelah pengujian pada komputer pengembang.

| No. | Modul | Skenario | Hasil yang diharapkan |
|---:|---|---|---|
| 1 | Database | Import `schema.sql`, lalu `seed.sql` | Semua tabel dan delapan program contoh tersedia tanpa error |
| 2 | Admin | Jalankan `php bin/create-admin.php` | Akun role Admin dibuat; password tidak disimpan sebagai teks biasa |
| 3 | Registrasi | Daftar dengan Gmail valid dan password sesuai | Akun Peserta dan profil kosong tercatat di database |
| 4 | Registrasi | Daftar memakai email non-Gmail | Ditolak dengan pesan validasi dekat kolom email |
| 5 | Registrasi | Password 7 karakter | Ditolak |
| 6 | Registrasi | Password 8 karakter atau lebih dengan huruf besar, kecil, angka, simbol | Diterima |
| 7 | Registrasi | Nomor HP bukan 08 atau panjang di luar 10–12 digit | Ditolak |
| 8 | Registrasi | Pendidikan di bawah SMA/SMK/MA | Tidak tersedia di pilihan dan ditolak server jika dikirim manual |
| 9 | Login | Peserta login pada tab Peserta | Masuk ke Dashboard Peserta |
| 10 | Login | Akun Admin login pada tab Admin | Masuk ke Dashboard Admin |
| 11 | Otorisasi | Peserta mengakses endpoint Admin secara langsung | Server memberi respons 403 |
| 12 | Otorisasi | Sesi tidak ada/kedaluwarsa | Server memberi respons 401 dan halaman privat mengarahkan ke Login |
| 13 | Keamanan | Kirim POST tanpa token CSRF | Server menolak dengan respons 419 |
| 14 | Keamanan | Coba SQL injection pada kolom login/pencarian | Input diperlakukan sebagai nilai, bukan sintaks SQL |
| 15 | Profil | Isi profil dengan usia 16 tahun | Server menolak |
| 16 | Profil | Isi profil dengan usia 17 tahun atau lebih dan data lengkap | Profil tersimpan pada database |
| 17 | Foto Profil | Pilih Ambil Foto dan izinkan kamera browser | Video kamera tampil; tombol Ambil Foto membuat pratinjau foto |
| 18 | Foto Profil | Pilih foto dari Galeri | Pratinjau berubah dan file dapat disimpan |
| 19 | Foto Profil | Pilih Lihat Foto | Foto tampil dalam tampilan besar |
| 20 | Foto Profil | Pilih Hapus Foto lalu simpan profil | Path foto menjadi NULL dan avatar kembali ke default |
| 21 | Foto Profil | Unggah file non-gambar atau lebih dari 5 MB | Server menolak file |
| 22 | Asesmen Awal | Peserta mengirim asesmen pertama kali | Data tercatat dan formulir terkunci |
| 23 | Asesmen Awal | Peserta mencoba mengirim ulang melalui request manual | Server menolak duplikasi asesmen aktif |
| 24 | Penilaian Praktik | Admin menyimpan lima indikator, kemandirian, tingkat, dan catatan | Baris penilaian praktik baru tercatat |
| 25 | Riwayat | Admin mengubah penilaian praktik | Penilaian lama menjadi tidak aktif, tetapi tetap tersimpan |
| 26 | Koreksi Asesmen | Admin mengoreksi minat/kemampuan dengan alasan | Asesmen lama diarsipkan dan versi baru dibuat; penilaian praktik harus dilakukan ulang |
| 27 | Klasifikasi | Peserta belum memiliki penilaian praktik | Tidak diklasifikasikan |
| 28 | Klasifikasi | Peserta memenuhi profil, asesmen, dan penilaian praktik | ID3 memprediksi kategori dan menyimpan hasil |
| 29 | Rekomendasi | Ada program Published pada kategori prediksi | Program tersebut muncul pada akun Peserta |
| 30 | Rekomendasi | Tidak ada program Published yang cocok | Peserta melihat pesan belum ada program yang tersedia |
| 31 | Program | Admin menambah program dengan tanggal valid dan kategori resmi | Program tersimpan di MySQL |
| 32 | Program | Admin mengubah program | Perubahan tampil setelah data dimuat ulang |
| 33 | Program | Admin menghapus program | Program diarsipkan; relasi rekomendasi lama tidak rusak |
| 34 | Peserta | Admin menonaktifkan akun | Peserta tidak dapat login, riwayat tetap tersimpan |
| 35 | Klasifikasi | Admin mengarsipkan hasil | Hasil tidak lagi menjadi hasil aktif; riwayat tetap ada |
| 36 | Lupa Password | Minta OTP pada Gmail yang terdaftar | Email berisi kode 6 digit dikirim jika SMTP dikonfigurasi |
| 37 | Lupa Password | Masukkan OTP salah atau kedaluwarsa | Password tidak berubah |
| 38 | Lupa Password | Masukkan OTP benar dan password baru yang valid | Password berubah; sesi lama tidak lagi berlaku |
| 39 | Logout | Klik Keluar | Sesi server dihancurkan dan halaman privat tidak dapat dibuka kembali |
| 40 | Audit | Lakukan registrasi, login, perubahan profil, penilaian, dan klasifikasi | Aktivitas penting tercatat pada `activity_logs` |

## Catatan pengujian kamera

Akses kamera browser memerlukan HTTPS atau `localhost` pada browser modern. Jika aplikasi dibuka melalui alamat IP jaringan lokal atau HTTP biasa, browser dapat menolak `getUserMedia()`. Dalam kondisi tersebut, gunakan Galeri atau jalankan aplikasi melalui localhost/HTTPS.

## Batasan lingkungan pengujian

Pengujian statis dapat memeriksa sintaks PHP/JavaScript dan kelengkapan file. Pengujian database, login end-to-end, unggah foto, dan pengiriman email wajib dilakukan pada lingkungan yang memiliki ekstensi `pdo_mysql`, server MySQL, Apache/PHP, serta konfigurasi SMTP yang benar.
