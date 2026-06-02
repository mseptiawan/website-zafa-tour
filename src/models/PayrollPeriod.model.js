import mongoose from "mongoose";

const payrollPeriodSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // 2026-06
    label: { type: String, required: true },

    start: { type: Date, required: true },
    end: { type: Date, required: true },

    status: {
      type: String,
      enum: ["OPEN", "CLOSED"],
      default: "OPEN",
    },
  },
  { timestamps: true }
);

export const PayrollPeriod = mongoose.model("PayrollPeriod", payrollPeriodSchema);
