/**
 * Core HRIS Global Reusable File Upload Handler
 * Menggunakan Event Delegation berbasis [data-file-upload]
 */

document.addEventListener("DOMContentLoaded", () => {
  // 1. HANDLER: Deteksi Perubahan Input File (File Selected)
  document.addEventListener("change", function (e) {
    if (!e.target.matches(".file-upload-input")) return;

    const wrapper = e.target.closest("[data-file-upload]");
    if (!wrapper) return;

    const emptyZone = wrapper.querySelector(".dropzone-empty");
    const filledZone = wrapper.querySelector(".dropzone-filled");
    const nameLabel = wrapper.querySelector(".file-name");
    const sizeLabel = wrapper.querySelector(".file-size");
    const viewBtn = wrapper.querySelector(".btn-view-file");
    const resetBtn = wrapper.querySelector(".btn-reset-file");

    const file = e.target.files[0];

    if (!file) return;

    // Set preview teks nama & ukuran file
    nameLabel.textContent = file.name;
    sizeLabel.textContent = (file.size / 1024).toFixed(1) + " KB";

    // Set blob URL untuk tombol View sementara (client-side preview)
    if (viewBtn) {
      viewBtn.href = URL.createObjectURL(file);
      viewBtn.classList.remove("hidden");
    }

    // Tampilkan tombol hapus/reset berkas baru
    if (resetBtn) {
      resetBtn.classList.remove("hidden");
    }

    // Tukar state tampilan dropzone
    emptyZone.classList.add("hidden");
    filledZone.classList.remove("hidden");
    e.target.classList.add("hidden"); // Sembunyikan input agar tidak menghalangi button click
  });

  // 2. HANDLER: Tombol "Ganti" File
  document.addEventListener("click", function (e) {
    const changeBtn = e.target.closest(".btn-change-file");
    if (!changeBtn) return;

    const wrapper = changeBtn.closest("[data-file-upload]");
    if (!wrapper) return;

    const fileInput = wrapper.querySelector(".file-upload-input");
    fileInput.classList.remove("hidden");
    fileInput.click();
  });

  // 3. HANDLER: Tombol "Hapus / Reset" File Baru
  document.addEventListener("click", function (e) {
    const resetBtn = e.target.closest(".btn-reset-file");
    if (!resetBtn) return;

    const wrapper = resetBtn.closest("[data-file-upload]");
    if (!wrapper) return;

    const fileInput = wrapper.querySelector(".file-upload-input");
    const emptyZone = wrapper.querySelector(".dropzone-empty");
    const filledZone = wrapper.querySelector(".dropzone-filled");
    const isRequired = fileInput.getAttribute("data-required") === "true";

    // Reset value input file fisik
    fileInput.value = "";
    fileInput.classList.remove("hidden");

    // Kembalikan validasi html5 required jika aslinya bernilai true
    if (isRequired) {
      fileInput.required = true;
    }

    // Kembalikan ke state kosong
    emptyZone.classList.remove("hidden");
    filledZone.classList.add("hidden");
    resetBtn.classList.add("hidden");
  });
});
