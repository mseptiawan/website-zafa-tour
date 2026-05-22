import mongoose from "mongoose";

const kpiTemplateDetailSchema = new mongoose.Schema(
  {
    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
      required: true,
    },

    areaKinerja: {
      type: String,
      required: true,
      trim: true,
    },

    indikator: {
      type: String,
      required: true,
      trim: true,
    },

    bobot: {
      type: Number,
      required: true,
    },

    target: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

const KpiTemplateDetail = mongoose.model(
  "KpiTemplateDetail",
  kpiTemplateDetailSchema,
);

export default KpiTemplateDetail;
