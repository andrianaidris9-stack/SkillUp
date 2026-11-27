
/* Hasil Rekomendasi Peserta
   Data klasifikasi dan program berasal dari MySQL.
   Detail pelatihan ditampilkan langsung pada halaman ini.
*/

document.addEventListener("DOMContentLoaded", async function () {

    // =========================================
    // 1. MEMERIKSA SESI PESERTA
    // =========================================

    if (window.SkillUpSessionReady) {
        await window.SkillUpSessionReady;
    }

    let peserta = null;

    try {
        peserta = JSON.parse(
            localStorage.getItem("skillupLoggedIn") || "null"
        );
    } catch (_) {
        peserta = null;
    }

    if (!peserta || peserta.role !== "user") return;

    // =========================================
    // 2. ELEMEN HALAMAN
    // =========================================

    const avatar = document.getElementById("userAvatar");
    const message = document.getElementById("recommendationMessage");
    const details = document.getElementById("recommendationDetails");
    const programs = document.getElementById("recommendedPrograms");
    const empty = document.getElementById("recommendedProgramsEmpty");

    const recommendationCard = document.getElementById(
        "recommendationCard"
    );

    const recommendationNote = document.getElementById(
        "recommendationNote"
    );

    const detailView = document.getElementById(
        "trainingDetailView"
    );

    const closeDetailButton = document.getElementById(
        "closeTrainingDetail"
    );

    const sumber = window.SkillUpPelatihan;

    // =========================================
    // 3. AVATAR PESERTA
    // =========================================

    function initials(name) {
        return String(name || "Peserta")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((x) => x[0].toUpperCase())
            .join("") || "P";
    }

    function showAvatar() {
        if (!avatar) return;

        let profile = {};

        try {
            profile = JSON.parse(
                localStorage.getItem(
                    "skillupProfile_" +
                    encodeURIComponent(peserta.email)
                ) || "{}"
            );
        } catch (_) {
            profile = {};
        }

        avatar.replaceChildren();

        if (profile.foto) {
            const img = document.createElement("img");

            img.src = profile.foto;
            img.alt = "Foto Profil Peserta";

            img.onerror = function () {
                avatar.textContent = initials(
                    profile.nama || peserta.name
                ).charAt(0);
            };

            avatar.appendChild(img);
        } else {
            avatar.textContent = initials(
                profile.nama || peserta.name
            ).charAt(0);
        }
    }

    // =========================================
    // 4. PESAN HASIL REKOMENDASI
    // =========================================

    function showMessage(text) {
        if (message) {
            message.textContent = text;
        }

        if (details) {
            details.hidden = true;
        }

        if (programs) {
            programs.replaceChildren();
        }

        if (empty) {
            empty.hidden = true;
            empty.textContent = "";
        }
    }

    // =========================================
    // 5. FORMAT DATA
    // =========================================

    function formatDate(value) {
        if (!value || value === "-") return "-";

        const date = new Date(
            String(value).replace(" ", "T")
        );

        return Number.isNaN(date.getTime())
            ? String(value)
            : date.toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric"
            });
    }

    function formatLevel(level) {
        const value = String(level ?? "")
            .trim()
            .toLowerCase();

        const mapping = {
            beginner: "Pemula",
            pemula: "Pemula",
            intermediate: "Menengah",
            menengah: "Menengah",
            advanced: "Mahir",
            mahir: "Mahir",
            lanjutan: "Mahir"
        };

        return mapping[value] || level || "-";
    }

    function formatFee(feeValue) {
        if (
            feeValue === null ||
            feeValue === undefined ||
            feeValue === ""
        ) {
            return "-";
        }

        const number = Number(
            String(feeValue).replace(/[^0-9.-]+/g, "")
        );

        if (Number.isNaN(number)) {
            return String(feeValue);
        }

        if (number <= 0) {
            return "Gratis (Rp 0)";
        }

        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    }

    function formatDuration(item) {
        const raw = item?.durasi ?? item?.duration_hours;

        if (
            raw === null ||
            raw === undefined ||
            raw === ""
        ) {
            return "-";
        }

        if (
            typeof raw === "number" ||
            /^\d+$/.test(String(raw).trim())
        ) {
            return `${String(raw).trim()} Jam`;
        }

        return String(raw);
    }

    function formatStatus(status) {
        const value = String(status ?? "")
            .trim()
            .toLowerCase();

        if (
            [
                "published",
                "publish",
                "dipublikasikan",
                "aktif",
                "active",
                "terbit"
            ].includes(value)
        ) {
            return {
                label: "Dipublikasikan",
                className: "published"
            };
        }

        if (["draft", "draf"].includes(value)) {
            return {
                label: "Draf",
                className: "draft"
            };
        }

        return {
            label: status || "Nonaktif",
            className: "inactive"
        };
    }

    function getValue(item, keys) {
        for (const key of keys) {
            if (
                item &&
                item[key] !== null &&
                item[key] !== undefined &&
                item[key] !== ""
            ) {
                return item[key];
            }
        }

        return "-";
    }

    // =========================================
    // 6. MEMBUAT KARTU REKOMENDASI
    // =========================================

    function makeCard(item, categoryName) {
        const card = document.createElement("article");

        card.className = "recommended-program-card";

        const imagePath = getValue(item, [
            "cover_image",
            "thumbnail",
            "gambar"
        ]);

        if (imagePath !== "-") {
            const img = document.createElement("img");

            img.className = "recommended-program-image";
            img.src = resolveImage(imagePath);
            img.alt = item.title || "Gambar pelatihan";

            img.onerror = function () {
                this.hidden = true;
            };

            card.appendChild(img);
        }

        const content = document.createElement("div");

        content.className = "recommended-program-content";

        const category = document.createElement("span");

        category.className = "recommended-program-category";
        category.textContent =
            item.category || categoryName || "-";

        const title = document.createElement("h4");

        title.textContent = item.title || "Tanpa judul";

        const description = document.createElement("p");

        description.className =
            "recommended-program-description";

        description.textContent =
            item.description || "Deskripsi belum tersedia.";

        const meta = document.createElement("div");

        meta.className = "recommended-program-meta";

        const duration = document.createElement("span");

        duration.textContent =
            "Durasi: " + formatDuration(item);

        const level = document.createElement("span");

        level.textContent =
            "Tingkat: " + formatLevel(item.level);

        const fee = document.createElement("span");

        fee.textContent =
            "Biaya: " + formatFee(item.fee ?? item.harga);

        meta.append(duration, level, fee);

        // Tombol membuka detail pada halaman yang sama.
        const button = document.createElement("button");

        button.type = "button";
        button.className = "recommended-program-button";
        button.textContent = "Lihat Detail Pelatihan";

        const trainingId = item.training_id ?? item.id ?? "";

        button.addEventListener("click", function () {
            bukaDetailPelatihan(trainingId, button);
        });

        content.append(
            category,
            title,
            description,
            meta,
            button
        );

        card.appendChild(content);

        return card;
    }

    // =========================================
    // 7. MENGISI DETAIL PELATIHAN
    // =========================================

    function isiDetail(elementId, value) {
        const element = document.getElementById(elementId);

        if (!element) return;

        element.textContent =
            value === 0 ? "0" : (value || "-");
    }

    function resolveImage(path) {
        if (!path || path === "-") return "";

        const value = String(path).trim();

        if (
            /^(https?:\/\/|data:|blob:)/i.test(value) ||
            value.startsWith("/")
        ) {
            return value;
        }

        if (
            window.SkillUpAPI &&
            typeof window.SkillUpAPI.assetUrl === "function"
        ) {
            return window.SkillUpAPI.assetUrl(value);
        }

        return value;
    }

    function tampilkanDetail(data) {
        const title = getValue(data, [
            "judul",
            "title"
        ]);

        const description = getValue(data, [
            "deskripsi",
            "description"
        ]);

        const category = getValue(data, [
            "kategori",
            "category_name",
            "category_code",
            "category"
        ]);

        const level = getValue(data, [
            "tingkat",
            "level"
        ]);

        const instructor = getValue(data, [
            "instruktur",
            "instructor",
            "nama_instruktur"
        ]);

        const startDate = getValue(data, [
            "tanggalMulai",
            "tanggal_mulai",
            "start_date"
        ]);

        const endDate = getValue(data, [
            "tanggalSelesai",
            "tanggal_selesai",
            "end_date"
        ]);

        const status = formatStatus(data.status);

        isiDetail("detailTrainingTitle", title);
        isiDetail("detailTrainingDescription", description);

        isiDetail("detailCategory", category);
        isiDetail("detailLevel", formatLevel(level));

        isiDetail(
            "detailPrice",
            formatFee(data.harga ?? data.fee)
        );

        isiDetail("detailDuration", formatDuration(data));
        isiDetail("detailInstructor", instructor);

        isiDetail(
            "detailStartDate",
            startDate === "-" ? "-" : formatDate(startDate)
        );

        isiDetail(
            "detailEndDate",
            endDate === "-" ? "-" : formatDate(endDate)
        );

        isiDetail(
            "detailStatusInformation",
            status.label
        );

        const statusElement = document.getElementById(
            "detailTrainingStatus"
        );

        if (statusElement) {
            statusElement.textContent = status.label;

            statusElement.className =
                "participant-training-status " +
                status.className;
        }

        const image = document.getElementById(
            "detailTrainingImage"
        );

        const imagePath = getValue(data, [
            "thumbnail",
            "gambar",
            "cover_image"
        ]);

        if (image) {
            image.hidden = true;
            image.removeAttribute("src");

            if (imagePath !== "-") {
                image.onload = function () {
                    this.hidden = false;
                };

                image.onerror = function () {
                    this.hidden = true;
                };

                image.src = resolveImage(imagePath);
                image.alt = "Sampul " + title;
            }
        }
    }

    // =========================================
    // 8. MEMBUKA DETAIL PELATIHAN
    // =========================================

    async function bukaDetailPelatihan(id, button) {
        if (!id) {
            alert("ID pelatihan tidak tersedia.");
            return;
        }

        if (
            !sumber ||
            typeof sumber.ambilById !== "function"
        ) {
            alert("Sumber data detail pelatihan tidak tersedia.");
            return;
        }

        if (!detailView) {
            alert("Bagian detail pelatihan tidak ditemukan.");
            return;
        }

        if (button) {
            button.disabled = true;
            button.textContent = "Memuat Detail...";
        }

        try {
            const result = await sumber.ambilById(id);

            // Mendukung data langsung maupun respons berbungkus.
            const data =
                result?.data ??
                result?.pelatihan ??
                result;

            if (
                !data ||
                typeof data !== "object" ||
                Array.isArray(data)
            ) {
                throw new Error("Pelatihan tidak ditemukan.");
            }

            tampilkanDetail(data);

            if (recommendationCard) {
                recommendationCard.hidden = true;
            }

            if (recommendationNote) {
                recommendationNote.hidden = true;
            }

            detailView.hidden = false;

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        } catch (error) {
            console.error(
                "Gagal membuka detail pelatihan:",
                error
            );

            alert(
                error.message ||
                "Detail pelatihan gagal dimuat."
            );

        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = "Lihat Detail Pelatihan";
            }
        }
    }

    // =========================================
    // 9. KEMBALI KE HASIL REKOMENDASI
    // =========================================

    if (closeDetailButton) {
        closeDetailButton.addEventListener("click", function () {

            if (detailView) {
                detailView.hidden = true;
            }

            if (recommendationCard) {
                recommendationCard.hidden = false;
            }

            if (recommendationNote) {
                recommendationNote.hidden = false;
            }

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });
        });
    }

    // =========================================
    // 10. MEMUAT HASIL REKOMENDASI
    // =========================================

    async function load() {
        showAvatar();

        try {
            const result = await window.SkillUpAPI.get(
                "participant/recommendations"
            );

            const assessment = result.assessment;
            const classification = result.classification;

            if (!assessment) {
                showMessage(
                    "Kamu belum mengisi Asesmen Awal. " +
                    "Silakan lengkapi asesmen terlebih dahulu."
                );

                return;
            }

            if (!assessment.practical_level) {
                showMessage(
                    "Asesmen Awal berhasil dikirim. " +
                    "Saat ini kamu sedang menunggu penilaian " +
                    "keterampilan praktik oleh Admin."
                );

                return;
            }

            if (!classification) {
                showMessage(
                    "Penilaian praktik sudah selesai. " +
                    "Hasil rekomendasi sedang menunggu " +
                    "proses klasifikasi oleh Admin."
                );

                return;
            }

            if (message) {
                message.textContent =
                    "Klasifikasi kebutuhan pelatihan berhasil diproses.";
            }

            if (details) {
                details.hidden = false;
            }

            const field = document.getElementById(
                "recommendedField"
            );

            if (field) {
                field.textContent =
                    classification.predicted_category ||
                    classification.predicted_category_code ||
                    "Belum ditentukan";
            }

            const explanation = document.getElementById(
                "recommendationExplanation"
            );

            if (explanation) {
                explanation.textContent =
                    classification.explanation ||
                    "Hasil ini merupakan rekomendasi berdasarkan " +
                    "data profil dan asesmen peserta.";
            }

            const date = document.getElementById(
                "recommendationDate"
            );

            if (date) {
                date.textContent =
                    "Diproses: " +
                    formatDate(classification.processed_at);
            }

            const list = result.recommendations || [];

            if (programs) {
                programs.replaceChildren();
            }

            if (list.length > 0 && programs) {
                list.forEach((item) => {
                    programs.appendChild(
                        makeCard(
                            item,
                            classification.predicted_category
                        )
                    );
                });

                if (empty) {
                    empty.hidden = true;
                }

            } else if (empty) {
                empty.hidden = false;

                empty.textContent =
                    "Belum ada program pelatihan yang " +
                    "dipublikasikan untuk bidang rekomendasi ini.";
            }

        } catch (error) {
            console.error(
                "Gagal memuat hasil rekomendasi:",
                error
            );

            showMessage(
                error.message ||
                "Hasil rekomendasi belum dapat dimuat. " +
                "Periksa koneksi server."
            );
        }
    }

    // =========================================
    // 11. JALANKAN HALAMAN
    // =========================================

    await load();

    window.addEventListener(
        "skillupProfileUpdated",
        showAvatar
    );

    window.addEventListener(
        "skillupAssessmentUpdated",
        load
    );

    window.addEventListener(
        "skillupClassificationUpdated",
        load
    );

});
