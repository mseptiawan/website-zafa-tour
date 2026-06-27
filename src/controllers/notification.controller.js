import { asyncHandler } from "../utils/asyncHandler.js";
import notificationService from "../services/notification.service.js";

export const getNotifications = asyncHandler(async (req, res) => {
  if (!req.session?.user) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }

  const userId = req.session.user._id;
  const { page, limit } = req.query;

  const { data: notifications, meta } = await notificationService.getMyNotifications({
    userId,
    page,
    limit: limit || 10,
  });

  const unreadCount = notifications.filter((n) => n.isUnread).length;

  return res.json({ success: true, notifications, unreadCount, meta });
});

export const markSingleRead = asyncHandler(async (req, res) => {
  const userId = req.session.user._id;
  const { id } = req.params;

  await notificationService.markAsRead(id, userId);
  return res.json({ success: true, message: "Notifikasi berhasil ditandai dibaca" });
});

export const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.session.user._id;
  await notificationService.markAllAsRead(userId);

  return res.json({ success: true, message: "Semua notifikasi ditandai telah dibaca" });
});
