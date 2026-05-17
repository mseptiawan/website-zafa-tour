const mongoose = require("mongoose");

const DailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tanggal: {
      type: String, // Format 'YYYY-MM-DD' agar mudah di-query tanpa pusing timezone
      required: true,
    },
    kategori: {
      type: String,
      enum: ["Core Task", "Meeting", "Support"],
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
      type: String, // Menyimpan nama file atau URL path dari storage
      default: "",
    },
  },
  { timestamps: true }
);

// Indexing agar pencarian berdasarkan user dan tanggal berjalan secepat kilat
DailyLogSchema.index({ userId: 1, tanggal: 1 });

module.exports = mongoose.model("DailyLog", DailyLogSchema);
