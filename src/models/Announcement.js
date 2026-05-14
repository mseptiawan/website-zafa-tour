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
  },
  { timestamps: true }
);

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
