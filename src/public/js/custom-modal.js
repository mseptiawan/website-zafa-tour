let confirmCallback = null;
function openConfirmModal({
  title = "Konfirmasi",
  message = "Apakah Anda yakin?",
  confirmText = "Ya, Lanjutkan",
  confirmClass = "bg-red-600 hover:bg-red-700",
  onConfirm = null,
} = {}) {
  console.log("===== DEBUG MODAL =====");

  const modal = document.getElementById("confirmModal");
  const titleEl = document.getElementById("confirmModalTitle");
  const messageEl = document.getElementById("confirmModalMessage");
  const button = document.getElementById("confirmModalButton");

  console.log("modal:", modal);
  console.log("title:", titleEl);
  console.log("message:", messageEl);
  console.log("button:", button);

  if (!modal || !titleEl || !messageEl || !button) {
    console.error("Ada element modal yang tidak ditemukan!");

    console.log("confirmModal =", document.getElementById("confirmModal"));
    console.log("confirmModalTitle =", document.getElementById("confirmModalTitle"));
    console.log("confirmModalMessage =", document.getElementById("confirmModalMessage"));
    console.log("confirmModalButton =", document.getElementById("confirmModalButton"));

    return;
  }

  titleEl.textContent = title;
  messageEl.textContent = message;

  button.textContent = confirmText;
  button.className = `px-4 py-2 text-white rounded-lg ${confirmClass}`;

  confirmCallback = onConfirm;

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

document.addEventListener("DOMContentLoaded", () => {
  console.log("===== DOM READY =====");

  console.log("confirmModal:", document.getElementById("confirmModal"));
  console.log("confirmModalTitle:", document.getElementById("confirmModalTitle"));
  console.log("confirmModalMessage:", document.getElementById("confirmModalMessage"));
  console.log("confirmModalButton:", document.getElementById("confirmModalButton"));
});
