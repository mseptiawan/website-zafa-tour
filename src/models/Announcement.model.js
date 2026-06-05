import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
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

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED"],
      default: "PUBLISHED",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    attachment: {
      type: String,
      default: null,
    },

    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    publishDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// ─── INDEX ────────────────────────────────────────────────────────────────────
// Optimasi query getAll (sort by createdAt, filter by status/category)
announcementSchema.index({ createdAt: -1 });
announcementSchema.index({ status: 1, createdAt: -1 });
announcementSchema.index({ category: 1, status: 1 });

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
