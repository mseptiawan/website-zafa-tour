import mongoose from "mongoose";

const resignationSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    submission_date: {
      type: Date,
      default: Date.now, 
    },
    effective_date: {
      type: Date,
      required: true, 
    },
    reason: {
      type: String,
      required: true,
    },
    attachment: {
      type: String,
      default: null, 
    },
    status: {
      type: String,
      enum: ["PENDING_WADIR", "PENDING_DIRUT", "APPROVED", "REJECTED_WADIR", "REJECTED_DIRUT"],
      default: "PENDING_WADIR",
    },
    approvals: {
      wadir: {
        approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approved_at: { type: Date },
        note: { type: String, default: "" },
      },
      dirut: {
        approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        approved_at: { type: Date },
        note: { type: String, default: "" },
      },
    },
  },
  { timestamps: true }
);

const Resignation = mongoose.model("Resignation", resignationSchema);
export default Resignation;