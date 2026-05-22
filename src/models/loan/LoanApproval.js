import mongoose from "mongoose";

const loanApprovalSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    step: {
      type: String,
      enum: ["HR", "PIMPINAN", "KEUANGAN"],
      required: true,
    },
    approverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    note: { type: String },
    actionDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("LoanApproval", loanApprovalSchema);
