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
      enum: [3, 6],
      required: true,
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

export default mongoose.model("Loan", loanSchema);
