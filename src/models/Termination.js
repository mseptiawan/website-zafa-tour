import mongoose from "mongoose";

const terminationSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    documentPath: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["Waiting", "Approved", "Rejected"],
      default: "Waiting",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Termination = mongoose.model("Termination", terminationSchema);
export default Termination;
