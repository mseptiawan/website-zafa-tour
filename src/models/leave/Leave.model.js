import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    leaveTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalDays: {
      type: Number,
      required: true, // Durasi bersih hasil hitung getDay() tanpa hari Minggu/libur
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    handoverUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // User ID rekan kerja yang menerima delegasi tugas
    },
    documentPath: {
      type: String, // Path url/file dokumen pendukung (jika ada)
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING", // Status akumulatif akhir dari keseluruhan pengajuan
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Leave", leaveSchema);
