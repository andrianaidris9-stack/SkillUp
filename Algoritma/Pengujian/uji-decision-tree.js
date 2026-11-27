/* Skrip pengujian algoritma Decision Tree terhadap dataset contoh. */

async function jalankanPengujian() {
            const status = document.getElementById("status");

            try {
                const info = await SkillUpDecisionTree.muatDataset();

                status.textContent =
                    "BERHASIL: Dataset berhasil dibaca dan model ID3 terbentuk.";

                document.getElementById("informasi").textContent =
                    JSON.stringify(info, null, 2);

                document.getElementById("pohon").textContent =
                    JSON.stringify(
                        SkillUpDecisionTree.getPohonKeputusan(),
                        null,
                        2
                    );

                // Data contoh untuk menguji fungsi prediksi.
                const pesertaContoh = {
                    usia: 22,
                    pendidikan: "SMA/SMK",
                    pengalaman_kerja: "Belum ada",
                    minat_bidang: "ADM",
                    kemampuan_komputer: "Mahir",
                    kemampuan_komunikasi: "Menengah",
                    keterampilan_praktik: "Dasar"
                };

                const prediksi =
                    SkillUpDecisionTree.prediksi(pesertaContoh);

                document.getElementById("hasil").textContent =
                    JSON.stringify(prediksi, null, 2);

            } catch (error) {
                status.textContent =
                    "GAGAL: " + error.message;

                console.error(error);
            }
        }

        jalankanPengujian();
