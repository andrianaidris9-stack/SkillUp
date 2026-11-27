# Daftar Pengujian Manual Tahap 3 dan Tahap 4

> Dokumen ini adalah daftar historis untuk pengujian UI/prototipe Tahap 3–4. Setelah integrasi Tahap 5, gunakan juga `RENCANA-PENGUJIAN-TAHAP5.md`; akun demo dan penyimpanan localStorage tidak lagi menjadi sumber autentikasi/data operasional.

Daftar ini digunakan untuk pemeriksaan akhir di browser setelah proyek dibuka melalui Live Server. Pemeriksaan sintaks JavaScript dan tautan lokal dilakukan pada paket revisi. Pengujian interaksi visual penuh tetap perlu dijalankan pada browser pengguna karena lingkungan pemeriksaan ini tidak dapat membuka halaman lokal melalui browser.

## A. Halaman publik
- [ ] Beranda tampil dengan logo SkillUp, header, konten, dan footer yang konsisten.
- [ ] Navigasi Beranda, Pelatihan, dan Tentang membuka halaman yang benar.
- [ ] Kartu kategori Beranda membuka katalog dengan filter kategori terkait.
- [ ] Halaman Tentang tidak menampilkan tombol Daftar Sekarang.
- [ ] Katalog menampilkan program berstatus Published dengan kategori resmi.
- [ ] Pencarian katalog memfilter nama, kategori, tingkat, dan deskripsi.
- [ ] Filter kategori dan tingkat dapat digunakan bersama.
- [ ] Tombol Lihat Detail membuka detail sesuai ID.
- [ ] Detail pelatihan menampilkan deskripsi, tingkat, durasi, biaya, instruktur, dan tanggal.
- [ ] Tidak ada menu FAQ atau tombol pendaftaran pelatihan pada detail.

## B. Autentikasi
- [ ] Pendaftaran umum hanya membuat akun Peserta.
- [ ] Nama, email, nomor telepon, password, dan persetujuan syarat divalidasi.
- [ ] Email pendaftaran otomatis menggunakan huruf kecil dan harus tepat berformat `nama@gmail.com`.
- [ ] Email yang sudah terdaftar ditolak.
- [ ] Login Peserta berhasil dan mengarah ke Dashboard Peserta.
- [ ] Login Admin yang dibuat melalui `Backend/bin/create-admin.php` berhasil dan mengarah ke Dashboard Admin.
- [ ] Akun Peserta tidak dapat masuk melalui tab Admin, dan sebaliknya.
- [ ] Logout menampilkan konfirmasi dan mengarahkan kembali ke Login.
- [ ] Lupa Password meminta OTP 6 digit ke Gmail; pengiriman email memerlukan konfigurasi SMTP pada `Backend/.env`.

## C. Peserta
- [ ] Dashboard menampilkan status kelengkapan profil, status asesmen, dan minat bidang (tanpa mengulang status rekomendasi).
- [ ] Dashboard hanya menampilkan satu tombol aksi utama menuju langkah peserta berikutnya.
- [ ] Navigasi peserta hanya berisi Dashboard, Profil, Asesmen Awal, dan Hasil Rekomendasi; katalog dibuka melalui detail program dari Hasil Rekomendasi, bukan menu Dashboard.
- [ ] Nomor HP dari pendaftaran otomatis muncul di Edit Profil dan tidak hilang saat profil disimpan.
- [ ] Email pada profil tampil konsisten dalam huruf kecil dan menjadi identitas login yang tidak diubah dari Edit Profil.
- [ ] Profil dapat menyimpan tanggal lahir, pendidikan terakhir, pengalaman kerja, nomor telepon, dan alamat.
- [ ] Tanggal lahir harus menghasilkan usia minimal 17 tahun; tidak ada batas maksimum umum dan tanggal masa depan ditolak.
- [ ] Nomor telepon divalidasi.
- [ ] Foto profil menerima format gambar yang diizinkan dan ukuran sesuai batas.
- [ ] Menu foto menyediakan Ambil Foto melalui kamera browser, Pilih dari Galeri, Lihat Foto, dan Hapus Foto pada halaman Edit Profil Peserta.
- [ ] Foto pada halaman Profil Peserta dapat dibuka dalam tampilan besar.
- [ ] Asesmen Awal mengambil usia, pendidikan, dan pengalaman kerja dari profil.
- [ ] Asesmen hanya meminta minat, kemampuan komputer, dan kemampuan komunikasi.
- [ ] Peserta dapat membuat dan membaca asesmen awal. Setelah dikirim, peserta tidak dapat mengubah atau menghapusnya sendiri; koreksi/asesmen ulang dikendalikan Admin dan riwayat penilaian dipertahankan.
- [ ] Data asesmen peserta dan Admin dibaca dari database MySQL yang sama.
- [ ] Keterampilan praktik tidak diisi sendiri oleh peserta.
- [ ] Halaman Hasil Rekomendasi menampilkan hasil hanya untuk akun peserta yang sedang login.
- [ ] Topbar dan avatar Peserta tetap pada posisi/ukuran yang sama di Dashboard, Profil, Asesmen Awal, dan Hasil Rekomendasi.

