import mongoose from "mongoose";

const kpiSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    periode: {
      type: String,
      required: true,
    },

    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
      required: true,
    },

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
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

kpiSchema.index({ employeeId: 1, periode: 1 }, { unique: true });

const Kpi = mongoose.model("Kpi", kpiSchema);

export default Kpi;
