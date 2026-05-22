import notificationService from "../services/notification.service.js";
export const getNotifications = async (req, res, next) => {
  try {
    console.log("\n====== 🛰️  [DEBUG START: GET NOTIFICATIONS] ======");

    if (!req.session || !req.session.user) {
      console.log("❌ DEBUG: Session tidak ditemukan atau user belum login!");
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    console.log("👤 DEBUG: Data Session User Terdeteksi:", {
      username: req.session.user.username,
      role: req.session.user.role,
      employeeId: req.session.user.employeeId,
    });

    const employeeId = req.session.user.employeeId;

    if (!employeeId) {
      console.log("⚠️ DEBUG: User yang login TIDAK MEMILIKI employeeId di session-nya!");
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    console.log("🔄 DEBUG: Memanggil service untuk Employee ID:", employeeId);
    const notifications = await notificationService.getMyNotifications(employeeId);

    console.log(`📦 DEBUG: Hasil dari DB ditemukan ${notifications.length} data untuk ID ini.`);

    const unreadCount = notifications.filter((n) => n.isUnread).length;

    console.log("====== 🛰️  [DEBUG END: SUCCESS] ======\n");
    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("💥 DEBUG CONTROLLER CRASH:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};
export const markAllRead = async (req, res) => {
  try {
    const userId = req.session.user._id;
    await notificationService.markAllAsRead(userId);

    return res.json({ success: true, message: "Semua notifikasi ditandai telah dibaca" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
