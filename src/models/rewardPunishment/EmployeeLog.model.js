import mongoose from "mongoose";

const employeeLogSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    typeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RewardPunishmentType",
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    skNumber: {
      type: String,
      default: "",
    },
    dateIssued: {
      type: Date,
      required: true,
    },
    effectiveDate: {
      type: Date,
      default: null,
    },
    attachment: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

employeeLogSchema.index({ employeeId: 1 });
employeeLogSchema.index({ createdAt: -1 });

const EmployeeLog = mongoose.model("EmployeeLog", employeeLogSchema);
export default EmployeeLog;
