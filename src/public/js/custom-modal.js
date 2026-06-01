let confirmCallback = null;

function openConfirmModal({
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmText = "Ya, Lanjutkan",
  confirmClass = "bg-red-600 hover:bg-red-700",
  onConfirm = null,
} = {}) {
  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalMessage").textContent = message;

  const button = document.getElementById("confirmModalButton");

  button.textContent = confirmText;
  button.className = `px-4 py-2 text-white rounded-lg ${confirmClass}`;

  confirmCallback = onConfirm;

  const modal = document.getElementById("confirmModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closeConfirmModal() {
  const modal = document.getElementById("confirmModal");

  modal.classList.add("hidden");
  modal.classList.remove("flex");

  confirmCallback = null;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("confirmModalButton")?.addEventListener("click", () => {
    if (confirmCallback) {
      confirmCallback();
    }

    closeConfirmModal();
  });

  document.getElementById("confirmModal")?.addEventListener("click", function (e) {
    if (e.target === this) {
      closeConfirmModal();
    }
  });
});
