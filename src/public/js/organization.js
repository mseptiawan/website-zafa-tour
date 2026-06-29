document.addEventListener("DOMContentLoaded", () => {
  refreshWorkspace();
  const savedTab = localStorage.getItem("activeOrgTab") || "bidang";
  switchTab(savedTab);
});
function refreshWorkspace() {
  renderBidangTable();
  renderUnitTable();
  renderJabatanTable();
  populateBidangSelect();
  calculateStats();
}

function updateTabBadges() {
  const badgeBidang = document.getElementById("badge-count-bidang");
  const badgeUnit = document.getElementById("badge-count-unit");
  const badgeJabatan = document.getElementById("badge-count-jabatan");

  if (badgeBidang) badgeBidang.innerText = window.listBidang.length;
  if (badgeUnit) badgeUnit.innerText = window.listUnit.length;
  if (badgeJabatan) badgeJabatan.innerText = window.listJabatan.length;
}

function calculateStats() {
  const bidangEl = document.getElementById("stat-total-bidang");
  const unitEl = document.getElementById("stat-total-unit");
  const jabatanEl = document.getElementById("stat-total-jabatan");

  if (bidangEl) bidangEl.childNodes[0].textContent = window.listBidang.length + " ";
  if (unitEl) unitEl.childNodes[0].textContent = window.listUnit.length + " ";
  if (jabatanEl) jabatanEl.childNodes[0].textContent = window.listJabatan.length + " ";
}
function switchTab(tabName) {
  localStorage.setItem("activeOrgTab", tabName);

  const tabs = ["bidang", "unit", "jabatan"];

  tabs.forEach((tab) => {
    const formPanel = document.getElementById(`form-panel-${tab}`);
    const tablePanel = document.getElementById(`table-panel-${tab}`);
    const btn = document.getElementById(`tab-btn-${tab}`);

    if (tab === tabName) {
      formPanel?.classList.remove("hidden");
      tablePanel?.classList.remove("hidden");

      if (btn) {
        btn.className =
          "tab-btn flex-none whitespace-nowrap rounded-lg px-3.5 py-1.5 text-center text-[11px] transition-all duration-200 outline-none cursor-pointer bg-white font-bold text-slate-900 shadow-xs";
      }
    } else {
      formPanel?.classList.add("hidden");
      tablePanel?.classList.add("hidden");

      if (btn) {
        btn.className =
          "tab-btn flex-none whitespace-nowrap rounded-lg px-3.5 py-1.5 text-center text-[11px] transition-all duration-200 outline-none cursor-pointer font-medium text-slate-500 hover:text-slate-800";
      }
    }
  });
}

function populateBidangSelect() {
  const selectEl = document.getElementById("input-unit-bidangId");
  if (!selectEl) return;
  let markup = '<option value="" disabled selected>-- Pilih Bidang Induk --</option>';
  window.listBidang.forEach((b) => {
    markup += `<option value="${b._id}">${b.name}</option>`;
  });
  selectEl.innerHTML = markup;
}

