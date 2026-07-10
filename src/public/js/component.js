let components = window.__INITIAL_COMPONENTS__ || [];

const tableBody = document.getElementById("component-table-body");
const totalCounter = document.getElementById("total-komponen");
const compModal = document.getElementById("component-modal");
const docModal = document.getElementById("doc-modal");

function normalizeCategory(category) {
  return category === "EARNING" ? "Pendapatan" : "Potongan";
}

function normalizeType(type) {
  return type === "FIXED" ? "Tetap" : "Tidak Tetap";
}

function renderTable() {
  tableBody.innerHTML = "";

  if (!components.length) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-12 text-slate-400">
          Belum ada data komponen gaji
        </td>
      </tr>`;
    totalCounter.textContent = "0";
    return;
  }

  components.forEach((comp) => {
    const rowOpacity = comp.isActive ? "" : "opacity-60 bg-slate-50";
    const statusLabel = comp.isActive
      ? ""
      : '<span class="text-[9px] font-bold text-slate-400 uppercase ml-2">(Diarsipkan)</span>';
    const category = normalizeCategory(comp.category);
    const type = normalizeType(comp.type);

    const displayValue =
      comp.calculationType === "PERCENTAGE"
        ? `${comp.defaultAmount}%`
        : `Rp ${Number(comp.defaultAmount).toLocaleString("id-ID")}`;

    const isEarning = category === "Pendapatan";
    const textClass = isEarning ? "text-emerald-600" : "text-rose-600";
    const bgClass = isEarning ? "bg-emerald-50/70" : "bg-rose-50/70";
    const borderClass = isEarning ? "border-emerald-200/50" : "border-rose-200/50";
    const dotClass = isEarning ? "bg-emerald-500" : "bg-rose-500";

    const tr = document.createElement("tr");
    tr.className = `hover:bg-slate-50/50 transition ${rowOpacity}`;
    tr.innerHTML = `
      <td class="px-6 py-4">
        <span class="font-semibold text-slate-800 block">${comp.name} ${statusLabel}</span>
        <span class="text-[10px] font-mono bg-slate-50 border border-slate-200/60 text-slate-500 px-1.5 py-0.5 rounded inline-block mt-1">
          ${comp.code}
        </span>
      </td>
      <td class="px-6 py-4">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium tracking-wide ${textClass} ${bgClass} ${borderClass}">
          <span>${category}</span>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="text-slate-700 font-semibold text-xs">${type} (Jumlah: ${displayValue})</div>
      </td>
      <td class="px-6 py-4">
        <div class="flex items-center justify-end gap-2">
          ${
            comp.isActive
              ? `
            <button onclick="openModal('edit', '${comp._id}')" 
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-amber-400 text-white hover:bg-amber-500 transition active:scale-[0.95] cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 4h3m2.586 2.586a2 2 0 010 2.828l-8.5 8.5L5 18l.086-3.086 8.5-8.5a2 2 0 012.828 0z" />
              </svg>
            </button>
            <button onclick="deleteComponent('${comp._id}')" 
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition active:scale-[0.95] cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          `
              : `
            <button onclick="restoreComponent('${comp._id}')" 
              class="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[11px] font-bold transition active:scale-[0.95] cursor-pointer">
              <i class="fa-solid fa-rotate-left mr-1.5 text-[10px]"></i> Aktifkan
            </button>
          `
          }
        </div>
      </td>`;
    tableBody.appendChild(tr);
  });

  totalCounter.textContent = components.filter((c) => c.isActive).length;
}

function clearValidationErrors() {
  const errorElements = document.querySelectorAll("[id^='error-form-']");
  errorElements.forEach((el) => {
    el.textContent = "";
    el.classList.add("hidden");
  });
}

function openModal(mode, id = null) {
  compModal.classList.remove("hidden");
  compModal.classList.add("flex");
  clearValidationErrors();

  if (mode === "edit") {
    document.getElementById("modal-title").textContent = "Edit Komponen Gaji";
    const comp = components.find((c) => c._id === id);

    document.getElementById("form-id").value = comp._id;
    document.getElementById("form-code").value = comp.code;
    document.getElementById("form-code").disabled = true;
    document.getElementById("form-name").value = comp.name;
    document.getElementById("form-category").value = normalizeCategory(comp.category);
    document.getElementById("form-type").value = normalizeType(comp.type);
    document.getElementById("form-calc-type").value = comp.calculationType || "FIXED_AMOUNT";
    document.getElementById("form-amount").value = comp.defaultAmount;

    updatePlaceholder();
  } else {
    document.getElementById("modal-title").textContent = "Tambah Komponen Gaji";
    document.getElementById("component-form").reset();
    document.getElementById("form-id").value = "";
    document.getElementById("form-code").disabled = false;

    updatePlaceholder();
  }
}

function closeModal() {
  compModal.classList.add("hidden");
  compModal.classList.remove("flex");
}

async function saveComponent(e) {
  e.preventDefault();
  clearValidationErrors();

  const id = document.getElementById("form-id").value;
  const payload = {
    code: document.getElementById("form-code").value.toUpperCase(),
    name: document.getElementById("form-name").value,
    category:
      document.getElementById("form-category").value === "Pendapatan" ? "EARNING" : "DEDUCTION",
    type: document.getElementById("form-type").value === "Tetap" ? "FIXED" : "FLEXIBLE",
    calculationType: document.getElementById("form-calc-type").value,
    defaultAmount: parseFloat(document.getElementById("form-amount").value) || 0,
  };

  try {
    const url = id ? `/components/${id}` : "/components";
    const method = id ? "PUT" : "POST";

    const response = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      location.reload();
    } else {
      let globalMessage = "Gagal memproses komponen gaji.";

      if (result.errors && typeof result.errors === "object") {
        Object.keys(result.errors).forEach((fieldKey) => {
          const targetEl = document.getElementById(`error-form-${fieldKey}`);
          if (targetEl) {
            targetEl.textContent = result.errors[fieldKey];
            targetEl.classList.remove("hidden");
          }
        });
        globalMessage = Object.values(result.errors)[0];
      } else if (result.message) {
        globalMessage = result.message;
      }

      if (typeof triggerGlobalToast === "function") {
        triggerGlobalToast({ title: "Gagal Validasi", message: globalMessage, type: "error" });
      } else {
        alert(globalMessage);
      }
    }
  } catch (error) {
    console.error(error);
    alert("Gagal menghubungi server.");
  }
}

async function deleteComponent(id) {
  if (!confirm("Apakah Anda yakin ingin mengarsipkan komponen ini?")) return;

  try {
    const response = await fetch(`/components/${id}`, { method: "PATCH" });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

async function restoreComponent(id) {
  if (!confirm("Apakah Anda yakin ingin mengaktifkan kembali komponen ini?")) return;

  try {
    const response = await fetch(`/components/restore/${id}`, { method: "PATCH" });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    location.reload();
  } catch (error) {
    alert(error.message);
  }
}

function updatePlaceholder() {
  const type = document.getElementById("form-calc-type").value;
  const input = document.getElementById("form-amount");
  const label = document.getElementById("label-value");
  const symbol = document.getElementById("unit-symbol");

  if (type === "PERCENTAGE") {
    label.textContent = "Nilai Persentase";
    input.placeholder = "Masukkan persentase (contoh: 10)";
    symbol.textContent = "%";
  } else {
    label.textContent = "Nilai Nominal";
    input.placeholder = "Masukkan nominal dalam Rupiah";
    symbol.textContent = "Rp";
  }
}

function openDocModal() {
  docModal.classList.remove("hidden");
  docModal.classList.add("flex");
}

function closeDocModal() {
  docModal.classList.add("hidden");
  docModal.classList.remove("flex");
}

function generateDocument(event) {
  event.preventDefault();
  alert("Dokumen berhasil dibuat!");
  closeDocModal();
}

renderTable();
