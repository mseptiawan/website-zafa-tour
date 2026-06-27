import mongoose from "mongoose";

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    type: {
      type: String,
      enum: ["UNDANGAN", "INTERNAL", "TRAINING", "LAINNYA"],
      default: "INTERNAL",
    },

    location: {
      type: String,
      default: "",
    },

    startDate: Date,
    endDate: Date,

    attachment: {
      type: String,
      default: null,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

assignmentSchema.index({ createdAt: -1 });
assignmentSchema.index({ employees: 1 });
assignmentSchema.index({ createdBy: 1, createdAt: -1 });

const Assignment = mongoose.model("Assignment", assignmentSchema);

export default Assignment;
