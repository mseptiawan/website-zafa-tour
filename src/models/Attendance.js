import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    checkIn: Date,
    checkOut: Date,

    status: {
      type: String,
      enum: ["HADIR", "TELAT", "ALPHA"],
      default: "ALPHA",
    },

    type: {
      type: String,
      enum: ["KANTOR", "DINAS_LUAR"],
      default: "KANTOR",
    },

    photo: String,

    note: String,

    // ✅ TAMBAHAN UNTUK DINAS LUAR
    location: {
      lat: Number,
      lng: Number,
      address: String, // optional kalau mau reverse geocoding
    },
  },
  { timestamps: true },
);

export default mongoose.model("Attendance", attendanceSchema);
