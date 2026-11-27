# Matriks CRUD SkillUp — Tahap 5

CRUD disesuaikan dengan fungsi data, hak akses, dan kebutuhan menjaga riwayat. Tidak semua modul harus memberikan empat operasi kepada setiap role.

| Modul | Create | Read | Update | Delete / Arsip |
|---|---|---|---|---|
| Akun Peserta | Publik membuat akun Peserta | Peserta dan Admin sesuai role | Reset password melalui OTP Gmail | Admin menonaktifkan akun; riwayat tetap disimpan |
| Akun Admin | Dibuat oleh pengelola melalui CLI | Admin yang login | Reset password melalui OTP; profil terpisah | Tidak ada pendaftaran atau penghapusan Admin dari halaman publik |
| Profil Peserta | Dibuat otomatis saat registrasi | Peserta sendiri dan Admin | Peserta mengubah data profil dan foto | Tidak dihapus terpisah; mengikuti siklus akun |
| Profil Admin | Dibuat saat akun Admin dibuat | Admin sendiri | Admin mengubah nama dan foto | Tidak dihapus dari halaman profil |
| Asesmen Awal | Peserta mengirim satu asesmen aktif | Peserta sendiri dan Admin | Peserta tidak mengubah; Admin mengoreksi dengan membuat versi baru | Tidak ada hapus mandiri; versi lama diarsipkan |
| Penilaian Praktik | Admin membuat penilaian | Admin dan proses klasifikasi | Penilaian ulang membuat versi baru | Riwayat penilaian lama dipertahankan |
| Hasil Klasifikasi | Admin menjalankan Decision Tree ID3 | Admin dan Peserta pemilik hasil | Diproses ulang ketika input berubah | Admin mengarsipkan hasil aktif; riwayat tetap tersimpan |
| Program Pelatihan | Admin menambah program | Admin dan katalog publik untuk status Published | Admin mengubah informasi/status program | Admin mengarsipkan (soft delete) agar relasi rekomendasi tetap aman |
| Rekomendasi Program | Dibuat otomatis dari hasil klasifikasi | Peserta pemilik hasil dan Admin | Diperbarui saat klasifikasi diproses ulang | Tidak dihapus terpisah; mengikuti hasil klasifikasi |
| Log Aktivitas | Dibuat otomatis oleh backend | Pengelola berwenang melalui database | Tidak diedit dari UI | Tidak dihapus dari halaman operasional |

## Aturan validasi

- Validasi sisi browser membantu pengguna, tetapi backend PHP tetap memvalidasi ulang setiap permintaan.
- Email akun harus Gmail valid dan dinormalisasi ke huruf kecil.
- Nomor HP diawali `08` dan terdiri dari 10–12 digit.
- Password minimal 8 karakter serta berisi huruf besar, huruf kecil, angka, dan karakter khusus.
- Usia peserta minimal 17 tahun; tidak ada batas maksimum umum.
- Pendidikan terakhir minimal SMA/SMK/MA; pilihan berikutnya Diploma, S1, S2, dan S3.
- Foto menerima JPEG, PNG, atau WEBP dengan ukuran maksimal 5 MB.
- Durasi pelatihan berupa bilangan bulat minimal 1 jam; biaya tidak boleh negatif; tanggal selesai tidak boleh sebelum tanggal mulai.

## Alasan kebijakan penghapusan

- Akun Peserta dinonaktifkan agar peserta tidak dapat login, tetapi data asesmen dan riwayatnya tetap tersedia untuk audit.
- Asesmen awal dan penilaian praktik menyimpan versi lama karena menjadi dasar keputusan klasifikasi.
- Hasil klasifikasi diarsipkan, bukan dihapus permanen.
- Program pelatihan diarsipkan agar foreign key pada rekomendasi historis tidak rusak.
- Operasi delete fisik hanya boleh dilakukan melalui prosedur administrasi database yang mempertimbangkan foreign key dan retensi data.

Data Tahap 4 pernah memakai `localStorage` untuk prototipe. Pada Tahap 5, data operasional utama dibaca dan ditulis melalui PHP API ke MySQL; `localStorage` yang tersisa hanya menjadi cache tampilan ringan, bukan sumber otorisasi atau penyimpanan utama.
