document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("avatar-input");

  if (fileInput) {
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files[0];
      // Ambil employeeId dari data-attribute HTML
      const employeeId = fileInput.dataset.employeeId;

      if (!file || !employeeId) return;

      // Validasi Ukuran File (Max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        Swal.fire({ icon: "error", title: "Gagal", text: "Ukuran file maksimal adalah 2MB!" });
        fileInput.value = "";
        return;
      }

      const formData = new FormData();
      formData.append("foto_profile", file);

      // Loading State
      Swal.fire({
        title: "Mengupload...",
        text: "Mohon tunggu sebentar.",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      try {
        const response = await fetch(`/employee/upload-avatar/${employeeId}`, {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (response.ok && result.success) {
          Swal.fire({
            icon: "success",
            title: "Berhasil",
            text: "Foto profil berhasil diperbarui!",
            timer: 1500,
            showConfirmButton: false,
          });

          // Update Preview secara Realtime
          const previewImg = document.getElementById("avatar-preview");
          const avatarIcon = document.getElementById("avatar-icon");

          if (previewImg) {
            previewImg.src = result.imageUrl;
          } else if (avatarIcon) {
            // Jika sebelumnya pakai icon default, ganti jadi tag img
            const container = avatarIcon.parentElement;
            avatarIcon.remove();

            const newImg = document.createElement("img");
            newImg.id = "avatar-preview";
            newImg.src = result.imageUrl;
            newImg.alt = "Foto Profil";
            newImg.className = "w-full h-full object-cover";

            container.prepend(newImg);
          }
        } else {
          Swal.fire({
            icon: "error",
            title: "Gagal",
            text: result.message || "Gagal mengupload gambar.",
          });
          fileInput.value = "";
        }
      } catch (error) {
        console.error("Upload Error:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Terjadi kesalahan sistem pada koneksi.",
        });
        fileInput.value = "";
      }
    });
  }
});
