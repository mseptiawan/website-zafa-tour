import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    // ─── CONTENT ─────────────────────────────
    title: {
      type: String,
      required: true,
      trim: true,
    },

    content: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["LIGHT", "OFFICIAL"],
      default: "LIGHT",
    },

    // ─── AUTHOR ──────────────────────────────
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    authorName: {
      type: String,
      required: true,
    },

    authorAvatar: {
      type: String,
      default: null,
    },

    // ─── ATTACHMENT ──────────────────────────
    attachment: {
      type: String,
      default: null,
    },

    // ─── PUBLISHING ──────────────────────────
    publishDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// ─── INDEX ──────────────────────────────────
announcementSchema.index({ createdAt: -1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