function renderBidangTable() {
  const container = document.getElementById("render-list-bidang");
  container.innerHTML = "";
  if (window.listBidang.length === 0) {
    container.innerHTML = `<tr><td colspan="2" class="p-5 text-center text-slate-400 italic">Kosong</td></tr>`;
    return;
  }
  window.listBidang.forEach((item) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <tr class="hover:bg-slate-50/50 transition duration-150"><td class="py-3.5 px-5 font-medium text-slate-900">${item.name}</td>
      <td class="py-3.5 px-5 text-center"><button onclick="toggleExpandRow('bidang', '${item._id}')" id="arrow-bidang-${item._id}" class="text-slate-400 hover:text-slate-700 w-7 h-7 inline-flex items-center justify-center border border-transparent hover:border-slate-200 rounded-lg transition cursor-pointer"><svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button></td></tr>
      <tr class="hidden bg-slate-50/50" id="row-bidang-expand-${item._id}"><td colspan="2" class="p-4"><form onsubmit="handleUpdateBidang(event, '${item._id}')" class="bg-white p-4 border border-slate-200 rounded-xl space-y-3"><input type="text" name="name" value="${item.name}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px]" required /><div class="flex justify-between"><button type="button" onclick="handleDeleteBidang('${item._id}')" class="text-rose-500 font-medium text-[11px]">Hapus</button><div><button type="button" onclick="toggleExpandRow('bidang', '${item._id}')" class="text-slate-500 text-[11.5px] mr-2">Batal</button><button type="submit" class="bg-blue-600 text-white text-[11.5px] px-4 py-1.5 rounded-lg">Simpan</button></div></div></form></td></tr>`
    );
  });
}

function renderUnitTable() {
  const container = document.getElementById("render-list-unit");
  container.innerHTML = "";
  if (window.listUnit.length === 0) {
    container.innerHTML = `<tr><td colspan="3" class="p-5 text-center text-slate-400 italic">Kosong</td></tr>`;
    return;
  }
  window.listUnit.forEach((item) => {
    const pName = item.bidangId?.name || "Unknown";
    container.insertAdjacentHTML(
      "beforeend",
      `
      <tr class="hover:bg-slate-50/50 transition duration-150"><td class="py-3.5 px-5"><div class="flex flex-col"><span class="font-medium text-slate-900">${item.name}</span><span class="text-[11px] text-slate-400 font-medium mt-0.5">${item.description || ""}</span></div></td><td class="py-3.5 px-5 text-slate-500 font-medium">${pName}</td>
      <td class="py-3.5 px-5 text-center"><button onclick="toggleExpandRow('unit', '${item._id}')" id="arrow-unit-${item._id}" class="text-slate-400 hover:text-slate-700 w-7 h-7 inline-flex items-center justify-center border border-transparent hover:border-slate-200 rounded-lg transition cursor-pointer"><svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button></td></tr>
      <tr class="hidden bg-slate-50/50" id="row-unit-expand-${item._id}"><td colspan="3" class="p-4"><form onsubmit="handleUpdateUnit(event, '${item._id}')" class="bg-white p-4 border border-slate-200 rounded-xl space-y-3"><input type="text" name="name" value="${item.name}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px]" required /><input type="text" name="description" value="${item.description || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px]" /><div class="flex justify-between"><button type="button" onclick="handleDeleteUnit('${item._id}')" class="text-rose-500 font-medium text-[11px]">Hapus</button><div><button type="button" onclick="toggleExpandRow('unit', '${item._id}')" class="text-slate-500 text-[11.5px] mr-2">Batal</button><button type="submit" class="bg-indigo-600 text-white text-[11.5px] px-4 py-1.5 rounded-lg">Simpan</button></div></div></form></td></tr>`
    );
  });
}

function renderJabatanTable() {
  const container = document.getElementById("render-list-jabatan");
  container.innerHTML = "";
  if (window.listJabatan.length === 0) {
    container.innerHTML = `<tr><td colspan="2" class="p-5 text-center text-slate-400 italic">Kosong</td></tr>`;
    return;
  }
  window.listJabatan.forEach((item) => {
    container.insertAdjacentHTML(
      "beforeend",
      `
      <tr class="hover:bg-slate-50/50 transition duration-150"><td class="py-3.5 px-5"><div class="flex flex-col"><span class="font-medium text-slate-900">${item.name}</span><span class="text-[11px] text-slate-400 font-medium mt-0.5">${item.description || ""}</span></div></td>
      <td class="py-3.5 px-5 text-center"><button onclick="toggleExpandRow('jabatan', '${item._id}')" id="arrow-jabatan-${item._id}" class="text-slate-400 hover:text-slate-700 w-7 h-7 inline-flex items-center justify-center border border-transparent hover:border-slate-200 rounded-lg transition cursor-pointer"><svg class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg></button></td></tr>
      <tr class="hidden bg-slate-50/50" id="row-jabatan-expand-${item._id}"><td colspan="2" class="p-4"><form onsubmit="handleUpdateJabatan(event, '${item._id}')" class="bg-white p-4 border border-slate-200 rounded-xl space-y-3"><input type="text" name="name" value="${item.name}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px]" required /><input type="text" name="description" value="${item.description || ""}" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-[12.5px]" /><div class="flex justify-between"><button type="button" onclick="handleDeleteJabatan('${item._id}')" class="text-rose-500 font-medium text-[11px]">Hapus</button><div><button type="button" onclick="toggleExpandRow('jabatan', '${item._id}')" class="text-slate-500 text-[11.5px] mr-2">Batal</button><button type="submit" class="bg-emerald-600 text-white text-[11.5px] px-4 py-1.5 rounded-lg">Simpan</button></div></div></form></td></tr>`
    );
  });
}

