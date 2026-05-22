import mongoose from "mongoose";

const employeeAllowanceSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    componentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SalaryComponent",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

employeeAllowanceSchema.index({ employeeId: 1, componentId: 1 }, { unique: true });

export default mongoose.model("EmployeeAllowance", employeeAllowanceSchema);
