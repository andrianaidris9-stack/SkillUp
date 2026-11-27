# ERD dan Penjelasan Database SkillUp Kota Ternate

Dokumen ini mengikuti skema aktual pada `Backend/database/schema.sql`. Database operasional menggunakan MySQL/InnoDB. Dataset untuk melatih Decision Tree tetap berupa file CSV yang terpisah.

## 1. Diagram ERD

```mermaid
erDiagram
    USERS ||--o| PARTICIPANT_PROFILES : "memiliki profil peserta"
    USERS ||--o| ADMIN_PROFILES : "memiliki profil admin"
    USERS ||--o{ INITIAL_ASSESSMENTS : "mengirim asesmen"
    TRAINING_CATEGORIES ||--o{ INITIAL_ASSESSMENTS : "dipilih sebagai minat"
    TRAINING_CATEGORIES ||--o{ TRAINING_PROGRAMS : "mengelompokkan"
    INITIAL_ASSESSMENTS ||--o{ PRACTICAL_ASSESSMENTS : "memiliki riwayat penilaian"
    USERS ||--o{ PRACTICAL_ASSESSMENTS : "menjadi peserta"
    USERS ||--o{ PRACTICAL_ASSESSMENTS : "menilai sebagai admin"
    USERS ||--o{ CLASSIFICATIONS : "memiliki hasil"
    INITIAL_ASSESSMENTS ||--o{ CLASSIFICATIONS : "menjadi sumber"
    PRACTICAL_ASSESSMENTS ||--o{ CLASSIFICATIONS : "menjadi sumber"
    TRAINING_CATEGORIES ||--o{ CLASSIFICATIONS : "kategori prediksi"
    USERS ||--o{ CLASSIFICATIONS : "memproses sebagai admin"
    CLASSIFICATIONS ||--o{ CLASSIFICATION_RECOMMENDATIONS : "menghasilkan"
    TRAINING_PROGRAMS ||--o{ CLASSIFICATION_RECOMMENDATIONS : "direkomendasikan"
    USERS ||--o{ PASSWORD_RESET_TOKENS : "meminta reset"
    USERS ||--o{ ACTIVITY_LOGS : "melakukan aktivitas"

    USERS {
        bigint id PK
        enum role
        varchar name
        varchar email UK
        varchar phone
        varchar password_hash
        enum status
        int session_version
    }
    PARTICIPANT_PROFILES {
        bigint user_id PK_FK
        date birth_date
        varchar education
        varchar work_experience
        varchar address
        varchar photo_path
    }
    ADMIN_PROFILES {
        bigint user_id PK_FK
        varchar position
        varchar photo_path
    }
    TRAINING_CATEGORIES {
        char code PK
        varchar name UK
    }
    TRAINING_PROGRAMS {
        bigint id PK
        varchar title
        char category_code FK
        varchar level
        smallint duration_hours
        decimal fee
        date start_date
        date end_date
        enum status
        datetime deleted_at
    }
    INITIAL_ASSESSMENTS {
        bigint id PK
        bigint participant_id FK
        char interest_category_code FK
        enum computer_level
        enum communication_level
        enum status
        boolean is_current
    }
    PRACTICAL_ASSESSMENTS {
        bigint id PK
        bigint initial_assessment_id FK
        bigint participant_id FK
        bigint admin_id FK
        char category_code FK
        json indicators
        varchar independence_level
        enum practical_level
        boolean is_current
    }
    CLASSIFICATIONS {
        bigint id PK
        bigint participant_id FK
        bigint initial_assessment_id FK
        bigint practical_assessment_id FK
        char predicted_category_code FK
        varchar model_version
        json input_snapshot
        bigint processed_by_admin_id FK
        boolean is_current
    }
    CLASSIFICATION_RECOMMENDATIONS {
        bigint id PK
        bigint classification_id FK
        bigint training_program_id FK
    }
    PASSWORD_RESET_TOKENS {
        bigint id PK
        bigint user_id FK
        varchar token_hash
        datetime expires_at
        datetime used_at
        tinyint attempts
    }
    ACTIVITY_LOGS {
        bigint id PK
        bigint actor_user_id FK
        varchar action
        varchar entity_type
        varchar entity_id
        json details
        datetime created_at
    }
    AUTH_LOGIN_ATTEMPTS {
        bigint id PK
        varchar email
        varchar ip_address
        datetime attempted_at
        boolean succeeded
    }
```

## 2. Penjelasan primary key dan foreign key

