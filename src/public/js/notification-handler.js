document.addEventListener("DOMContentLoaded", () => {
  // Ambil elemen untuk Desktop
  const notifButton = document.getElementById("notifButton");
  const notifMenu = document.getElementById("notifMenu");
  const notifContainer = document.getElementById("notifContainer");
  const notifBadge = document.getElementById("notifBadge");
  const notifCountText = document.getElementById("notifCountText");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  // Ambil elemen untuk Mobile
  const notifButtonMobile = document.getElementById("notifButtonMobile");
  const notifMenuMobile = document.getElementById("notifMenuMobile");
  const notifContainerMobile = document.getElementById("notifContainerMobile");
  const notifBadgeMobile = document.getElementById("notifBadgeMobile");
  const notifCountTextMobile = document.getElementById("notifCountTextMobile");
  const markAllReadBtnMobile = document.getElementById("markAllReadBtnMobile");

  // Pastikan salah satu tombol ada sebelum jalan terus
  if (!notifButton && !notifButtonMobile) return;

  fetchNotifications();

  const currentUserId = "<%= typeof user !== 'undefined' && user ? user._id : '' %>";

  if (currentUserId && typeof io !== "undefined") {
    const socket = io();
    socket.emit("join-room", currentUserId);
    socket.on("new-notification", (notif) => {
      fetchNotifications();
    });
  }

  // Event Click - Desktop Toggle
  if (notifButton && notifMenu) {
    notifButton.addEventListener("click", (e) => {
      e.stopPropagation();
      notifMenu.classList.toggle("hidden");
      if (!notifMenu.classList.contains("hidden")) {
        if (notifMenuMobile) notifMenuMobile.classList.add("hidden"); // tutup mobile jika desktop buka
        fetchNotifications();
      }
    });
  }

  // Event Click - Mobile Toggle
  if (notifButtonMobile && notifMenuMobile) {
    notifButtonMobile.addEventListener("click", (e) => {
      e.stopPropagation();
      notifMenuMobile.classList.toggle("hidden");
      if (!notifMenuMobile.classList.contains("hidden")) {
        if (notifMenu) notifMenu.classList.add("hidden"); // tutup desktop jika mobile buka
        fetchNotifications();
      }
    });
  }

  // Tutup dropdown jika klik di luar area menu
  window.addEventListener("click", (e) => {
    const dropdown = document.getElementById("notificationDropdown");
    const dropdownMobile = document.getElementById("notificationDropdownMobile");

    if (notifMenu && dropdown && !dropdown.contains(e.target)) {
      notifMenu.classList.add("hidden");
    }
    if (notifMenuMobile && dropdownMobile && !dropdownMobile.contains(e.target)) {
      notifMenuMobile.classList.add("hidden");
    }
  });

  async function fetchNotifications() {
    try {
      const response = await fetch("/notifications");
      const resData = await response.json();
      if (resData.success) {
        renderNotifications(resData.notifications, resData.unreadCount);
      }
    } catch (error) {
      const fallbackError = `<div class="p-4 text-center text-xs text-red-500">Gagal memuat notifikasi.</div>`;
      if (notifContainer) notifContainer.innerHTML = fallbackError;
      if (notifContainerMobile) notifContainerMobile.innerHTML = fallbackError;
    }
  }

  function renderNotifications(notifications, unreadCount) {
    // Update Badge & Counter Text untuk Desktop & Mobile
    const updateBadgeState = (badge, countText) => {
      if (!badge || !countText) return;
      if (unreadCount > 0) {
        badge.classList.remove("hidden");
        countText.classList.remove("hidden");
        countText.innerText = unreadCount;
      } else {
        badge.classList.add("hidden");
        countText.classList.add("hidden");
      }
    };

    updateBadgeState(notifBadge, notifCountText);
    updateBadgeState(notifBadgeMobile, notifCountTextMobile);

    const emptyState = `<div class="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi baru.</div>`;

    if (!notifications || notifications.length === 0) {
      if (notifContainer) notifContainer.innerHTML = emptyState;
      if (notifContainerMobile) notifContainerMobile.innerHTML = emptyState;
      return;
    }

    const moduleStyles = {
      ASSIGNMENT: {
        bg: "bg-indigo-50 text-indigo-600 border border-indigo-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path></svg>`,
      },
      LEAVE: {
        bg: "bg-emerald-50 text-emerald-600 border border-emerald-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 22h14"></path><path d="M5 2h14"></path><path d="M17 22V11c0-2.8-2.2-5-5-5s-5 2.2-5 5v11"></path></svg>`,
      },
      PERMIT: {
        bg: "bg-amber-50 text-amber-600 border border-amber-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><path d="M14 2v6h6"></path><path d="M16 13H8"></path><path d="M16 17H8"></path><path d="M10 9H8"></path></svg>`,
      },
      ANNOUNCEMENT: {
        bg: "bg-blue-50 text-blue-600 border border-blue-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
      },
      EXPENSE: {
        bg: "bg-rose-50 text-rose-600 border border-rose-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`,
      },
      TRIP: {
        bg: "bg-sky-50 text-sky-600 border border-sky-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
      },
      DEFAULT: {
        bg: "bg-slate-50 text-slate-600 border border-slate-100",
        icon: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 16a1 1 0 1 1 1-1 1 1 0 0 1-1 1zm1-5.16V14a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1 1.5 1.5 0 1 0-1.5-1.5 1 1 0 0 1-2 0A3.5 3.5 0 1 1 13 12.84z"></path></svg>`,
      },
    };

    let htmlContent = "";

    notifications.forEach((item) => {
      const rowBackground = item.isUnread
        ? "bg-slate-50/70 hover:bg-slate-100/80"
        : "bg-white hover:bg-slate-50";

      const targetUrl = item.actionUrl || "#";
      const currentStyle = moduleStyles[item.type] || moduleStyles.DEFAULT;

      htmlContent += `
        <a href="${targetUrl}" class="p-3.5 flex gap-3 items-start transition-colors block ${rowBackground}" data-id="${item._id}">
          <div class="shrink-0 mt-0.5">
            <div class="w-7 h-7 rounded-full ${currentStyle.bg} flex items-center justify-center">
              ${currentStyle.icon}
            </div>
          </div>
          <div class="min-w-0 flex-1 text-[11px]">
            <p class="text-slate-600 font-medium leading-normal">
              <span class="font-semibold text-slate-900">${item.title}</span>: ${item.text}
            </p>
            <div class="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
              <span>Baru saja</span>
              <span>•</span>
              <span class="text-slate-500 font-semibold capitalize">${item.module || "System"}</span>
            </div>
          </div>
        </a>
      `;
    });

    if (notifContainer) notifContainer.innerHTML = htmlContent;
    if (notifContainerMobile) notifContainerMobile.innerHTML = htmlContent;
  }

  // Event click handling saat notifikasi ditekan (berlaku untuk dua container)
  const handleNotifClick = async (e) => {
    const targetLink = e.target.closest("a[data-id]");
    if (!targetLink) return;

    const notifId = targetLink.getAttribute("data-id");
    try {
      await fetch(`/notifications/${notifId}/read`, { method: "PATCH" });
    } catch (error) {}
  };

  if (notifContainer) notifContainer.addEventListener("click", handleNotifClick);
  if (notifContainerMobile) notifContainerMobile.addEventListener("click", handleNotifClick);

  // Event handler tandai semua dibaca
  const markAllReadAction = async () => {
    try {
      await fetch("/notifications/mark-all-read", { method: "POST" });
      fetchNotifications();
    } catch (error) {}
  };

  if (markAllReadBtn) markAllReadBtn.addEventListener("click", markAllReadAction);
  if (markAllReadBtnMobile) markAllReadBtnMobile.addEventListener("click", markAllReadAction);
});
