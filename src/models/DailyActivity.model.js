import mongoose from "mongoose";

const dailyActivitySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    activityDate: {
      type: String,
      required: true,
    },

    kpiTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KpiTemplate",
      required: false,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "Canceled"],
      default: "Pending",
    },

    resultDescription: {
      type: String,
      default: "",
    },

    attachmentFile: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

dailyActivitySchema.index({ employeeId: 1, activityDate: -1 });

export default mongoose.model("DailyActivity", dailyActivitySchema);
