import mongoose from "mongoose";

const permitSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "SAKIT",
        "PENDAMPINGAN_MELAHIRKAN",
        "MUSIBAH",
        "PENTING",
        "KEPERLUAN_KELUARGA",
        "KEPERLUAN_MENDESAK",
        "LAINNYA",
      ],
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    document: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    approvalDate: {
      type: Date,
      default: null,
    },
    notesByApprover: {
      type: String,
      default: null,
      trim: true,
    },
  },
  { timestamps: true }
);

permitSchema.index({ employeeId: 1, createdAt: -1 });
permitSchema.index({ status: 1, createdAt: -1 });

const Permit = mongoose.model("Permit", permitSchema);
export default Permit;