async function handleCreateBidang(event) {
  event.preventDefault();
  const input = document.getElementById("input-bidang-name");
  try {
    const res = await fetch("/organization/bidang", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input.value }),
    });

    const data = await res.json();
    console.log("Response Data dari Backend:", data);
    if (data.success) {
      window.listBidang.unshift(data.data);
      input.value = "";
      refreshWorkspace();
      triggerGlobalToast({
        title: "Berhasil",
        message: "Bidang induk berhasil ditambahkan!",
        type: "success",
      });
    } else {
      let errorMessage = "Gagal menambahkan bidang.";

      if (data.errors && typeof data.errors === "object") {
        const errorValues = Object.values(data.errors);
        if (errorValues.length > 0) {
          errorMessage = errorValues[0];
        }
      } else if (data.message) {
        errorMessage = data.message;
      }

      triggerGlobalToast({
        title: "Gagal Validasi",
        message: errorMessage,
        type: "error",
      });
    }
  } catch (e) {
    console.error(e);
    triggerGlobalToast({
      title: "Error",
      message: "Gagal menghubungkan ke server.",
      type: "error",
    });
  }
}
async function handleUpdateBidang(event, id) {
  event.preventDefault();
  const name = new FormData(event.target).get("name");
  try {
    const res = await fetch(`/organization/bidang/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    if (data.success) {
      const idx = window.listBidang.findIndex((b) => b._id === id);
      window.listBidang[idx].name = name;
      refreshWorkspace();
    } else {
      alert(data.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleDeleteBidang(id) {
  if (!confirm("Hapus bidang ini?")) return;
  try {
    const res = await fetch(`/organization/bidang/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.listBidang = window.listBidang.filter((b) => b._id !== id);
      refreshWorkspace();
    } else {
      alert(data.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleCreateUnit(event) {
  event.preventDefault();
  const bId = document.getElementById("input-unit-bidangId").value;
  const n = document.getElementById("input-unit-name");
  const d = document.getElementById("input-unit-desc");

  try {
    const res = await fetch("/organization/unit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bidangId: bId, name: n.value, description: d.value }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      window.listUnit.unshift(data.data);
      n.value = "";
      d.value = "";
      refreshWorkspace();
      triggerGlobalToast({
        title: "Berhasil",
        message: "Sub-Unit Kerja berhasil ditambahkan!",
        type: "success",
      });
    } else {
      let errorMessage = "Gagal menambahkan sub-unit kerja.";

      if (data.errors && typeof data.errors === "object") {
        const errorValues = Object.values(data.errors);
        if (errorValues.length > 0) {
          errorMessage = errorValues[0];
        }
      } else if (data.message) {
        errorMessage = data.message;
      }

      triggerGlobalToast({ title: "Gagal Validasi", message: errorMessage, type: "error" });
    }
  } catch (e) {
    console.error(e);
    triggerGlobalToast({
      title: "Error",
      message: "Gagal menghubungkan ke server.",
      type: "error",
    });
  }
}

async function handleUpdateUnit(event, id) {
  event.preventDefault();
  const f = new FormData(event.target);
  const name = f.get("name");
  const description = f.get("description");
  try {
    const res = await fetch(`/organization/unit/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (data.success) {
      const idx = window.listUnit.findIndex((u) => u._id === id);
      window.listUnit[idx].name = name;
      window.listUnit[idx].description = description;
      refreshWorkspace();
    } else {
      alert(data.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleDeleteUnit(id) {
  if (!confirm("Hapus unit ini?")) return;
  try {
    const res = await fetch(`/organization/unit/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.listUnit = window.listUnit.filter((u) => u._id !== id);
      refreshWorkspace();
    } else {
      alert(data.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleCreateJabatan(event) {
  event.preventDefault();
  const n = document.getElementById("input-jabatan-name");
  const k = document.getElementById("input-jabatan-keterangan");

  try {
    const res = await fetch("/organization/position", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: n.value, description: k.value }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      window.listJabatan.unshift(data.data);
      n.value = "";
      k.value = "";
      refreshWorkspace();
      triggerGlobalToast({
        title: "Berhasil",
        message: "Level Jabatan baru berhasil ditambahkan!",
        type: "success",
      });
    } else {
      let errorMessage = "Gagal menambahkan level jabatan.";

      if (data.errors && typeof data.errors === "object") {
        const errorValues = Object.values(data.errors);
        if (errorValues.length > 0) {
          errorMessage = errorValues[0];
        }
      } else if (data.message) {
        errorMessage = data.message;
      }

      triggerGlobalToast({ title: "Gagal Validasi", message: errorMessage, type: "error" });
    }
  } catch (e) {
    console.error(e);
    triggerGlobalToast({
      title: "Error",
      message: "Gagal menghubungkan ke server.",
      type: "error",
    });
  }
}
async function handleUpdateJabatan(event, id) {
  event.preventDefault();
  const f = new FormData(event.target);
  const name = f.get("name");
  const description = f.get("description");
  try {
    const res = await fetch(`/organization/position/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    const data = await res.json();
    if (data.success) {
      const idx = window.listJabatan.findIndex((j) => j._id === id);
      window.listJabatan[idx].name = name;
      window.listJabatan[idx].description = description;
      refreshWorkspace();
    } else {
      alert(data.message);
    }
  } catch (e) {
    console.error(e);
  }
}

async function handleDeleteJabatan(id) {
  if (!confirm("Hapus jabatan ini?")) return;
  try {
    const res = await fetch(`/organization/position/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      window.listJabatan = window.listJabatan.filter((j) => j._id !== id);
      refreshWorkspace();
    } else {
      alert(data.message);
    }
  } catch (e) {
    console.error(e);
  }
}

function toggleExpandRow(type, id) {
  const el = document.getElementById(`row-${type}-expand-${id}`);
  const svg = document.getElementById(`arrow-${type}-${id}`).querySelector("svg");
  const isHidden = el.classList.contains("hidden");
  el.classList.toggle("hidden", !isHidden);
  svg.classList.toggle("rotate-180", isHidden);
}
