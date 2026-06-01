import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    amountRequested: {
      type: Number,
      required: true,
    },
    tenorMonths: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    monthlyDeduction: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"],
      default: "PENDING",
    },
    paymentProof: {
      type: String,
      default: null,
    },
    disbursementDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Index
loanSchema.index({ employeeId: 1 });
loanSchema.index({ status: 1 });
loanSchema.index({ employeeId: 1, status: 1 });
loanSchema.index({ createdAt: -1 });

export default mongoose.model("Loan", loanSchema);
