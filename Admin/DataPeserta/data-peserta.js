/*
 * Data Peserta Admin
 * Sumber data resmi: database SkillUp.
 * Admin hanya dapat melihat daftar dan detail peserta.
 * Tidak tersedia fitur hapus, nonaktifkan, atau pulihkan akun.
 */

document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) {
        await window.SkillUpSessionReady;
    }

    // ==============================
    // VALIDASI ADMIN
    // ==============================

    let admin = null;

    try {
        admin = JSON.parse(
            localStorage.getItem("skillupLoggedIn") || "null"
        );
    } catch (error) {
        console.error("Gagal membaca sesi admin:", error);
    }

    if (!admin || admin.role !== "admin") {
        return;
    }

    const nameNode = document.getElementById("adminName");
    const avatarNode = document.getElementById("adminAvatar");

    if (nameNode) {
        nameNode.textContent = admin.name || "Admin SkillUp";
    }

    if (avatarNode) {
        avatarNode.textContent = String(admin.name || "A")
            .trim()
            .charAt(0)
            .toUpperCase();
    }

    // ==============================
    // ELEMEN HALAMAN
    // ==============================

    const search = document.getElementById("searchPeserta");
    const table = document.getElementById("pesertaTable");

    if (!table) {
        console.error("Elemen tabel peserta tidak ditemukan.");
        return;
    }

    let participants = [];
    let byId = new Map();

    const api = window.SkillUpAPI;
    const popup = window.SkillUpPopup;

    // ==============================
    // FUNGSI BANTU
    // ==============================

    function showMessage(type, title, message) {
        if (!popup || typeof popup[type] !== "function") {
            console.error(title + ": " + message);
            return;
        }

        popup[type](title, message);
    }

    function ageFromDate(value) {
        if (!value) return null;

        const birth = new Date(value + "T00:00:00");

        if (Number.isNaN(birth.getTime())) {
            return null;
        }

        const now = new Date();

        let age = now.getFullYear() - birth.getFullYear();

        if (
            now.getMonth() < birth.getMonth() ||
            (
                now.getMonth() === birth.getMonth() &&
                now.getDate() < birth.getDate()
            )
        ) {
            age--;
        }

        return age >= 0 ? age : null;
    }

    function profileComplete(participant) {
        return Boolean(
            participant.birth_date &&
            participant.education &&
            participant.work_experience &&
            participant.address &&
            participant.phone
        );
    }

    function addCell(row, value) {
        const cell = document.createElement("td");

        cell.textContent =
            value === null ||
            value === undefined ||
            value === ""
                ? "-"
                : String(value);

        row.appendChild(cell);

        return cell;
    }

    function showEmptyRow(message) {
        table.replaceChildren();

        const row = document.createElement("tr");
        const cell = document.createElement("td");

        cell.colSpan = 10;
        cell.className = "admin-empty";
        cell.textContent = message;

        row.appendChild(cell);
        table.appendChild(row);
    }

    // ==============================
    // DETAIL PESERTA
    // ==============================

    function showDetail(id) {
        const participant = byId.get(String(id));

        if (!participant) {
            showMessage(
                "informasi",
                "Data Tidak Ditemukan",
                "Data peserta tidak ditemukan. Silakan muat ulang daftar peserta."
            );
            return;
        }

        let dialog = document.getElementById(
            "detailPesertaDialog"
        );

        if (!dialog) {
            dialog = document.createElement("dialog");
            dialog.id = "detailPesertaDialog";
            dialog.className = "skillup-detail-dialog";

            dialog.innerHTML = `
                <div class="skillup-detail-head">
                    <h2>Detail Peserta</h2>
                    <button
                        type="button"
                        data-close-detail
                        aria-label="Tutup"
                    >×</button>
                </div>

                <div class="skillup-detail-body"></div>

                <div class="skillup-detail-footer">
                    <button type="button" data-close-detail>
                        Tutup
                    </button>
                </div>
            `;

            document.body.appendChild(dialog);

            dialog.addEventListener("click", function (event) {
                if (
                    event.target === dialog ||
                    event.target.closest("[data-close-detail]")
                ) {
                    dialog.close();
                }
            });
        }

        const body = dialog.querySelector(
            ".skillup-detail-body"
        );

        body.replaceChildren();

        // Foto peserta
        if (participant.photo_path) {
            const image = document.createElement("img");

            image.src =
                api && typeof api.assetUrl === "function"
                    ? api.assetUrl(participant.photo_path)
                    : participant.photo_path;

            image.alt = "Foto " + (participant.name || "peserta");
            image.className = "skillup-detail-photo";

            image.onerror = function () {
                image.remove();
            };

            body.appendChild(image);
        }

        const age = ageFromDate(participant.birth_date);

        const rows = [
            ["Nama lengkap", participant.name],
            ["Email", participant.email],
            ["Nomor telepon", participant.phone],
            ["Tanggal lahir", participant.birth_date],
            [
                "Usia",
                age === null ? "" : age + " tahun"
            ],
            ["Pendidikan terakhir", participant.education],
            ["Pengalaman kerja", participant.work_experience],
            ["Alamat", participant.address],
            [
                "Status akun",
                participant.status === "active"
                    ? "Aktif"
                    : "Dinonaktifkan"
            ],
            [
                "Status asesmen",
                participant.assessment_status || "Belum mengisi"
            ],
            [
                "Penilaian praktik",
                participant.practical_level || "Menunggu penilaian"
            ],
            [
                "Hasil klasifikasi",
                participant.predicted_category_code || "Belum tersedia"
            ]
        ];

        rows.forEach(function ([label, value]) {
            const item = document.createElement("div");
            item.className = "skillup-detail-item";

            const strong = document.createElement("strong");
            strong.textContent = label;

            const text = document.createElement("span");
            text.textContent =
                value === null || value === undefined || value === ""
                    ? "Belum diisi"
                    : String(value);

            item.append(strong, text);
            body.appendChild(item);
        });

        if (typeof dialog.showModal === "function") {
            if (!dialog.open) {
                dialog.showModal();
            }
        } else {
            dialog.setAttribute("open", "");
        }
    }

    // ==============================
    // TAMPILKAN TABEL PESERTA
    // ==============================

    function render() {
        const keyword = String(search?.value || "")
            .trim()
            .toLowerCase();

        const filteredParticipants = participants.filter(
            function (participant) {
                return [
                    participant.name,
                    participant.email,
                    participant.phone,
                    participant.education,
                    participant.work_experience,
                    participant.address,
                    participant.interest_category
                ].some(function (value) {
                    return String(value || "")
                        .toLowerCase()
                        .includes(keyword);
                });
            }
        );

        table.replaceChildren();

        if (!filteredParticipants.length) {
            showEmptyRow(
                participants.length
                    ? "Tidak ada peserta yang sesuai dengan pencarian."
                    : "Belum ada data peserta."
            );
            return;
        }

        filteredParticipants.forEach(function (participant, index) {
            const row = document.createElement("tr");

            addCell(row, index + 1);
            addCell(row, participant.name);
            addCell(row, participant.email);

            const age = ageFromDate(participant.birth_date);

            addCell(
                row,
                age === null
                    ? "Belum diisi"
                    : age + " tahun"
            );

            addCell(
                row,
                participant.education || "Belum diisi"
            );

            addCell(
                row,
                participant.work_experience || "Belum diisi"
            );

            addCell(row, participant.phone);

            addCell(
                row,
                participant.address || "Belum diisi"
            );

            // Status kelengkapan profil
            const profileStatus = document.createElement("td");
            const statusBadge = document.createElement("span");

            if (profileComplete(participant)) {
                statusBadge.className = "admin-status done";
                statusBadge.textContent = "Lengkap";
            } else {
                statusBadge.className = "admin-status";
                statusBadge.textContent = "Belum lengkap";
            }

            profileStatus.appendChild(statusBadge);
            row.appendChild(profileStatus);

            // Aksi: hanya Lihat Detail
            const actions = document.createElement("td");

            const detailButton = document.createElement("button");

            detailButton.type = "button";
            detailButton.className =
                "admin-button btn-detail-peserta";

            detailButton.dataset.id = participant.id;
            detailButton.textContent = "Lihat Detail";

            actions.appendChild(detailButton);

            row.appendChild(actions);
            table.appendChild(row);
        });
    }

    // ==============================
    // MUAT DATA DARI DATABASE
    // ==============================

    async function load() {
        try {
            if (!api || typeof api.get !== "function") {
                throw new Error(
                    "Koneksi API SkillUp tidak tersedia."
                );
            }

            const result = await api.get("admin/participants");

            participants = Array.isArray(result?.participants)
                ? result.participants
                : [];

            byId = new Map(
                participants.map(function (participant) {
                    return [
                        String(participant.id),
                        participant
                    ];
                })
            );

            render();
        } catch (error) {
            console.error(
                "Gagal memuat data peserta:",
                error
            );

            participants = [];
            byId.clear();

            showEmptyRow(
                "Data peserta belum dapat dimuat. Periksa koneksi server."
            );

            showMessage(
                "gagal",
                "Gagal Memuat Data",
                error.message || "Silakan muat ulang halaman."
            );
        }
    }

    // ==============================
    // EVENT TOMBOL TABEL
    // ==============================

    table.addEventListener("click", function (event) {
        const detailButton = event.target.closest(
            ".btn-detail-peserta"
        );

        if (!detailButton || !table.contains(detailButton)) {
            return;
        }

        showDetail(detailButton.dataset.id);
    });

    // ==============================
    // PENCARIAN
    // ==============================

    if (search) {
        search.addEventListener("input", render);
    }

    // ==============================
    // STYLE DETAIL PESERTA
    // ==============================

    if (!document.getElementById("skillup-detail-style")) {
        const style = document.createElement("style");

        style.id = "skillup-detail-style";

        style.textContent = `
            .skillup-detail-dialog {
                width: min(620px, calc(100% - 28px));
                max-height: 85vh;
                overflow: auto;
                border: 0;
                border-radius: 14px;
                padding: 22px;
                box-shadow: 0 18px 55px #0f172a33;
            }

            .skillup-detail-dialog::backdrop {
                background: #0f172a88;
            }

            .skillup-detail-head,
            .skillup-detail-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }

            .skillup-detail-head h2 {
                margin: 0;
                color: #183969;
            }

            .skillup-detail-head button {
                font-size: 24px;
                border: 0;
                background: transparent;
                cursor: pointer;
            }

            .skillup-detail-body {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin: 20px 0;
            }

            .skillup-detail-item {
                padding: 12px;
                background: #f6f8fc;
                border-radius: 8px;
                min-width: 0;
            }

            .skillup-detail-item strong,
            .skillup-detail-item span {
                display: block;
                overflow-wrap: anywhere;
            }

            .skillup-detail-item strong {
                font-size: 12px;
                color: #64748b;
                margin-bottom: 5px;
            }

            .skillup-detail-item span {
                font-size: 14px;
                color: #1e293b;
            }

            .skillup-detail-photo {
                grid-column: 1 / -1;
                width: 92px;
                height: 92px;
                object-fit: cover;
                border-radius: 50%;
                justify-self: center;
            }

            .skillup-detail-footer {
                justify-content: flex-end;
            }

            .skillup-detail-footer button {
                padding: 9px 18px;
                border: 0;
                border-radius: 7px;
                background: #183969;
                color: white;
                cursor: pointer;
            }

            @media (max-width: 500px) {
                .skillup-detail-body {
                    grid-template-columns: 1fr;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // ==============================
    // PERTAMA KALI HALAMAN DIBUKA
    // ==============================

    await load();
});
