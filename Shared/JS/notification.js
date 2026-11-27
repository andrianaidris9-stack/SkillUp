
/* =========================================
   POP-UP NOTIFIKASI BERSAMA SKILLUP
========================================= */

(function () {
    "use strict";

    let popupOverlay;
    let popupElement;
    let popupResolve = null;

    function buatPopup() {
        if (popupOverlay) return;

        popupOverlay = document.createElement("div");
        popupOverlay.className = "skillup-popup-overlay";

        popupElement = document.createElement("div");
        popupElement.className = "skillup-popup";
        popupElement.setAttribute("role", "dialog");
        popupElement.setAttribute("aria-modal", "true");

        popupOverlay.appendChild(popupElement);
        document.body.appendChild(popupOverlay);

        popupOverlay.addEventListener("click", function (event) {
            if (event.target === popupOverlay && popupResolve) {
                tutupPopup(false);
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && popupOverlay.classList.contains("show")) {
                if (popupResolve) {
                    tutupPopup(false);
                } else {
                    tutupPopup();
                }
            }
        });
    }

    function tutupPopup(hasil) {
        if (!popupOverlay) return;

        popupOverlay.classList.remove("show");

        if (popupResolve) {
            const resolve = popupResolve;
            popupResolve = null;
            resolve(Boolean(hasil));
        }
    }

    function tampilkan(jenis, judul, pesan, modeKonfirmasi = false) {
        buatPopup();

        const ikon = {
            success: "✓",
            error: "✕",
            warning: "!",
            info: "i"
        };

        popupElement.innerHTML = "";

        const iconElement = document.createElement("div");
        iconElement.className = "skillup-popup-icon " + jenis;
        iconElement.textContent = ikon[jenis] || "i";

        const titleElement = document.createElement("h3");
        titleElement.textContent = judul;

        const messageElement = document.createElement("p");
        messageElement.textContent = pesan;

        const actions = document.createElement("div");
        actions.className = "skillup-popup-actions";

        if (modeKonfirmasi) {
            const cancelButton = document.createElement("button");
            cancelButton.type = "button";
            cancelButton.className = "skillup-popup-button secondary";
            cancelButton.textContent = "Batal";
            cancelButton.addEventListener("click", function () {
                tutupPopup(false);
            });

            actions.appendChild(cancelButton);
        }

        const confirmButton = document.createElement("button");
        confirmButton.type = "button";
        confirmButton.className = "skillup-popup-button";
        confirmButton.textContent = modeKonfirmasi ? "Ya, Lanjutkan" : "Tutup";

        confirmButton.addEventListener("click", function () {
            tutupPopup(modeKonfirmasi);
        });

        actions.appendChild(confirmButton);

        popupElement.append(
            iconElement,
            titleElement,
            messageElement,
            actions
        );

        popupOverlay.classList.add("show");
        confirmButton.focus();
    }

    window.SkillUpPopup = {
    sukses: function (judul, pesan) {
        tampilkan("success", judul, pesan);
    },

    gagal: function (judul, pesan) {
        tampilkan("error", judul, pesan);
    },

    peringatan: function (judul, pesan) {
        return new Promise(function (resolve) {
            popupResolve = resolve;
            tampilkan("warning", judul, pesan);
        });
    },

    informasi: function (judul, pesan) {
        tampilkan("info", judul, pesan);
    },

    konfirmasi: function (judul, pesan) {
        return new Promise(function (resolve) {
            popupResolve = resolve;
            tampilkan("warning", judul, pesan, true);
        });
    }
};

})();
