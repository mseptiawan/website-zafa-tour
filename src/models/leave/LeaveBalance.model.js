import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    year: {
      type: Number,
      required: true,
      default: () => new Date().getFullYear(),
    },
    totalQuota: {
      type: Number,
      required: true,
      default: 12, // Kuota awal dasar (Sudah termasuk potongan cuti bersama massal)
    },
    used: {
      type: Number,
      required: true,
      default: 0, // Total hari cuti mandiri yang sudah disetujui (Approved)
    },
    remaining: {
      type: Number,
      required: true,
      default: 12, // Sisa kuota bersih yang bisa digunakan (totalquota - used)
    },
  },
  {
    timestamps: true,
  }
);

// Mengunci agar 1 User hanya memiliki 1 baris record kuota per tahunnya
leaveBalanceSchema.index({ userid: 1, year: 1 }, { unique: true });

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
