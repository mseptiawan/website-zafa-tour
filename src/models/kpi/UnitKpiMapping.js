import mongoose from "mongoose";

const unitKpiMappingSchema = new mongoose.Schema(
  {
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },

    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const UnitKpiMapping = mongoose.model("UnitKpiMapping", unitKpiMappingSchema);

export default UnitKpiMapping;
