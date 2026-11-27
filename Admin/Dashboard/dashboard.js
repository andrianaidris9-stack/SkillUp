/* Dashboard Admin membaca ringkasan operasional langsung dari PHP/MySQL. */
document.addEventListener("DOMContentLoaded", async function () {
    if (window.SkillUpSessionReady) await window.SkillUpSessionReady;

    let admin = null;
    try { admin = JSON.parse(localStorage.getItem("skillupLoggedIn") || "null"); } catch (_) {}
    if (!admin || admin.role !== "admin") return;

    const name = document.getElementById("adminName");
    const avatar = document.getElementById("adminAvatar");
    if (name) name.textContent = admin.name || "Admin SkillUp";
    if (avatar) avatar.textContent = String(admin.name || "A").charAt(0).toUpperCase();

    const table = document.getElementById("recentAssessments");
    const summary = document.getElementById("classificationSummary");
    try {
        const result = await window.SkillUpAPI.get("admin/dashboard");
        const stats = result.stats || {};
        const set = (id, value) => {
            const node = document.getElementById(id);
            if (node) node.textContent = String(value ?? 0);
        };
        set("statPeserta", stats.participants);
        set("statPelatihan", stats.trainings);
        set("statAsesmen", stats.assessments);
        set("statMenunggu", stats.waiting_practical);

        if (table) {
            table.replaceChildren();
            const recent = result.recent_assessments || [];
            if (!recent.length) {
                table.innerHTML = '<tr><td colspan="4" class="admin-empty">Belum ada asesmen peserta.</td></tr>';
            } else {
                recent.forEach(item => {
                    const row = document.createElement("tr");
                    [
                        item.name || item.email || "Peserta",
                        item.interest_category || "-",
                        item.practical_level ? "Sudah dinilai (" + item.practical_level + ")" : "Menunggu penilaian Admin",
                        item.submitted_at ? new Date(item.submitted_at.replace(" ", "T")).toLocaleDateString("id-ID") : "-"
                    ].forEach(value => {
                        const cell = document.createElement("td");
                        cell.textContent = value;
                        row.appendChild(cell);
                    });
                    table.appendChild(row);
                });
            }
        }
        if (summary) {
            const rows = result.classification_summary || [];
            summary.textContent = rows.length
                ? rows.map(item => item.category_name + ": " + item.total + " peserta").join(" • ")
                : "Belum ada hasil klasifikasi. Lengkapi penilaian praktik dan jalankan proses klasifikasi.";
        }
    } catch (error) {
        console.error("Gagal memuat Dashboard Admin:", error);
        if (table) table.innerHTML = '<tr><td colspan="4" class="admin-empty">Ringkasan belum dapat dimuat. Periksa koneksi server.</td></tr>';
        if (summary) summary.textContent = error.message || "Data ringkasan tidak dapat dimuat.";
    }
});
