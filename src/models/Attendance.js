import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    checkIn: {
      type: Date,
      default: null,
    },
    checkOut: Date,

    workDuration: {
      type: Number,
      default: 0,
    },
    lateDuration: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["HADIR", "TELAT", "ALPHA", "CUTI", "SAKIT", "IZIN"],
      default: "ALPHA",
    },

    type: {
      type: String,
      enum: ["KANTOR", "LUAR KANTOR"],
      default: "KANTOR",
    },

    checkInPhoto: {
      type: String,
      default: null,
    },

    checkOutPhoto: {
      type: String,
      default: null,
    },
    note: {
      type: String,
      default: "",
    },
    location: {
      lat: Number,
      lng: Number,
      accuracy: Number,
      address: String,
    },

    checkOutLocation: {
      lat: Number,
      lng: Number,
      address: String,
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, checkIn: -1 }, { name: "idx_userId_checkIn" });

attendanceSchema.index({ checkIn: -1, userId: 1 }, { name: "idx_checkIn_userId" });

attendanceSchema.index({ status: 1, checkIn: -1 }, { name: "idx_status_checkIn" });

export default mongoose.model("Attendance", attendanceSchema);
