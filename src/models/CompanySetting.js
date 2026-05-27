import mongoose from "mongoose";

const companySettingSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Zafa Tour" },
    lat: { type: Number, required: true, default: -2.930156 },
    lng: { type: Number, required: true, default: 104.763686 },
    radiusMeter: { type: Number, default: 500 },
    entryTimeLimit: { type: String, default: "07:30" },
  },
  { timestamps: true }
);

export default mongoose.model("CompanySetting", companySettingSchema);
