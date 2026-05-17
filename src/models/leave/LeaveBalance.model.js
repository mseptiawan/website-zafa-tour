import mongoose from "mongoose";

const leaveBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    year: {
      type: Number,
      required: true,
    },

    totalQuota: {
      type: Number,
      default: 12,
    },

    used: {
      type: Number,
      default: 0,
    },

    remaining: {
      type: Number,
      default: 12,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveBalance", leaveBalanceSchema);
