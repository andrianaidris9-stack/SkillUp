-- Data katalog awal dipertahankan sesuai data contoh pada Tahap 4.
USE skillup;
INSERT IGNORE INTO training_programs
(id,title,category_code,level,duration_hours,fee,instructor,start_date,end_date,status,description,created_at,updated_at)
VALUES
(1,'Pelatihan Kecantikan dan Tata Rias','KEC','Pemula',20,0,'Instruktur Kecantikan','2026-12-01','2026-12-10','Published','Pelatihan dasar perawatan kecantikan, tata rias wajah, penggunaan kosmetik, dan teknik merias.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(2,'Pelatihan Kuliner dan Tata Boga','KUL','Pemula',20,0,'Instruktur Tata Boga','2026-12-02','2026-12-11','Published','Pelatihan pengolahan makanan, teknik memasak, kebersihan dapur, dan penyajian hidangan.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(3,'Pelatihan Teknik dan Alat Berat','TEK','Menengah',24,0,'Instruktur Teknik','2026-12-03','2026-12-14','Published','Pelatihan pengenalan alat berat, pengoperasian dasar, dan keselamatan kerja.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(4,'Pelatihan Tata Busana dan Kerajinan','BUS','Pemula',20,0,'Instruktur Busana','2026-12-04','2026-12-15','Published','Pelatihan menjahit, membuat pola pakaian, dan menghasilkan produk kerajinan.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(5,'Pelatihan Administrasi dan Teknologi','ADM','Pemula',20,0,'Instruktur Administrasi','2026-12-05','2026-12-16','Published','Pelatihan administrasi perkantoran, pengolahan dokumen, dan penggunaan aplikasi komputer.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(6,'Pelatihan Kelistrikan dan Keterampilan Teknik','LIS','Menengah',24,0,'Instruktur Kelistrikan','2026-12-06','2026-12-17','Published','Pelatihan instalasi listrik dasar, penggunaan peralatan teknik, dan keselamatan kerja.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(7,'Pelatihan Pariwisata dan Perhotelan','PAR','Pemula',20,0,'Instruktur Perhotelan','2026-12-07','2026-12-18','Published','Pelatihan pelayanan tamu, dasar perhotelan, dan pelayanan pariwisata.','2026-11-16 00:00:00','2026-11-16 00:00:00'),
(8,'Pelatihan Kewirausahaan','WIR','Pemula',16,0,'Instruktur Kewirausahaan','2026-12-08','2026-12-19','Published','Pelatihan perencanaan usaha, pengelolaan modal, pemasaran, dan pengembangan bisnis.','2026-11-16 00:00:00','2026-11-16 00:00:00');
