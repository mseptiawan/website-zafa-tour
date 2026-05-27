document.addEventListener("DOMContentLoaded", () => {
  const notifButton = document.getElementById("notifButton");
  const notifMenu = document.getElementById("notifMenu");
  const notifContainer = document.getElementById("notifContainer");
  const notifBadge = document.getElementById("notifBadge");
  const notifCountText = document.getElementById("notifCountText");
  const markAllReadBtn = document.getElementById("markAllReadBtn");

  if (!notifButton) return;

  fetchNotifications();

  notifButton.addEventListener("click", (e) => {
    e.stopPropagation();
    notifMenu.classList.toggle("hidden");
    if (!notifMenu.classList.contains("hidden")) {
      fetchNotifications();
    }
  });

  window.addEventListener("click", (e) => {
    const dropdown = document.getElementById("notificationDropdown");
    if (dropdown && !dropdown.contains(e.target)) {
      notifMenu.classList.add("hidden");
    }
  });

  async function fetchNotifications() {
    try {
      const response = await fetch("/api/notifications");
      const resData = await response.json();
      if (resData.success) {
        renderNotifications(resData.notifications, resData.unreadCount);
      }
    } catch (error) {
      console.error("Gagal memuat data notifikasi:", error);
      notifContainer.innerHTML = `
        <div class="p-4 text-center text-xs text-red-500">Gagal memuat notifikasi.</div>
      `;
    }
  }

  function renderNotifications(notifications, unreadCount) {
    if (unreadCount > 0) {
      notifBadge.classList.remove("hidden");
      notifCountText.classList.remove("hidden");
      notifCountText.innerText = unreadCount;
    } else {
      notifBadge.classList.add("hidden");
      notifCountText.classList.add("hidden");
    }

    if (!notifications || notifications.length === 0) {
      notifContainer.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-400">Tidak ada notifikasi baru.</div>
      `;
      return;
    }

    let htmlContent = "";
    notifications.forEach((item) => {
      const rowBackground = item.isUnread
        ? "bg-slate-50/70 hover:bg-slate-100/80"
        : "bg-white hover:bg-slate-50";

      const targetUrl = item.module === "assignment" ? `/assignment/${item.referenceId}` : "#";
      const avatarStyle =
        item.type === "assignment"
          ? "bg-indigo-100 text-indigo-700"
          : "bg-slate-200 text-slate-600";
      const taskLabel = item.type === "assignment" ? "TASK" : "NOTE";

      htmlContent += `
        <a href="${targetUrl}" class="p-3.5 flex gap-3 items-start transition-colors block ${rowBackground}" data-id="${item._id}">
          <div class="shrink-0 mt-0.5">
            <div class="w-7 h-7 rounded-full ${avatarStyle} flex items-center justify-center text-[10px] font-bold tracking-wider">
              ${taskLabel}
            </div>
          </div>
          <div class="min-w-0 flex-1 text-[11px]">
            <p class="text-slate-600 font-medium leading-normal">
              <span class="font-semibold text-slate-900">${item.title}</span>: ${item.text}
            </p>
            <div class="flex items-center gap-1.5 mt-1 text-[10px] text-slate-400 font-medium">
              <span>Baru saja</span>
              <span>•</span>
              <span class="text-indigo-500 font-semibold capitalize">${item.module}</span>
            </div>
          </div>
        </a>
      `;
    });

    notifContainer.innerHTML = htmlContent;
  }

  markAllReadBtn.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      const resData = await response.json();
      if (resData.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Gagal memperbarui status baca:", error);
    }
  });
});
