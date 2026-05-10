import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    description: String,

    type: {
      type: String,
      enum: ["UNDANGAN", "INTERNAL", "TRAINING", "LAINNYA"],
      default: "INTERNAL",
    },

    location: String,

    startDate: Date,
    endDate: Date,

    // ✅ FIXED (HANYA SATU)
    attachment: String, // file surat penugasan

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED"],
      default: "ACTIVE",
    },

    reportFile: String,
  },
  { timestamps: true },
);

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
