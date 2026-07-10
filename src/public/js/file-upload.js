/**
 * Core HRIS Global Reusable File Upload Handler
 * Menggunakan Event Delegation berbasis [data-file-upload]
 */

document.addEventListener("DOMContentLoaded", () => {
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

    nameLabel.textContent = file.name;
    sizeLabel.textContent = (file.size / 1024).toFixed(1) + " KB";

    if (viewBtn) {
      viewBtn.href = URL.createObjectURL(file);
      viewBtn.classList.remove("hidden");
    }

    if (resetBtn) {
      resetBtn.classList.remove("hidden");
    }

    emptyZone.classList.add("hidden");
    filledZone.classList.remove("hidden");
    e.target.classList.add("hidden");
  });

  document.addEventListener("click", function (e) {
    const changeBtn = e.target.closest(".btn-change-file");
    if (!changeBtn) return;

    const wrapper = changeBtn.closest("[data-file-upload]");
    if (!wrapper) return;

    const fileInput = wrapper.querySelector(".file-upload-input");
    fileInput.classList.remove("hidden");
    fileInput.click();
  });

  document.addEventListener("click", function (e) {
    const resetBtn = e.target.closest(".btn-reset-file");
    if (!resetBtn) return;

    const wrapper = resetBtn.closest("[data-file-upload]");
    if (!wrapper) return;

    const fileInput = wrapper.querySelector(".file-upload-input");
    const emptyZone = wrapper.querySelector(".dropzone-empty");
    const filledZone = wrapper.querySelector(".dropzone-filled");
    const isRequired = fileInput.getAttribute("data-required") === "true";

    fileInput.value = "";
    fileInput.classList.remove("hidden");

    if (isRequired) {
      fileInput.required = true;
    }

    emptyZone.classList.remove("hidden");
    filledZone.classList.add("hidden");
    resetBtn.classList.add("hidden");
  });
});
