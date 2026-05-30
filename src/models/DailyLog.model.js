import mongoose from "mongoose";

const DailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tanggal: {
      type: String,
      required: true,
    },
    kategori: {
      type: String,
      enum: ["Tugas Utama", "Rapat", "Dukungan", "Administrasi", "Riset & Teknis", "Lain-lain"],
      required: true,
    },
    judul: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Canceled"],
      default: "Pending",
    },
    penjelasanHasil: {
      type: String,
      default: "",
    },
    fileLampiran: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

DailyLogSchema.index({ userId: 1, tanggal: 1 });

export default mongoose.model("DailyLog", DailyLogSchema);