- **Primary Key (PK)** adalah identitas unik setiap baris. Contoh: `users.id`, `training_programs.id`, dan `initial_assessments.id`.
- **Foreign Key (FK)** menghubungkan satu tabel dengan tabel lain dan menjaga agar referensi tidak menunjuk data yang tidak ada.
- `participant_profiles.user_id` sekaligus PK dan FK ke `users.id`. Karena itu satu akun Peserta hanya mempunyai satu profil Peserta.
- `admin_profiles.user_id` sekaligus PK dan FK ke `users.id`. Akun Admin memiliki profil Admin tersendiri.
- `training_programs.category_code` mengacu ke `training_categories.code`; satu kategori dapat memiliki banyak program, tetapi satu program hanya berada dalam satu kategori.
- `initial_assessments.participant_id` mengacu ke akun Peserta. `interest_category_code` mengacu ke kategori resmi.
- `practical_assessments.initial_assessment_id` menghubungkan penilaian praktik ke asesmen awal yang dinilai. `admin_id` mencatat Admin penilai. Penilaian ulang membuat baris baru sehingga riwayat sebelumnya tidak ditimpa.
- `classifications` menyimpan hasil prediksi dan referensi tepat ke asesmen awal serta penilaian praktik yang dipakai.
- `classification_recommendations` menghubungkan hasil klasifikasi dengan program yang cocok. Ini adalah tabel penghubung relasi many-to-many: satu hasil dapat merekomendasikan banyak program dan satu program dapat direkomendasikan pada banyak hasil klasifikasi.
- `password_reset_tokens` menyimpan hash OTP, batas waktu, status penggunaan, dan jumlah percobaan; kode OTP asli tidak disimpan.
- `activity_logs` mencatat tindakan penting Admin dan pengguna.
- `auth_login_attempts` menyimpan waktu percobaan login berdasarkan email dan alamat IP untuk membatasi percobaan berulang; tabel ini tidak menyimpan password.

## 3. Kardinalitas relasi

| Relasi | Kardinalitas | Makna |
|---|---|---|
| users — participant_profiles | 1 : 0..1 | Satu akun Peserta memiliki paling banyak satu profil Peserta |
| users — admin_profiles | 1 : 0..1 | Satu akun Admin memiliki paling banyak satu profil Admin |
| users — initial_assessments | 1 : N | Satu Peserta dapat memiliki beberapa versi asesmen sepanjang waktu; hanya satu versi aktif |
| training_categories — training_programs | 1 : N | Satu kategori menaungi banyak program |
| initial_assessments — practical_assessments | 1 : N | Satu asesmen awal dapat memiliki beberapa riwayat penilaian praktik |
| classifications — classification_recommendations | 1 : N | Satu hasil klasifikasi dapat menghasilkan banyak rekomendasi program |
| training_programs — classification_recommendations | 1 : N | Satu program dapat direkomendasikan ke banyak Peserta |
| classifications — training_programs | N : M | Direalisasikan melalui `classification_recommendations` |

Kolom `is_current` dan unique generated column memastikan hanya satu asesmen awal, penilaian praktik, dan hasil klasifikasi yang aktif pada ruang lingkupnya. Baris lama tetap disimpan sebagai riwayat.

## 4. Alur data sistem

1. Peserta mendaftar. Backend membuat baris `users` dengan role `user` dan profil kosong pada `participant_profiles`.
2. Peserta login. Backend mencari akun menggunakan prepared statement, memeriksa status dan role, lalu membandingkan password menggunakan `password_verify()`.
3. Peserta melengkapi profil: tanggal lahir, pendidikan, pengalaman kerja, alamat, nomor HP, dan foto. Backend memvalidasi ulang semua nilai.
4. Peserta mengirim satu asesmen awal. Data disimpan pada `initial_assessments` dan tidak dapat diedit/dihapus oleh Peserta setelah dikirim.
5. Admin membuka Data Asesmen dan memberikan penilaian praktik berdasarkan indikator pengamatan. Setiap penilaian baru disimpan pada `practical_assessments`; penilaian sebelumnya ditandai tidak aktif, bukan dihapus.
6. Admin menjalankan klasifikasi. Backend membaca dataset `SkillUp_Dataset_100.csv`, membangun pohon keputusan ID3, lalu memprediksi kategori berdasarkan usia, pendidikan, pengalaman kerja, minat, kemampuan komputer, komunikasi, dan keterampilan praktik.
7. Prediksi disimpan di `classifications`, lengkap dengan snapshot input dan versi model.
8. Backend mencari program berstatus `Published` pada kategori prediksi dan menyimpan hubungannya ke `classification_recommendations`.
9. Peserta melihat hasil klasifikasi dan daftar program yang sesuai di halaman Hasil Rekomendasi.

## 5. Mengapa dataset tidak menjadi tabel program pelatihan?

`SkillUp_Dataset_100.csv` adalah data latih algoritma: satu baris berisi atribut contoh dan label kebutuhan pelatihan. `training_programs` adalah katalog program nyata yang dikelola Admin. Keduanya memiliki fungsi berbeda:
- Dataset CSV dipakai untuk membangun pohon keputusan dan memprediksi kategori.
- Tabel `training_programs` dipakai untuk menampilkan program aktual yang tersedia.
- Setelah model memprediksi kategori, sistem mencocokkan kode kategori itu dengan program yang berstatus `Published`.

