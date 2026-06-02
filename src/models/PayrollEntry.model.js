import mongoose from "mongoose";

const payrollEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    overtimeIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Overtime",
      },
    ],

    periodId: {
      type: String,
      required: true,
    },

    totalHours: {
      type: Number,
      required: true,
    },

    rateSnapshot: Number,
    multiplierSnapshot: Number,

    totalPay: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "LOCKED", "PAID"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export const PayrollEntry = mongoose.model("PayrollEntry", payrollEntrySchema);
