import mongoose from "mongoose";

const employeeSalarySchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    basicSalary: {
      type: Number,
      required: true,
      min: 0,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeSalary", employeeSalarySchema);
