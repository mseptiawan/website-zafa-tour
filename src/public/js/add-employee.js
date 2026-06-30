document.addEventListener("DOMContentLoaded", () => {
  const bidangSelect = document.getElementById("select-bidang");
  const unitSelect = document.getElementById("select-unit");
  const statusSelect = document.getElementById("select-status");
  const kontrakWrapper = document.getElementById("wrapper-kontrak");
  const kontrakInput = document.getElementById("input-tanggal-kontrak");
  const unitsDataElement = document.getElementById("units-data");

  if (!bidangSelect || !unitSelect || !statusSelect || !unitsDataElement) return;

  const unitsData = JSON.parse(unitsDataElement.dataset.json || "[]");

  const filterUnits = (bidangId, selectedUnitId = "") => {
    unitSelect.innerHTML = '<option value="" disabled selected>Pilih Unit Kantor</option>';
    if (!bidangId) return;

    const filtered = unitsData.filter((unit) => String(unit.bidangId) === String(bidangId));
    filtered.forEach((unit) => {
      const option = document.createElement("option");
      option.value = unit._id;
      option.textContent = unit.name;
      if (String(unit._id) === String(selectedUnitId)) {
        option.selected = true;
      }
      unitSelect.appendChild(option);
    });
  };

  const toggleKontrakField = (status) => {
    if (!kontrakWrapper || !kontrakInput) return;

    if (status === "Pegawai Kontrak" || status === "Magang / Intern") {
      kontrakWrapper.classList.remove("hidden");
      kontrakInput.setAttribute("required", "required");
    } else {
      kontrakWrapper.classList.add("hidden");
      kontrakInput.removeAttribute("required");
      kontrakInput.value = "";
    }
  };

  bidangSelect.addEventListener("change", (e) => {
    filterUnits(e.target.value);
  });

  statusSelect.addEventListener("change", (e) => {
    toggleKontrakField(e.target.value);
  });

  if (bidangSelect.value) {
    const oldUnitId = unitSelect.getAttribute("data-old");
    filterUnits(bidangSelect.value, oldUnitId);
  }

  if (statusSelect.value) {
    toggleKontrakField(statusSelect.value);
  }
});
