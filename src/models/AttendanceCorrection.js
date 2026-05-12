import mongoose from "mongoose";

const attendanceCorrectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String, // format "HH:mm"
      required: true,
    },

    endTime: {
      type: String, // format "HH:mm"
      required: true,
    },

    reasonType: {
      type: String,
      enum: ["TIDAK_TERCATAT", "LUPA_ABSEN", "ABSEN_TIDAK_SEMPURNA", "LAINNYA"],
      required: true,
    },

    reason: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    adminNote: {
      type: String,
      default: "",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceCorrection", attendanceCorrectionSchema);
