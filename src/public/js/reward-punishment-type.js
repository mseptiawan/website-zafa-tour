document.addEventListener("DOMContentLoaded", () => {
  const dataEl = document.getElementById("types-data");
  let types = [];

  if (dataEl && dataEl.dataset.json) {
    try {
      types = JSON.parse(dataEl.dataset.json);
    } catch (e) {
      console.error("Gagal memproses data jenis master:", e);
    }
  }

  const tableBody = document.getElementById("type-table-body");
  const totalCounter = document.getElementById("total-aktif-counter");
  const typeModal = document.getElementById("type-modal");
  const typeForm = document.getElementById("type-form");
  const modalTitle = document.getElementById("modal-title");

  const formId = document.getElementById("form-id");
  const formCategory = document.getElementById("form-category");
  const formName = document.getElementById("form-name");
  const formImpact = document.getElementById("form-impact");
  const formDescription = document.getElementById("form-description");

  const btnAddType = document.getElementById("btn-add-type");
  const btnCloseModalX = document.getElementById("btn-close-modal-x");
  const btnCloseModalCancel = document.getElementById("btn-close-modal-cancel");

  /**
   * Render data array ke tabel HTML
   */
  function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    let activeCount = 0;

    if (!types || !types.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-12 text-slate-400">
            Belum ada standarisasi data jenis Reward & Punishment.
          </td>
        </tr>`;
      if (totalCounter) totalCounter.textContent = "0";
      return;
    }

    types.forEach((item) => {
      if (item.isActive) activeCount++;

      const rowOpacity = item.isActive ? "" : "opacity-60 bg-slate-50";
      const statusText = item.isActive ? "Aktif" : "Non-Aktif";
      const statusTextClass = item.isActive
        ? "text-emerald-600 bg-emerald-50/70 border-emerald-200/50"
        : "text-slate-500 bg-slate-100 border-slate-200";
      const dotClass = item.isActive ? "bg-emerald-500" : "bg-slate-400";

      const categoryBadge =
        item.category === "REWARD"
          ? `<span class="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-md font-bold text-[10px]">REWARD</span>`
          : `<span class="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 rounded-md font-bold text-[10px]">PUNISHMENT</span>`;

      const formattedImpact = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(item.financialImpact);

      const impactClass = item.financialImpact >= 0 ? "text-emerald-600" : "text-rose-600";
      const descContent =
        item.description || '<span class="text-slate-300 italic">Tanpa deskripsi</span>';

      const tr = document.createElement("tr");
      tr.className = `hover:bg-slate-50/50 transition ${rowOpacity}`;

      tr.innerHTML = `
        <td class="px-6 py-4 font-medium">${categoryBadge}</td>
        <td class="px-6 py-4 font-semibold text-slate-800">${item.name}</td>
       <td class="px-6 py-4 text-slate-500 text-xs max-w-sm whitespace-normal break-words leading-relaxed text-justify">
  ${descContent}
</td>
        <td class="px-6 py-4">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide ${statusTextClass}">
            <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
            <span>${statusText}</span>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-end gap-2">
            ${
              item.isActive
                ? `
              <button data-id="${item._id}" class="btn-edit-trigger inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-400 text-white hover:bg-amber-500 transition active:scale-[0.95] cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4h3m2.586 2.586a2 2 0 010 2.828l-8.5 8.5L5 18l.086-3.086 8.5-8.5a2 2 0 012.828 0z" /></svg>
              </button>
              <button data-id="${item._id}" data-action="deactivate" class="btn-toggle-trigger inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition active:scale-[0.95] cursor-pointer" title="Nonaktifkan Aturan">
                <i class="fa-solid fa-eye-slash text-xs"></i>
              </button>
            `
                : `
              <button data-id="${item._id}" data-action="activate" class="btn-toggle-trigger inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[11px] font-bold transition active:scale-[0.95] cursor-pointer">
                <i class="fa-solid fa-rotate-left mr-1.5 text-[10px]"></i> Aktifkan
              </button>
            `
            }
          </div>
        </td>`;
      tableBody.appendChild(tr);
    });

    if (totalCounter) totalCounter.textContent = activeCount;
    bindDynamicEvents();
  }

  function openModal(mode, id = null) {
    if (!typeModal) return;
    typeModal.classList.remove("hidden");
    typeModal.classList.add("flex");

    if (mode === "edit" && id) {
      if (modalTitle) modalTitle.textContent = "Edit Jenis Aturan Master";
      const target = types.find((t) => t._id === id);
      if (target) {
        if (formId) formId.value = target._id;
        if (formCategory) formCategory.value = target.category;
        if (formName) formName.value = target.name;
        if (formImpact) formImpact.value = target.financialImpact;
        if (formDescription) formDescription.value = target.description || "";
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Tambah Jenis Aturan Master";
      if (typeForm) typeForm.reset();
      if (formId) formId.value = "";
    }
  }

  function closeModal() {
    if (!typeModal) return;
    typeModal.classList.add("hidden");
    typeModal.classList.remove("flex");
  }

  function bindDynamicEvents() {
    document.querySelectorAll(".btn-edit-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        openModal("edit", id);
      });
    });

    document.querySelectorAll(".btn-toggle-trigger").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.currentTarget.getAttribute("data-id");
        const action = e.currentTarget.getAttribute("data-action");
        const shouldActivate = action === "activate";

        if (typeof openConfirmModal === "function") {
          openConfirmModal({
            title: shouldActivate ? "Aktifkan Aturan" : "Nonaktifkan Aturan",
            message: shouldActivate
              ? "Apakah Anda yakin ingin mengaktifkan jenis aturan master ini kembali?"
              : "Apakah Anda yakin ingin menonaktifkan aturan ini? Pegawai tidak akan bisa memilih opsi ini sementara.",
            confirmText: shouldActivate ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
            confirmClass: shouldActivate
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "bg-rose-600 hover:bg-rose-700",
            onConfirm: () => handleToggleStatus(id, shouldActivate),
          });
        } else {
          if (
            confirm(
              `Apakah Anda yakin ingin ${shouldActivate ? "mengaktifkan" : "menonaktifkan"} aturan ini?`
            )
          ) {
            handleToggleStatus(id, shouldActivate);
          }
        }
      });
    });
  }

  // Form Submit Handler (POST / PUT)
  if (typeForm) {
    typeForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = formId ? formId.value : "";
      const payload = {
        category: formCategory ? formCategory.value : "",
        name: formName ? formName.value : "",
        financialImpact: formImpact ? formImpact.value : 0,
        description: formDescription ? formDescription.value : "",
      };

      try {
        const url = id ? `/reward-punishment/types/${id}` : "/reward-punishment/types";
        const method = id ? "PUT" : "POST";

        const response = await fetch(url, {
          method: method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        location.reload();
      } catch (error) {
        alert(error.message || "Terjadi kesalahan sistem saat menyimpan.");
      }
    });
  }

  // Toggle API Handler (PATCH)
  async function handleToggleStatus(id, shouldActivate) {
    try {
      const response = await fetch(`/reward-punishment/types/toggle-status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: shouldActivate }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      location.reload();
    } catch (error) {
      alert(error.message || "Gagal merubah status regulasi.");
    }
  }

  // Static Listener
  if (btnAddType) btnAddType.addEventListener("click", () => openModal("add"));
  if (btnCloseModalX) btnCloseModalX.addEventListener("click", closeModal);
  if (btnCloseModalCancel) btnCloseModalCancel.addEventListener("click", closeModal);

  renderTable();
});
