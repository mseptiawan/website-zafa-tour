document.addEventListener("DOMContentLoaded", () => {
  // Parsing data awal dari elemen HTML penyimpan JSON murni
  const categoriesDataEl = document.getElementById("categories-data");
  let categories = [];

  if (categoriesDataEl && categoriesDataEl.dataset.json) {
    try {
      categories = JSON.parse(categoriesDataEl.dataset.json);
    } catch (e) {
      console.error("Gagal mengurai data kategori:", e);
    }
  }

  // DOM Elements Selector
  const tableBody = document.getElementById("category-table-body");
  const totalCounter = document.getElementById("total-kategori");
  const categoryModal = document.getElementById("category-modal");
  const categoryForm = document.getElementById("category-form");
  const modalTitle = document.getElementById("modal-title");

  // Input Fields Selector
  const formId = document.getElementById("form-id");
  const formName = document.getElementById("form-name");
  const formDescription = document.getElementById("form-description");

  // Action Buttons Selector
  const btnAddCategory = document.getElementById("btn-add-category");
  const btnCloseModalX = document.getElementById("btn-close-modal-x");
  const btnCloseModalCancel = document.getElementById("btn-close-modal-cancel");

  /**
   * Fungsi untuk me-render tabel kategori pengeluaran ke DOM
   */
  function renderTable() {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    let activeCount = 0;

    if (!categories || !categories.length) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-12 text-slate-400">
            Belum ada data kategori pengeluaran
          </td>
        </tr>`;
      if (totalCounter) totalCounter.textContent = "0";
      return;
    }

    categories.forEach((cat) => {
      if (cat.isActive) activeCount++;

      const rowOpacity = cat.isActive ? "" : "opacity-60 bg-slate-50";
      const statusText = cat.isActive ? "Aktif" : "Non-Aktif";
      const textClass = cat.isActive ? "text-emerald-600" : "text-slate-500";
      const bgClass = cat.isActive ? "bg-emerald-50/70" : "bg-slate-100";
      const borderClass = cat.isActive ? "border-emerald-200/50" : "border-slate-200";
      const dotClass = cat.isActive ? "bg-emerald-500" : "bg-slate-400";

      const tr = document.createElement("tr");
      tr.className = `hover:bg-slate-50/50 transition ${rowOpacity}`;

      const descriptionContent = cat.description
        ? cat.description
        : '<span class="text-slate-300 italic">Tidak ada deskripsi</span>';

      tr.innerHTML = `
        <td class="px-6 py-4 font-semibold text-slate-800">
          ${cat.name}
        </td>
        <td class="px-6 py-4 text-slate-500 text-xs max-w-sm truncate">
          ${descriptionContent}
        </td>
        <td class="px-6 py-4">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide ${textClass} ${bgClass} ${borderClass}">
            <span class="w-1.5 h-1.5 rounded-full ${dotClass}"></span>
            <span>${statusText}</span>
          </div>
        </td>
        <td class="px-6 py-4">
          <div class="flex items-center justify-end gap-2">
            ${
              cat.isActive
                ? `
              <button data-id="${cat._id}" class="btn-edit-trigger inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-400 text-white hover:bg-amber-500 transition active:scale-[0.95] cursor-pointer">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4h3m2.586 2.586a2 2 0 010 2.828l-8.5 8.5L5 18l.086-3.086 8.5-8.5a2 2 0 012.828 0z" />
                </svg>
              </button>
              <button data-id="${cat._id}" data-action="deactivate" class="btn-toggle-trigger inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition active:scale-[0.95] cursor-pointer" title="Nonaktifkan Kategori">
                <i class="fa-solid fa-eye-slash text-xs"></i>
              </button>
            `
                : `
              <button data-id="${cat._id}" data-action="activate" class="btn-toggle-trigger inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[11px] font-bold transition active:scale-[0.95] cursor-pointer">
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

  /**
   * Mengatur visibilitas modal window CRUD
   */
  function openModal(mode, id = null) {
    if (!categoryModal) return;
    categoryModal.classList.remove("hidden");
    categoryModal.classList.add("flex");

    if (mode === "edit" && id) {
      if (modalTitle) modalTitle.textContent = "Edit Kategori Pengeluaran";
      const cat = categories.find((c) => c._id === id);
      if (cat) {
        if (formId) formId.value = cat._id;
        if (formName) formName.value = cat.name;
        if (formDescription) formDescription.value = cat.description || "";
      }
    } else {
      if (modalTitle) modalTitle.textContent = "Tambah Kategori Pengeluaran";
      if (categoryForm) categoryForm.reset();
      if (formId) formId.value = "";
    }
  }

  function closeModal() {
    if (!categoryModal) return;
    categoryModal.classList.add("hidden");
    categoryModal.classList.remove("flex");
  }

  /**
   * Pemasangan Event Listener untuk elemen dinamis dalam tabel
   */
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

        // Integrasi Sistem Modal Konfirmasi Kustom (Mengganti window.confirm)
        openConfirmModal({
          title: shouldActivate ? "Aktifkan Kategori" : "Nonaktifkan Kategori",
          message: shouldActivate
            ? "Apakah Anda yakin ingin mengaktifkan kategori ini kembali?"
            : "Apakah Anda yakin ingin menonaktifkan kategori ini?",
          confirmText: shouldActivate ? "Ya, Aktifkan" : "Ya, Nonaktifkan",
          confirmClass: shouldActivate
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-rose-600 hover:bg-rose-700",
          onConfirm: () => {
            handleToggleStatus(id, shouldActivate);
          },
        });
      });
    });
  }

  // API Submit Form handler
  if (categoryForm) {
    categoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = formId ? formId.value : "";
      const payload = {
        name: formName ? formName.value : "",
        description: formDescription ? formDescription.value : "",
      };

      try {
        const url = id ? `/expense-categories/${id}` : "/expense-categories";
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

  // API Toggle status handler
  async function handleToggleStatus(id, shouldActivate) {
    try {
      const response = await fetch(`/expense-categories/toggle-status/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: shouldActivate }),
      });

      const result = await response.json();
      if (!result.success) throw new Error(result.message);
      location.reload();
    } catch (error) {
      alert(error.message || "Gagal mengubah status kategori.");
    }
  }

  // Static Event Listeners untuk Form CRUD Modal
  if (btnAddCategory) btnAddCategory.addEventListener("click", () => openModal("add"));
  if (btnCloseModalX) btnCloseModalX.addEventListener("click", closeModal);
  if (btnCloseModalCancel) btnCloseModalCancel.addEventListener("click", closeModal);

  // Jalankan render tabel saat halaman pertama dimuat
  renderTable();
});
