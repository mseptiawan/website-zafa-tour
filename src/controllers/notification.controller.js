import notificationService from "../services/notification.service.js";
export const getNotifications = async (req, res, next) => {
  try {
    console.log("\n====== 🛰️  [DEBUG START: GET NOTIFICATIONS] ======");

    if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }

    const employeeId = req.session.user.employeeId;

    if (!employeeId) {
      return res.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const notifications = await notificationService.getMyNotifications(employeeId);

    const unreadCount = notifications.filter((n) => n.isUnread).length;

    return res.json({ success: true, notifications, unreadCount });
  } catch (error) {
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
