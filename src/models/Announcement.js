import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    content: String,

    category: {
      type: String,
      enum: ["LIGHT", "OFFICIAL"],
      default: "LIGHT",
    },

    status: {
      type: String,
      enum: ["DRAFT", "REVIEW", "SIGNED", "PUBLISHED"],
      default: "PUBLISHED",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    attachment: String,

    signedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    publishDate: Date,

    isPinned: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