## D. Admin
- [ ] Dashboard menampilkan jumlah peserta, program, asesmen, dan penilaian praktik yang menunggu.
- [ ] Data Peserta menampilkan akun dan ringkasan profil.
- [ ] Data Asesmen menampilkan minat dan kemampuan awal peserta.
- [ ] Penilaian Praktik menerima tingkat Dasar, Menengah, atau Mahir dari Admin.
- [ ] Hasil Klasifikasi hanya memproses peserta dengan seluruh atribut yang valid.
- [ ] Hasil klasifikasi tersimpan dan dapat dilihat oleh peserta yang bersangkutan.
- [ ] Admin dapat menambah, mengedit, melihat detail, dan menghapus program pelatihan.
- [ ] Program dengan kategori di luar delapan kategori resmi tidak dapat dipublikasikan.
- [ ] Thumbnail bawaan lokal tampil dan gambar unggahan dapat dipratinjau.
- [ ] Profil Admin menyediakan pilihan Ambil Foto melalui kamera browser, Pilih dari Galeri, Lihat Foto, dan Hapus Foto pada halaman Edit Profil.
- [ ] Foto pada halaman Profil Admin dapat dibuka dalam tampilan besar.
- [ ] Email Admin yang dibuat melalui CLI menjadi identitas login dan tidak dapat diubah dari Edit Profil.
- [ ] Topbar dan avatar Admin tetap pada posisi/ukuran yang sama saat berpindah halaman.

## E. Catatan batas prototipe
- [ ] Pengujian visual Tahap 3–4 menggunakan data contoh; pengujian Tahap 5 memakai akun dan database MySQL.
- [ ] Pada prototipe Tahap 3–4 data sementara berada di localStorage; pada Tahap 5 data akun dan operasional disimpan di MySQL.
- [ ] Dataset 100 baris masih sintetis; hasil model belum divalidasi menggunakan data lapangan.
- [ ] Tahap 5 telah menyediakan backend PHP/MySQL, sesi server, otorisasi role, validasi sisi server, dan penyimpanan permanen; ikuti `Backend/README.md` untuk konfigurasi.
- [ ] Admin dapat menonaktifkan akun peserta dengan konfirmasi tanpa menghapus riwayat asesmen/klasifikasi.
- [ ] Admin dapat membuka penilaian praktik dari Data Asesmen dan menyimpan perubahan; riwayat asesmen tetap dipertahankan.
- [ ] Admin dapat mengarsipkan satu hasil klasifikasi tanpa menghapus profil dan asesmen peserta.
- [ ] Admin dapat menambah, membaca, mengubah, dan mengarsipkan data pelatihan; gambar dapat diunggah, dipratinjau, dan diganti.
- [ ] Data hasil klasifikasi peserta yang dihapus tidak lagi muncul pada halaman rekomendasi peserta.
