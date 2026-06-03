import mongoose from "mongoose";

const leaveApprovalSchema = new mongoose.Schema(
  {
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Leave",
      required: true,
    },

    step: {
      type: String,
      enum: [
        "HANDOVER",
        "MANAGER_ADMINISTRASI",
        "MANAGER_KEUANGAN",
        "MANAGER_HAJI_UMRAH",
        "WAKIL_DIREKTUR",
        "DIREKTUR_UTAMA",
      ],
      required: true,
    },

    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    note: {
      type: String,
    },

    actionDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("LeaveApproval", leaveApprovalSchema);
