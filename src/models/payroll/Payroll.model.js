import mongoose from "mongoose";

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    periodMonth: {
      type: String,
      required: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    allowances: [
      {
        componentName: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    deductions: [
      {
        componentName: { type: String, required: true },
        amount: { type: Number, required: true },
      },
    ],
    loanDeduction: {
      loanPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "LoanPayment",
        default: null,
      },
      amount: {
        type: Number,
        default: 0,
      },
    },
    totalEarnings: {
      type: Number,
      required: true,
    },
    totalDeductions: {
      type: Number,
      required: true,
    },
    netTakeHomePay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "CLOSED", "PAID"],
      default: "DRAFT",
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

payrollSchema.index({ employeeId: 1, periodMonth: 1 }, { unique: true });

export default mongoose.model("Payroll", payrollSchema);
