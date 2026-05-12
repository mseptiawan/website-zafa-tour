import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    maxDays: {
      type: Number,
    },

    requiresAttachment: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    description: String,
  },
  { timestamps: true }
);

export default mongoose.model("LeaveType", leaveTypeSchema);
