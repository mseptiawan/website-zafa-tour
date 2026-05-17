import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    code: {
      type: String,
      unique: true,
    },

    maxDays: {
      type: Number,
      default: 0,
    },

    minAdvanceDays: {
      type: Number,
      default: 7,
    },

    requiresAttachment: {
      type: Boolean,
      default: false,
    },

    isDeductBalance: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    description: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveType", leaveTypeSchema);
