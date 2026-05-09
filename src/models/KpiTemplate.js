import mongoose from "mongoose";

const kpiTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    description: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const KpiTemplate = mongoose.model("KpiTemplate", kpiTemplateSchema);

export default KpiTemplate;
