import mongoose from "mongoose";

const overtimeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employeeName: String,

    date: {
      type: Date,
      required: true,
    },

    startTime: String,
    endTime: String,

    totalHours: {
      type: Number,
      required: true,
    },

    workDescription: {
      type: String,
      required: true,
    },

    result: String,

    proofFile: String,

    location: {
      type: {
        type: String,
        enum: ["OFFICE", "REMOTE", "CLIENT_SITE", "OTHER"],
        default: "OFFICE",
      },
      detail: String,
    },

    status: {
      type: String,
      enum: ["SUBMITTED", "APPROVED", "REJECTED"],
      default: "SUBMITTED",
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvalHistory: [
      {
        action: {
          type: String,
          enum: ["SUBMITTED", "APPROVED", "REJECTED"],
        },
        by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        role: String,
        note: String,
        at: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);
export const Overtime = mongoose.model("Overtime", overtimeSchema);
