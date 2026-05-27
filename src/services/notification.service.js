import mongoose from "mongoose";
import Notification from "../models/notification.model.js";

class NotificationService {
  async createNotification({ userId, type, title, text, module, referenceId }) {
    return await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      type,
      title,
      text,
      module,
      referenceId: new mongoose.Types.ObjectId(referenceId),
    });
  }

  async getMyNotifications(userId) {
    try {
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return [];
      }

      const queryId = new mongoose.Types.ObjectId(userId);
      const data = await Notification.find({ userId: queryId }).sort({ createdAt: -1 }).limit(10);

      return data;
    } catch (error) {
      return [];
    }
  }

  async markAllAsRead(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return null;

    return await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isUnread: true },
      { isUnread: false }
    );
  }
}
const notificationService = new NotificationService();
export default notificationService;
