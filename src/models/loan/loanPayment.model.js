import mongoose from "mongoose";

const loanPaymentSchema = new mongoose.Schema(
  {
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    periodMonth: {
      type: String,
      required: true,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

loanPaymentSchema.index({ loanId: 1 });
loanPaymentSchema.index({ employeeId: 1 });
loanPaymentSchema.index({ isPaid: 1 });

loanPaymentSchema.index({ loanId: 1, installmentNumber: 1 }, { unique: true });

loanPaymentSchema.index({
  employeeId: 1,
  periodMonth: 1,
});

export default mongoose.model("LoanPayment", loanPaymentSchema);
