document.addEventListener("DOMContentLoaded", () => {
  const currentPath = window.location.pathname;
  const sidebarNav = document.getElementById("sidebarNav");

  if (!sidebarNav) return;

  const links = sidebarNav.querySelectorAll("a");
  const detailsMenus = sidebarNav.querySelectorAll("details[data-menu]");

  const savedScroll = localStorage.getItem("sidebarScroll");
  if (savedScroll) {
    sidebarNav.scrollTop = savedScroll;
  }

  sidebarNav.addEventListener("scroll", () => {
    localStorage.setItem("sidebarScroll", sidebarNav.scrollTop);
  });

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (currentPath === href) {
      const parentDetails = link.closest("details");

      if (parentDetails) {
        link.classList.remove("text-slate-500");
        link.classList.add("text-indigo-500", "font-semibold", "bg-indigo-50", "rounded-lg");
        parentDetails.open = true;
        localStorage.setItem("activeMenu", parentDetails.dataset.menu);
      } else {
        link.classList.remove("hover:bg-slate-50");
        link.classList.add("bg-indigo-50", "border-indigo-100");
        const spanText = link.querySelector("span");
        const svgIcon = link.querySelector("svg");
        if (spanText) spanText.classList.add("text-indigo-600", "font-semibold");
        if (svgIcon) svgIcon.classList.add("text-indigo-500");

        localStorage.removeItem("activeMenu");
      }
    }
  });

  const activeMenu = localStorage.getItem("activeMenu");
  if (activeMenu) {
    const activeDetails = sidebarNav.querySelector(`details[data-menu="${activeMenu}"]`);
    if (activeDetails) {
      activeDetails.open = true;
    }
  }

  detailsMenus.forEach((menu) => {
    menu.addEventListener("toggle", () => {
      if (menu.open) {
        detailsMenus.forEach((otherMenu) => {
          if (otherMenu !== menu) {
            otherMenu.open = false;
            Bener;
          }
        });
        localStorage.setItem("activeMenu", menu.dataset.menu);
      }
    });
  });
});
