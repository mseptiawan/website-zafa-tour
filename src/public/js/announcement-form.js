function handleFileSelect(input) {
  if (input.files && input.files.length > 0) {
    const file = input.files[0];
    document.getElementById("name-preview").textContent = file.name;
    document.getElementById("size-preview").textContent = (file.size / 1024).toFixed(1) + " KB";
    document.getElementById("dropzone-empty").classList.add("hidden");
    document.getElementById("dropzone-filled").classList.remove("hidden");
    document.getElementById("view-file-btn").href = URL.createObjectURL(file);
  }
}

function toggleCategoryDropdown() {
  const menu = document.getElementById("category-menu");
  const arrow = document.getElementById("category-arrow");
  if (menu && arrow) {
    menu.classList.toggle("hidden");
    arrow.classList.toggle("rotate-180");
  }
}

function selectCategory(value, label) {
  const valueInput = document.getElementById("category-value");
  const labelSpan = document.getElementById("category-label");
  if (valueInput && labelSpan) {
    valueInput.value = value;
    labelSpan.innerHTML = label;
    toggleCategoryDropdown();
  }
}

// Event Listener untuk menutup dropdown saat klik di luar area
document.addEventListener("click", function (e) {
  const dropdown = document.getElementById("category-dropdown");
  const menu = document.getElementById("category-menu");
  const arrow = document.getElementById("category-arrow");
  if (dropdown && menu && arrow && !dropdown.contains(e.target)) {
    menu.classList.add("hidden");
    arrow.classList.remove("rotate-180");
  }
});
