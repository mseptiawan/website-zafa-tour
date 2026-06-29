import mongoose from "mongoose";

const expenseLogSchema = new mongoose.Schema(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["MANAGER", "FINANCE"],
    },
    action: {
      type: String,
      required: true,
      enum: ["APPROVED", "REJECTED"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ExpenseLog = mongoose.model("ExpenseLog", expenseLogSchema);

export default ExpenseLog;
