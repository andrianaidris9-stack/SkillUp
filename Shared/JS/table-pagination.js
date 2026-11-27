/* Pagination bersama untuk tabel Admin SkillUp. */
document.addEventListener("DOMContentLoaded", function () {
    const configs = [
        { body: "pesertaTable", search: "searchPeserta", label: "peserta" },
        { body: "trainingTable", search: "searchInput", label: "pelatihan" },
        { body: "asesmenTable", search: "searchAsesmen", label: "asesmen" }
    ];

    configs.forEach(function (config) {
        const tbody = document.getElementById(config.body);
        if (!tbody) return;

        const wrapper = tbody.closest(".admin-table-wrap, .table-container") || tbody.closest("table")?.parentElement;
        if (!wrapper) return;

        const controls = document.createElement("div");
        controls.className = "skillup-pagination";
        controls.innerHTML = `
            <label>Baris per halaman
                <select class="skillup-page-size" aria-label="Jumlah baris per halaman">
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="100">100</option>
                </select>
            </label>
            <span class="skillup-page-info" aria-live="polite"></span>
            <div class="skillup-page-actions">
                <button type="button" class="skillup-page-prev">Sebelumnya</button>
                <button type="button" class="skillup-page-next">Berikutnya</button>
            </div>`;
        wrapper.insertAdjacentElement("afterend", controls);

        const sizeSelect = controls.querySelector("select");
        const info = controls.querySelector(".skillup-page-info");
        const prev = controls.querySelector(".skillup-page-prev");
        const next = controls.querySelector(".skillup-page-next");
        let page = 1;

        function render() {
            const rows = Array.from(tbody.querySelectorAll("tr"));
            const visibleRows = rows.filter(row =>
                !row.classList.contains("is-filtered-out") &&
                !row.dataset.paginationPlaceholder &&
                !row.querySelector("td.admin-empty, td[colspan]")
            );
            const size = Number(sizeSelect.value) || 10;
            const total = visibleRows.length;
            const pages = Math.max(1, Math.ceil(total / size));
            page = Math.min(page, pages);
            const start = total ? (page - 1) * size : 0;
            const end = Math.min(start + size, total);

            rows.forEach(row => {
                if (row.dataset.paginationPlaceholder) return;
                if (row.querySelector("td.admin-empty, td[colspan]")) {
                    row.style.display = "";
                    return;
                }
                if (row.classList.contains("is-filtered-out")) {
                    row.style.display = "none";
                    return;
                }
                const index = visibleRows.indexOf(row);
                row.style.display = index >= start && index < end ? "" : "none";
            });

            info.textContent = total
                ? `Menampilkan ${start + 1}–${end} dari ${total} ${config.label}`
                : `Tidak ada ${config.label} untuk ditampilkan`;
            prev.disabled = page <= 1;
            next.disabled = page >= pages;
        }

        sizeSelect.addEventListener("change", function () {
            page = 1;
            render();
        });
        prev.addEventListener("click", function () {
            if (page > 1) { page--; render(); }
        });
        next.addEventListener("click", function () {
            page++;
            render();
        });

        const search = config.search && document.getElementById(config.search);
        if (search) search.addEventListener("input", function () { page = 1; render(); });

        new MutationObserver(function () { render(); }).observe(tbody, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["class"]
        });
        render();
    });

    if (!document.getElementById("skillup-pagination-style")) {
        const style = document.createElement("style");
        style.id = "skillup-pagination-style";
        style.textContent = `
            .skillup-pagination{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 2px;color:#64748b;font-size:13px}
            .skillup-pagination label{display:flex;align-items:center;gap:8px}
            .skillup-pagination select{padding:7px 10px;border:1px solid #d7dfeb;border-radius:7px;background:#fff;color:#24344d}
            .skillup-page-actions{display:flex;gap:7px}
            .skillup-page-actions button{padding:8px 12px;border:1px solid #d7dfeb;border-radius:7px;background:#fff;color:#24436e;cursor:pointer}
            .skillup-page-actions button:disabled{opacity:.45;cursor:not-allowed}
            @media(max-width:560px){.skillup-pagination{align-items:flex-start}.skillup-page-info{width:100%;order:3}}
        `;
        document.head.appendChild(style);
    }
});
