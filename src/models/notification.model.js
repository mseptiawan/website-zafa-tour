import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  text: { type: String, required: true },
  module: { type: String, required: true },
  referenceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  isUnread: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
