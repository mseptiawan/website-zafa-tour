import mongoose from "mongoose";

const salaryComponentSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
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

    sourceType: {
      type: String,
      enum: ["STATIC", "DYNAMIC"],
      default: "STATIC",
    },

    category: {
      type: String,
      enum: ["EARNING", "DEDUCTION"],
      required: true,
    },
    calculationType: {
      type: String,
      enum: ["FIXED_AMOUNT", "PERCENTAGE"],
      required: true,
      default: "FIXED_AMOUNT",
    },
    defaultAmount: {
      type: Number,
      default: 0,
    },
    basedOnComponent: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    description: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryComponent", salaryComponentSchema);
