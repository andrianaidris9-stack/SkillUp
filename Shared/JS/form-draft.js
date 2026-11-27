/* Draft formulir sementara untuk menjaga isian saat admin berpindah menu. */
(function () {
    "use strict";
    document.addEventListener("DOMContentLoaded", function () {
        document.querySelectorAll("form[data-draft-key]").forEach(function (form) {
            const baseKey = form.dataset.draftKey;
            if (!baseKey) return;
            const editId = new URLSearchParams(window.location.search).get("id");
            const key = baseKey === "skillup-draft-training-edit" ? baseKey + ":" + (editId || "unknown") : baseKey;
            const excluded = 'input[type="file"],input[type="password"],input[type="hidden"],button,[data-no-draft]';
            function controls() { return Array.from(form.querySelectorAll("input,select,textarea")).filter(el => !el.matches(excluded) && (el.name || el.id)); }
            function fieldKey(el) { return el.name || el.id; }
            function saveDraft() {
                const data = {};
                controls().forEach(function (el) {
                    const field = fieldKey(el);
                    if (el.type === "radio" || el.type === "checkbox") {
                        if (!data[field]) data[field] = [];
                        if (el.checked) data[field].push(el.value);
                    } else data[field] = el.value;
                });
                try { sessionStorage.setItem(key, JSON.stringify({ savedAt: new Date().toISOString(), data })); }
                catch (error) { console.warn("Draft tidak dapat disimpan pada sesi ini.", error); }
            }
            function restoreDraft() {
                let draft;
                try { draft = JSON.parse(sessionStorage.getItem(key) || "null"); } catch (_) { draft = null; }
                if (!draft || !draft.data) return;
                controls().forEach(function (el) {
                    const field = fieldKey(el);
                    if (!(field in draft.data)) return;
                    const value = draft.data[field];
                    if (el.type === "radio" || el.type === "checkbox") el.checked = Array.isArray(value) && value.includes(el.value);
                    else if (typeof value === "string") el.value = value;
                });
                form.dispatchEvent(new CustomEvent("skillup:draft-restored", { bubbles: true, detail: { savedAt: draft.savedAt } }));
            }
            restoreDraft();
            form.addEventListener("input", saveDraft);
            form.addEventListener("change", saveDraft);
            window.addEventListener("skillup:draft-saved", function () { sessionStorage.removeItem(key); });
            window.addEventListener("beforeunload", saveDraft);
        });
    });
})();
