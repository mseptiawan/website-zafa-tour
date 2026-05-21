import mongoose from "mongoose";

const holidaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
    },

    type: {
      type: String,
      enum: ["NATIONAL", "COMPANY", "RELIGIOUS"],
      required: true,
    },

    isDeductLeave: {
      type: Boolean,
      default: false,
    },

    description: {
      type: String,
    },

    year: {
      type: Number,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Holiday", holidaySchema);
