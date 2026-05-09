import mongoose from "mongoose";

const kpiSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
    },

    periode: {
      type: String, // contoh: "2026-05"
    },

    items: [
      {
        indikator: String,
        bobot: Number,
        nilai: Number,
        skor: Number,
      },
    ],

    totalScore: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const Kpi = mongoose.model("Kpi", kpiSchema);

export default Kpi;