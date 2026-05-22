import mongoose from "mongoose";

const kpiSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    // Format: "YYYY-MM" (contoh: "2026-05")
    periode: {
      type: String,
      required: true,
    },

    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
      required: true,
    },

    // Menyimpan snapshot penilaian per indikator saat itu
    results: [
      {
        kpiTemplateDetailId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "KpiTemplateDetail",
          required: true,
        },
        areaKinerja: { type: String, required: true },
        indikator: { type: String, required: true },
        bobot: { type: Number, required: true },
        target: { type: String, required: true },
        realisasi: { type: String }, // Bisa diisi teks atau catatan
        score: { type: Number, required: true }, // Nilai 0-100 dari input HR
        finalScore: { type: Number, required: true }, // Skor akhir setelah dikali bobot
      },
    ],

    // Skor total akumulasi (skala 0-100)
    totalKpiScore: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["Draft", "Approved"],
      default: "Approved",
    },

    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // ID Admin/HR yang melakukan penilaian
    },
  },
  {
    timestamps: true,
  }
);

// Indeks unik: Mencegah duplikasi penilaian untuk karyawan yang sama di periode yang sama
kpiSchema.index({ employeeId: 1, periode: 1 }, { unique: true });

const Kpi = mongoose.model("Kpi", kpiSchema);

export default Kpi;
