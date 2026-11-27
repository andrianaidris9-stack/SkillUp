# Catatan Penataan SkillUpProjectKita

- Struktur proyek dikelompokkan berdasarkan halaman, peran, dan fungsi, bukan nomor tahap.
- Halaman aktif memiliki file HTML, CSS, dan JavaScript terpisah sesuai kebutuhannya.
- Layout Admin dan Peserta menggunakan stylesheet bersama agar sidebar, topbar, jarak, warna, dan tipografi tetap konsisten.
- Halaman publik menggunakan `Shared/CSS/style.css` sebagai design system bersama.
- Logo resmi tetap berada di `Assets/img/logo-skillup.png`.
- Ilustrasi delapan kategori pelatihan disimpan lokal di `Assets/img/pelatihan/`.
- Data pelatihan bersama dikelola melalui `Shared/JS/data-pelatihan.js` agar katalog publik dan halaman Admin memakai sumber data yang sama.
- Modul LMS lama yang tidak sesuai dengan alur pemetaan kebutuhan pelatihan sudah dikeluarkan dari struktur aktif setelah tautan dan ketergantungannya diperiksa.
- Dataset latih tetap berada di `Dataset/`; data asesmen peserta operasional tidak otomatis ditambahkan ke CSV.
- Tahap 3 dan Tahap 4 menjadi cakupan prototipe ini. PHP/MySQL belum dibuat dan tetap menjadi Tahap 5.
