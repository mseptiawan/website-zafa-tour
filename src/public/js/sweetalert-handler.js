document.addEventListener("DOMContentLoaded", () => {
  const confirmButtons = document.querySelectorAll(".btn-confirm");

  confirmButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();

      const formId = button.getAttribute("data-form-id");
      const title = button.getAttribute("data-title") || "Apakah kamu yakin?";
      const text = button.getAttribute("data-text") || "Tindakan ini tidak dapat dibatalkan.";
      const confirmText = button.getAttribute("data-confirm-text") || "Ya, Lanjutkan!";
      const cancelText = button.getAttribute("data-cancel-text") || "Batal";
      const type = button.getAttribute("data-type") || "warning";

      // Tema Warna Tombol Utama & Aksen Atas
      const isDanger = type === "danger" || type === "warning";

      const confirmBtnClass = isDanger
        ? "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/20 ring-rose-500/30"
        : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 ring-indigo-500/30";

      // Mengubah ikon bawaan menjadi animasi bawaan SweetAlert yang minimalis
      const alertIcon = type === "danger" ? "warning" : type;

      Swal.fire({
        title: title,
        text: text,
        icon: alertIcon,
        showCancelButton: true,
        reverseButtons: true,

        // Efek backdrop blur estetik (Glassmorphism)
        backdrop: `rgba(15, 23, 42, 0.4) `,

        // Animasi pop-up masuk & keluar yang smooth
        showClass: {
          popup: "animate__animated animate__fadeInUp animate__faster",
        },
        hideClass: {
          popup: "animate__animated animate__fadeOutDown animate__faster",
        },

        // Custom Class Tailwind CSS
        customClass: {
          popup:
            "rounded-2xl border border-slate-200/80 bg-white/95 p-7 shadow-2xl max-w-sm font-sans backdrop-blur-md",
          title: "text-xl font-bold text-slate-900 tracking-tight mt-4",
          htmlContainer: "text-sm text-slate-500/90 mt-2 leading-relaxed px-1",
          actions: "flex gap-3 mt-6 w-full justify-stretch", // Tombol memenuhi lebar bawah
          confirmButton: `flex-1 py-2.5 px-4 text-sm font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-4 cursor-pointer text-center active:scale-[0.98] ${confirmBtnClass}`,
          cancelButton:
            "flex-1 py-2.5 px-4 text-sm font-medium rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-slate-100 cursor-pointer text-center active:scale-[0.98]",
          icon: "border-none m-0 p-0 transform scale-90", // Menghilangkan border bulat default icon bawaan
        },
        buttonsStyling: false,
      }).then((result) => {
        if (result.isConfirmed) {
          if (formId) {
            document.getElementById(formId).submit();
          } else if (button.tagName === "A" || button.href) {
            window.location.href = button.getAttribute("href");
          }
        }
      });
    });
  });
});
