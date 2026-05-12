import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkIn: Date,
    checkOut: Date,
    workDuration: Number,
    status: {
      type: String,
      enum: ["HADIR", "TELAT", "ALPHA"],
      default: "ALPHA",
    },

    type: {
      type: String,
      enum: ["KANTOR", "LUAR KANTOR"],
      default: "KANTOR",
    },

    photo: String,

    note: String,

    location: {
      lat: Number,
      lng: Number,
      accuracy: Number, // meter
      address: String,
    },
    deviceInfo: {
      userAgent: String,
      platform: String,
      deviceId: String,
    },
    overtime: {
      isOvertime: Boolean,
      duration: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Attendance", attendanceSchema);
