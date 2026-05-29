window.openModal = (options) => {
  const modal = document.getElementById("custom-confirm-modal");
  if (!modal) return;

  const modalContent = modal.querySelector(".relative");
  const confirmBtn = document.getElementById("modal-confirm-btn");
  const titleEl = document.getElementById("modal-title");
  const textEl = document.getElementById("modal-text");
  const cancelTextEl = document.getElementById("modal-cancel-text");
  const confirmTextEl = document.getElementById("modal-confirm-text");
  const iconContainer = document.getElementById("modal-icon-container");
  const iconDanger = document.getElementById("modal-icon-danger");
  const iconSuccess = document.getElementById("modal-icon-success");

  titleEl.textContent = options.title;
  textEl.textContent = options.text;
  cancelTextEl.textContent = options.cancelText;
  confirmTextEl.textContent = options.confirmText;

  iconDanger.classList.add("hidden");
  iconSuccess.classList.add("hidden");
  iconContainer.className = "w-14 h-14 rounded-full flex items-center justify-center mb-4";

  if (options.type === "danger" || options.type === "warning") {
    iconContainer.classList.add("bg-rose-50", "text-rose-600", "border", "border-rose-100");
    iconDanger.classList.remove("hidden");
    confirmBtn.className =
      "w-full inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl py-2.5 text-xs font-semibold transition active:scale-[0.98] cursor-pointer shadow-sm shadow-rose-100";
  } else {
    iconContainer.classList.add(
      "bg-emerald-50",
      "text-emerald-600",
      "border",
      "border-emerald-100"
    );
    iconSuccess.classList.remove("hidden");
    confirmBtn.className =
      "w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold transition active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-100";
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setTimeout(() => {
    modalContent.classList.remove("scale-95", "opacity-0");
    modalContent.classList.add("scale-100", "opacity-100");
  }, 10);
};

document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("custom-confirm-modal");
  if (!modal) return;

  const modalContent = modal.querySelector(".relative");
  const overlay = document.getElementById("modal-overlay");
  const closeX = document.getElementById("modal-close-x");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const confirmBtn = document.getElementById("modal-confirm-btn");

  let activeFormId = null;
  let activeTargetUrl = null;

  const closeModal = () => {
    modalContent.classList.remove("scale-100", "opacity-100");
    modalContent.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
      modal.classList.remove("flex");
      activeFormId = null;
      activeTargetUrl = null;
      confirmBtn.onclick = null;
    }, 200);
  };

  document.body.addEventListener("click", (e) => {
    const targetBtn = e.target.closest(".btn-confirm");
    if (!targetBtn) return;

    e.preventDefault();
    e.stopPropagation();

    activeFormId = targetBtn.getAttribute("data-form-id");
    activeTargetUrl = targetBtn.getAttribute("href");

    window.openModal({
      title: targetBtn.getAttribute("data-title") || "Konfirmasi Aksi",
      text: targetBtn.getAttribute("data-text") || "Apakah Anda yakin?",
      confirmText: targetBtn.getAttribute("data-confirm-text") || "Konfirmasi",
      cancelText: targetBtn.getAttribute("data-cancel-text") || "Batal",
      type: targetBtn.getAttribute("data-type") || "default",
    });
  });

  [overlay, closeX, cancelBtn].forEach((element) => {
    if (element) {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    }
  });

  confirmBtn.addEventListener("click", (e) => {
    if (confirmBtn.onclick === null) {
      e.preventDefault();
      if (activeFormId) {
        const form = document.getElementById(activeFormId);
        if (form) form.submit();
      } else if (activeTargetUrl) {
        window.location.href = activeTargetUrl;
      }
      closeModal();
    }
  });
});
