import mongoose from "mongoose";
import Notification from "../models/Notification.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { getIO } from "../utils/socket.js";

class NotificationService {
  _emitRealtime(userId, payload) {
    try {
      const io = getIO();
      io.to(userId.toString()).emit("new-notification", payload);
    } catch (err) {
      console.error("Socket error:", err.message);
    }
  }

  /**
   * Membuat satu notifikasi tunggal.
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createNotification(params) {
    const {
      userId,
      senderId,
      senderName,
      title,
      text,
      module,
      referenceId,
      actionUrl,
      type,
      category,
    } = params;

    const notif = await Notification.create({
      userId: new mongoose.Types.ObjectId(userId),
      senderId: senderId ? new mongoose.Types.ObjectId(senderId) : null,
      senderName,
      title,
      text,
      module,
      referenceId: new mongoose.Types.ObjectId(referenceId),
      actionUrl,
      type,
      category,
    });

    this._emitRealtime(userId, notif);
    return notif;
  }

  /**
   * Membuat banyak notifikasi sekaligus menggunakan insertMany.
   * @param {Object} params
   * @returns {Promise<Array<Object>>}
   */
  async createManyNotifications({
    userIds,
    senderId,
    senderName,
    title,
    text,
    module,
    referenceId,
    actionUrl,
    type,
    category,
  }) {
    if (!Array.isArray(userIds) || userIds.length === 0) return [];

    const documents = userIds.map((userId) => ({
      userId: new mongoose.Types.ObjectId(userId),
      senderId: senderId ? new mongoose.Types.ObjectId(senderId) : null,
      senderName,
      title,
      text,
      module,
      referenceId: new mongoose.Types.ObjectId(referenceId),
      actionUrl,
      type,
      category,
    }));

    const records = await Notification.insertMany(documents);

    records.forEach((record) => this._emitRealtime(record.userId, record));

    return records;
  }

  /**
   * Mengambil data notifikasi ter-pagination milik user.
   * @param {Object} params
   * @returns {Promise<{data: Array<Object>, meta: Object}>}
   */
  async getMyNotifications({ userId, page, limit }) {
    if (!userId) return { data: [], meta: null };

    const paginationArgs = getPagination({ page, limit });
    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const total = await Notification.countDocuments(filter);

    const data = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(paginationArgs.skip)
      .limit(paginationArgs.limit)
      .lean();

    return {
      data,
      meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
    };
  }

  async markAsRead(notifId, userId) {
    return await Notification.updateOne(
      { _id: new mongoose.Types.ObjectId(notifId), userId: new mongoose.Types.ObjectId(userId) },
      { isUnread: false }
    );
  }

  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isUnread: true },
      { isUnread: false }
    );
  }
}

const notificationService = new NotificationService();

export default notificationService;
