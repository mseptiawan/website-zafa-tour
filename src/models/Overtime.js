import mongoose from "mongoose";

const overtimeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employeeName: {
      type: String,
    },

    date: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    totalHours: {
      type: Number,
      required: true,
    },

    workDescription: {
      type: String,
      required: true,
    },

    result: {
      type: String,
    },

    proofFile: {
      type: String,
      default: null,
    },

    approvedByManager: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Pending Manager", "Approved", "Rejected"],
      default: "Pending Manager",
    },
  },
  {
    timestamps: true,
  }
);

const Overtime = mongoose.model("Overtime", overtimeSchema);

export default Overtime;
