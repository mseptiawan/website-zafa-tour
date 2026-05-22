import Notification from "./notification.model.js";

class NotificationService {
  async createNotification({ userId, type, title, text, module, referenceId }) {
    return await Notification.create({
      userId,
      type,
      title,
      text,
      module,
      referenceId,
    });
  }
  async getMyNotifications(userId) {
    return await Notification.find({ userId }).sort({ createdAt: -1 }).limit(10);
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany({ userId, isUnread: true }, { isUnread: false });
  }
}

export default new NotificationService();
