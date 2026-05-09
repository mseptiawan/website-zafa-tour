import mongoose from "mongoose";

const kpiResultSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PerformanceReview",
      required: true,
    },

    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
      required: true,
    },

    target: String,

    realisasi: String,

    score: {
      type: Number,
      default: 0,
    },

    finalScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const KpiResult = mongoose.model("KpiResult", kpiResultSchema);

export default KpiResult;
