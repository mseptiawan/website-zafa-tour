document.addEventListener("DOMContentLoaded", () => {
  const phkModal = document.getElementById("phkModal");
  const historyModal = document.getElementById("historyModal");

  const inputEmployeeId = document.getElementById("employeeId");
  const textEmpName = document.getElementById("empName");

  const textHistName = document.getElementById("histName");
  const textHistReason = document.getElementById("histReason");
  const textHistAdmin = document.getElementById("histAdmin");
  const textHistDate = document.getElementById("histDate");

  const btnClosePhk = document.getElementById("btn-close-phk");
  const btnCloseHistory = document.getElementById("btn-close-history");

  document.addEventListener("click", (e) => {
    const targetButton = e.target.closest("[data-action]");
    if (!targetButton) return;

    const action = targetButton.dataset.action;

    if (action === "open-phk") {
      const { id, name } = targetButton.dataset;

      if (inputEmployeeId && textEmpName && phkModal) {
        inputEmployeeId.value = id || "";
        textEmpName.innerText = name || "";
        phkModal.classList.remove("hidden");
      }
    }

    if (action === "show-history") {
      const { name, reason, approved, date } = targetButton.dataset;

      if (historyModal) {
        if (textHistName) textHistName.innerText = name || "";
        if (textHistReason) textHistReason.innerText = reason || "";
        if (textHistDate) textHistDate.innerText = date || "";

        if (textHistAdmin) {
          textHistAdmin.innerText = approved
            ? approved.startsWith("@")
              ? approved
              : `@${approved}`
            : "";
        }

        historyModal.classList.remove("hidden");
      }
    }
  });

  // --- INTERAKSI CLOSE MODAL ---
  if (btnClosePhk && phkModal) {
    btnClosePhk.addEventListener("click", () => {
      phkModal.classList.add("hidden");
    });
  }

  if (btnCloseHistory && historyModal) {
    btnCloseHistory.addEventListener("click", () => {
      historyModal.classList.add("hidden");
    });
  }

  window.addEventListener("click", (e) => {
    if (e.target === phkModal) phkModal.classList.add("hidden");
    if (e.target === historyModal) historyModal.classList.add("hidden");
  });
});
