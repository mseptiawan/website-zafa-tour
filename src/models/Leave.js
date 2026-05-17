import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "LeaveType",
      required: true,
    },
    startDate: Date,
    endDate: Date,

    totalDays: Number,

    reason: String,

    file: String,

    status: {
      type: String,
      enum: ["Pending Manager", "Pending HR", "Pending Pimpinan", "Approved", "Rejected"],
      default: "Pending Manager",
    },

    rejectedReason: String,

    approvedByManager: {
      type: Boolean,
      default: false,
    },

    approvedByHR: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Leave", leaveSchema);
