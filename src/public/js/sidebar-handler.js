document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. HANDLER UNTUK MOBILE SIDEBAR (TOGGLE)
  // ==========================================
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebarOverlay");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");

  const toggleSidebar = () => {
    if (sidebar && overlay) {
      sidebar.classList.toggle("-translate-x-full");
      overlay.classList.toggle("hidden");
    }
  };

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", toggleSidebar);
  }

  if (overlay) {
    overlay.addEventListener("click", toggleSidebar);
  }

  // ==========================================
  // 2. HANDLER UNTUK ACTIVE MENU & SCROLL
  // ==========================================
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
        link.classList.remove("text-slate-500", "text-slate-600");
        link.classList.add("text-blue-600", "font-semibold", "rounded-lg");

        const subSpan = link.querySelector("span");
        const subSvg = link.querySelector("svg");
        const subI = link.querySelector("i");

        if (subSpan) {
          subSpan.classList.remove("text-white", "font-normal");
          subSpan.classList.add("text-blue-600", "font-semibold");
        }
        if (subSvg) {
          subSvg.classList.remove("text-white");
          subSvg.classList.add("text-blue-600");
        }
        if (subI) {
          subI.classList.remove("text-white");
          subI.classList.add("text-blue-600");
        }

        parentDetails.open = true;
        localStorage.setItem("activeMenu", parentDetails.dataset.menu);
      } else {
        link.classList.remove("hover:bg-slate-50", "text-slate-700");
        link.classList.add("text-blue-600", "font-semibold", "rounded-sm");

        const spanText = link.querySelector("span");
        const svgIcon = link.querySelector("svg");
        const iIcon = link.querySelector("i");

        if (spanText) {
          spanText.classList.remove(
            "text-slate-600",
            "text-slate-700",
            "text-white",
            "font-normal"
          );
          spanText.classList.add("text-blue-600", "font-semibold");
        }
        if (svgIcon) {
          svgIcon.classList.remove("text-white");
          svgIcon.classList.add("text-blue-600");
        }
        if (iIcon) {
          iIcon.classList.remove("text-slate-400", "text-white");
          iIcon.classList.add("text-blue-600");
        }

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
          }
        });
        localStorage.setItem("activeMenu", menu.dataset.menu);
      }
    });
  });
});