Dengan pemisahan ini, mengubah katalog program tidak otomatis mengubah dataset pelatihan model.

## 6. Aturan penghapusan dan CRUD

| Modul | Operasi yang disediakan | Aturan |
|---|---|---|
| Akun Peserta | Create, Read, Update, Delete administratif | Pendaftaran publik hanya membuat Peserta; Admin dapat menonaktifkan akun. Riwayat tidak dihapus |
| Profil Peserta/Admin | Read, Update | Identitas email login tidak dapat diubah dari form profil |
| Asesmen awal | Create oleh Peserta, Read oleh Peserta/Admin, koreksi administratif melalui versi baru | Tidak ada hapus oleh Peserta; riwayat disimpan |
| Penilaian praktik | Create dan Read; penilaian ulang membuat versi baru | Riwayat penilaian lama tetap tersimpan |
| Klasifikasi | Process, Read, Archive | Hasil lama diarsipkan saat data sumber berubah atau Admin mengarsipkannya |
| Program pelatihan | Create, Read, Update, Delete administratif | Delete adalah soft delete/arsip agar rekomendasi historis tidak rusak |
| Rekomendasi | Dibuat otomatis, Read | Terhubung ke hasil klasifikasi dan program |

Tidak semua tabel harus menyediakan empat operasi CRUD untuk semua role. Contohnya Peserta tidak boleh menghapus hasil asesmen yang sudah dikirim, dan Admin tidak boleh menghapus permanen catatan penilaian yang menjadi dasar keputusan.

## 7. Keamanan yang harus dapat dijelaskan

### Login dan autentikasi
1. Form mengirim email, password, dan role ke endpoint PHP.
2. PHP menormalisasi email dan memeriksa format.
3. PDO prepared statement mencari akun berdasarkan email dan role.
4. `password_verify()` membandingkan password yang dimasukkan dengan hash di database.
5. Backend memeriksa akun aktif dan role yang sesuai.
6. `session_regenerate_id(true)` mengganti ID sesi setelah login untuk mencegah session fixation.
7. Server menyimpan ID pengguna, role, dan versi sesi di session PHP.
8. Setiap endpoint privat memeriksa sesi dan role lagi. Menyembunyikan tombol di JavaScript saja tidak cukup.
9. Logout menghapus data sesi dan cookie sesi.
10. Jika password direset, `session_version` bertambah sehingga sesi lama tidak lagi valid.

### Perlindungan tambahan
- `password_hash()` menyimpan hash password, bukan password asli.
- PDO prepared statements mencegah input pengguna menjadi bagian dari sintaks SQL.
- Token CSRF diwajibkan pada permintaan yang mengubah data.
- Cookie sesi memakai `HttpOnly`, `SameSite=Lax`, dan `Secure` saat HTTPS.
- Login dibatasi maksimal 10 percobaan gagal dalam 15 menit untuk kombinasi email dan alamat IP.
- Output dinamis pada UI ditampilkan dengan `textContent`; bila dirender ke HTML server, gunakan `htmlspecialchars(..., ENT_QUOTES, 'UTF-8')`.
- Upload foto memeriksa MIME, membatasi ukuran, menggunakan nama acak, dan mencegah eksekusi file skrip.
- OTP reset password memiliki masa berlaku 15 menit, maksimal 5 percobaan, disimpan dalam bentuk hash, dan hanya dapat dipakai sekali.

## 8. Contoh jawaban singkat saat ditanya asprak

**Apa fungsi ERD?**  
ERD adalah rancangan hubungan antarentitas dalam database. ERD menunjukkan tabel, primary key, foreign key, dan kardinalitas sehingga alur penyimpanan data dapat dipahami sebelum implementasi.

**Mengapa ada tabel `classification_recommendations`?**  
Karena satu hasil klasifikasi dapat cocok dengan beberapa program, dan satu program dapat direkomendasikan kepada banyak peserta. Hubungan many-to-many tersebut membutuhkan tabel penghubung.

**Mengapa penilaian praktik punya tabel sendiri?**  
Karena penilaian dilakukan Admin dan dapat diulang. Setiap versi penilaian perlu menyimpan siapa Admin penilainya, kapan dinilai, indikator, tingkat keterampilan, dan catatan.

**Bagaimana sistem mencegah SQL Injection?**  
Semua query yang menerima input memakai PDO prepared statements. Input dikirim sebagai parameter, bukan digabungkan ke teks SQL.

**Bagaimana password disimpan?**  
Password diproses menggunakan `password_hash()` dan diverifikasi dengan `password_verify()`. Password asli tidak disimpan.

**Mengapa data tidak selalu dihapus permanen?**  
Data asesmen, penilaian praktik, klasifikasi, dan rekomendasi saling berhubungan. Penghapusan permanen dapat merusak riwayat dan audit. Karena itu data penting diarsipkan atau akun dinonaktifkan.
