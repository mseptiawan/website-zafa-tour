import mongoose from "mongoose";

const salaryComponentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["FIXED", "FLEXIBLE"],
      required: true,
    },
    category: {
      type: String,
      enum: ["EARNING", "DEDUCTION"],
      required: true,
    },
    defaultAmount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryComponent", salaryComponentSchema);
