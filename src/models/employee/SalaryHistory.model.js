import mongoose from "mongoose";

const salaryHistorySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    previousSalary: {
      type: Number,
      required: true,
    },
    newSalary: {
      type: Number,
      required: true,
    },
    changeReason: {
      type: String,
      required: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("SalaryHistory", salaryHistorySchema);
