document.addEventListener("DOMContentLoaded", () => {
  // Ambil element transport data dari EJS
  const unitsDataEl = document.getElementById("units-data");
  if (!unitsDataEl) return;

  // Baca data-attributes dinamis
  const employeeId = unitsDataEl.dataset.employeeId || "";
  const unitsData = JSON.parse(unitsDataEl.dataset.json || "[]");

  const tabs = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");
  const globalError = document.getElementById("global-error");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;
      tabs.forEach((t) => {
        t.classList.remove("border-blue-600", "text-blue-600", "font-bold");
        t.classList.add("border-transparent", "text-slate-500");
      });
      tab.classList.remove("border-transparent", "text-slate-500");
      tab.classList.add("border-blue-600", "text-blue-600", "font-bold");
      contents.forEach((c) => {
        if (c) {
          c.id === `content-${target}` ? c.classList.remove("hidden") : c.classList.add("hidden");
        }
      });
    });
  });

  // --- DEPENDENSI BIDANG VS UNIT ---
  const bidangSelect = document.getElementById("select-bidang");
  const unitSelect = document.getElementById("select-unit");

  if (bidangSelect && unitSelect) {
    const filterUnits = (bidangId, selectedUnitId = "") => {
      const hasSelected = selectedUnitId ? true : false;
      unitSelect.innerHTML = `<option value="" disabled ${!hasSelected ? "selected" : ""}>Pilih Unit Kantor</option>`;

      if (!bidangId) return;

      const filtered = unitsData.filter((u) => String(u.bidangId) === String(bidangId));

      filtered.forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u._id;
        opt.textContent = u.name;

        if (String(u._id) === String(selectedUnitId)) {
          opt.selected = true;
        }
        unitSelect.appendChild(opt);
      });
    };

    bidangSelect.addEventListener("change", (e) => filterUnits(e.target.value));

    const selectedBidangOption = bidangSelect.querySelector("option[selected]");
    const activeBidangId = selectedBidangOption ? selectedBidangOption.value : bidangSelect.value;
    const activeUnitId = unitSelect.getAttribute("data-old");

    if (activeBidangId) {
      filterUnits(activeBidangId, activeUnitId);
    }
  }

  // --- KONDISIONAL KONTRAK & MAGANG ---
  const statusSelect = document.getElementById("select-status");
  const kontrakWrapper = document.getElementById("wrapper-kontrak");
  const kontrakInput = document.getElementById("input-tanggal-kontrak");

  if (statusSelect && kontrakWrapper && kontrakInput) {
    const toggleKontrak = (val) => {
      if (val === "Pegawai Kontrak" || val === "Magang / Intern") {
        kontrakWrapper.classList.remove("hidden");
        kontrakInput.setAttribute("required", "required");
      } else {
        kontrakWrapper.classList.add("hidden");
        kontrakInput.removeAttribute("required");
        kontrakInput.value = "";
      }
    };
    statusSelect.addEventListener("change", (e) => toggleKontrak(e.target.value));
    if (statusSelect.value) toggleKontrak(statusSelect.value);
  }

  // --- REPEATER FORM KELUARGA ---
  const familyContainer = document.getElementById("family-container");
  if (familyContainer) {
    document.getElementById("btn-add-family").addEventListener("click", () => {
      const idx = familyContainer.querySelectorAll(".family-row").length;

      const html = `
    <div class="family-row grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 bg-slate-50 p-4 rounded-xl relative border border-slate-100">
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">Nama</label>
        <input type="text" name="anggota_keluarga[${idx}][nama]" required class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">Hubungan</label>
        <select name="anggota_keluarga[${idx}][hubungan]" required class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden appearance-none">
          <option value="" disabled selected>Pilih</option>
          <option value="Suami">Suami</option>
          <option value="Istri">Istri</option>
          <option value="Anak">Anak</option>
          <option value="Orang Tua">Orang Tua</option>
          <option value="Saudara Kandung">Saudara Kandung</option>
        </select>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">NIK</label>
        <input type="text" maxlength="16" name="anggota_keluarga[${idx}][nik]" class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">Jenis Kelamin</label>
        <select name="anggota_keluarga[${idx}][jenis_kelamin]" class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden appearance-none">
          <option value="" selected>-</option>
          <option value="Laki-laki">Laki-laki</option>
          <option value="Perempuan">Perempuan</option>
        </select>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">Tgl Lahir</label>
        <input type="date" name="anggota_keluarga[${idx}][tanggal_lahir]" class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">Pekerjaan</label>
        <input type="text" name="anggota_keluarga[${idx}][pekerjaan]" class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/>
      </div>
      
      <div class="space-y-1">
        <label class="text-[10px] text-slate-400 font-bold uppercase">Tanggungan?</label>
        <select name="anggota_keluarga[${idx}][status_tanggungan]" class="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden appearance-none">
          <option value="false" selected>Tidak</option>
          <option value="true">Ya</option>
        </select>
      </div>
      
      <button type="button" class="btn-remove-family absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-lg font-bold">×</button>
    </div>`;

      familyContainer.insertAdjacentHTML("beforeend", html);
    });

    familyContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-remove-family")) {
        e.target.closest(".family-row").remove();

        familyContainer.querySelectorAll(".family-row").forEach((row, newIdx) => {
          row.querySelectorAll("input, select").forEach((input) => {
            const nameAttr = input.getAttribute("name");
            if (nameAttr) {
              const updatedName = nameAttr.replace(/\[\d+\]/, `[${newIdx}]`);
              input.setAttribute("name", updatedName);
            }
          });
        });
      }
    });
  }
  // --- REPEATER FORM SERTIFIKAT ---
  const certContainer = document.getElementById("cert-container");
  if (certContainer) {
    document.getElementById("btn-add-cert").addEventListener("click", () => {
      const idx = certContainer.querySelectorAll(".cert-row").length;
      const html = `
    <div class="cert-row grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl relative border border-slate-100">
      <div class="space-y-1"><label class="text-[10px] text-slate-400 font-bold uppercase">Nama Sertifikat</label><input type="text" name="sertifikat_kompetensi[${idx}][nama_sertifikat]" class="w-full px-[14px] py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/></div>
      <div class="space-y-1"><label class="text-[10px] text-slate-400 font-bold uppercase">Penerbit / Lembaga</label><input type="text" name="sertifikat_kompetensi[${idx}][penerbit]" class="w-full px-[14px] py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/></div>
      <div class="space-y-1"><label class="text-[10px] text-slate-400 font-bold uppercase">Nomor Sertifikat</label><input type="text" name="sertifikat_kompetensi[${idx}][nomor_sertifikat]" class="w-full px-[14px] py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/></div>
      <div class="space-y-1"><label class="text-[10px] text-slate-400 font-bold uppercase">Tanggal Terbit</label><input type="date" name="sertifikat_kompetensi[${idx}][tanggal_terbit]" class="w-full px-[14px] py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/></div>
      <div class="space-y-1"><label class="text-[10px] text-slate-400 font-bold uppercase">Tanggal Kadaluarsa</label><input type="date" name="sertifikat_kompetensi[${idx}][tanggal_kadaluarsa]" class="w-full px-[14px] py-2 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/></div>
      <div class="space-y-1"><label class="text-[10px] text-slate-400 font-bold uppercase">Upload File Sertifikat</label><input type="file" name="file_sertifikat_${idx}" class="w-full px-[14px] py-1.5 text-xs font-medium border border-slate-200 rounded-xl bg-white outline-hidden"/></div>
      <button type="button" class="btn-remove-cert absolute top-2 right-2 text-rose-500 hover:text-rose-700 text-lg font-bold">×</button>
    </div>`;
      certContainer.insertAdjacentHTML("beforeend", html);
    });
    certContainer.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-remove-cert")) e.target.closest(".cert-row").remove();
    });
  }

  // --- INTERSEPTOR AJAX FETCH API PER-FORM ---
  const interceptForm = (formId, endpoint) => {
    const form = document.getElementById(formId);
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (globalError) globalError.classList.add("hidden");

      let bodyData;
      let headers = {};

      if (form.querySelector('input[type="file"]')) {
        bodyData = new FormData(form);
      } else {
        const formData = new FormData(form);
        const obj = {};

        formData.forEach((value, key) => {
          if (key.includes("[")) {
            const parts = key.split(/\[|\]/).filter((p) => p !== "");
            if (parts.length === 3) {
              const [arrName, idx, prop] = parts;
              if (!obj[arrName]) obj[arrName] = [];
              if (!obj[arrName][idx]) obj[arrName][idx] = {};
              obj[arrName][idx][prop] = value;
            } else if (parts.length === 2) {
              const [arrName, innerKey] = parts;
              if (isNaN(innerKey)) {
                if (!obj[arrName]) obj[arrName] = {};
                obj[arrName][innerKey] = value;
              } else {
                if (!obj[arrName]) obj[arrName] = [];
                obj[arrName][innerKey] = value;
              }
            }
          } else {
            obj[key] = value;
          }
        });
        bodyData = JSON.stringify(obj);
        headers["Content-Type"] = "application/json";
      }

      try {
        const res = await fetch(`/employee/${employeeId}/${endpoint}`, {
          method: "PUT",
          headers: headers,
          body: bodyData,
        });
        const result = await res.json();

        if (result.success) {
          triggerGlobalToast({
            title: "Berhasil",
            message: result.message || "Data berhasil diperbarui.",
            type: "success",
          });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          triggerGlobalToast({
            title: "Gagal",
            message: result.message || "Gagal memproses pembaruan data.",
            type: "error",
          });
        }
      } catch (err) {
        console.error("Fetch Error:", err);
        triggerGlobalToast({
          title: "Koneksi Terganggu",
          message: "Tidak dapat terhubung ke server.",
          type: "error",
        });
      }
    });
  };

  interceptForm("form-pribadi", "pribadi");
  interceptForm("form-karir", "karir");
  interceptForm("form-kontak", "kontak");
  interceptForm("form-dokumen", "dokumen");
  interceptForm("form-pendidikan", "pendidikan");
  interceptForm("form-keluarga", "keluarga");
  interceptForm("form-finansial", "finansial");
});
