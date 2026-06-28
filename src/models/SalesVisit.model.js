import mongoose from "mongoose";

const salesVisitSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    address: String,

    meetWith: {
      type: String,
      required: true,
      maxlength: 100,
    },

    result: String,

    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
      },
    ],

    visitTime: Date,
  },
  { timestamps: true }
);

// ─── INDEXS────────────────────────────────────────

/**
 * 1. Compound Index untuk Fitur "Kunjungan Saya" & "Monitoring Tim"
 * Sangat krusial karena query Anda selalu memfilter employeeId dan mengurutkan berdasarkan waktu terbaru.
 * Nilai 1 (Ascending) untuk filter kesamaan, dan -1 (Descending) untuk arah sort.
 */
salesVisitSchema.index({ employeeId: 1, createdAt: -1 });

/**
 * 2. Single Field Index untuk visitTime (Opsional)
 * Berguna jika ke depannya Anda membuat fitur filter laporan berdasarkan rentang tanggal kunjungan (Date Range).
 */
salesVisitSchema.index({ visitTime: -1 });

export default mongoose.model("SalesVisit", salesVisitSchema);
