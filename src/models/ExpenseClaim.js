import mongoose from "mongoose";

const expenseClaimSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      enum: ["TRANSPORT", "MEAL", "HOTEL", "PARKING", "OPERASIONAL", "LAINNYA"],
      default: "LAINNYA",
    },

    amount: {
      type: Number,
      required: true,
    },

    expenseDate: {
      type: Date,
      required: true,
    },

    proofFile: String,

    noReceiptReason: String,

    selfDeclaration: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["PENDING_MANAGER", "PENDING_FINANCE", "PAID", "REJECTED"],
      default: "PENDING_FINANCE",
    },

    managerApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    financeApprovedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    paidAt: Date,
  },
  {
    timestamps: true,
  }
);

const ExpenseClaim = mongoose.model("ExpenseClaim", expenseClaimSchema);

export default ExpenseClaim;
