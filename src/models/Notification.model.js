import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", default: null },
  senderName: { type: String, default: "Sistem" },
  title: { type: String, required: true },
  text: { type: String, required: true },
  module: { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actionUrl: { type: String, default: "#" },
  type: { type: String, default: "INFO" },
  category: { type: String, default: "info" },
  isUnread: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isUnread: 1 });

export default mongoose.model("Notification", notificationSchema);
