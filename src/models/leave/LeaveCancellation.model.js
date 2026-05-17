import mongoose from "mongoose";

const leaveCancellationSchema = new mongoose.Schema(
  {
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      required: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    cancelReason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    processAt: {
      type: Date,
    },

    note: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveCancellation", leaveCancellationSchema);
