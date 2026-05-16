import mongoose from "mongoose";

const businessTripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // SNAPSHOT penting (hindari dependency populate untuk rule bisnis)
    requesterRole: {
      type: String,
      enum: ["KARYAWAN", "MANAGER", "HR", "KEUANGAN"],
      required: true,
    },

    title: String,
    purpose: {
      type: String,
      enum: ["SALES_VISIT", "MEETING", "TRAINING", "SURVEY", "OTHER"],
    },

    meetWith: { type: String, required: true, maxlength: 100 },

    startDate: Date,
    endDate: Date,
    destination: String,
    description: String,
    budget: { type: Number, default: 0 },

    timeline: [
      {
        address: String,
        order: Number,
      },
    ],

    status: {
      type: String,
      enum: ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    currentStep: {
      type: String,
      enum: ["MANAGER", "PIMPINAN"],
      default: "MANAGER",
    },

    approvals: [
      {
        step: { type: String, enum: ["MANAGER", "PIMPINAN"] },
        actor: { type: String, enum: ["MANAGER", "PIMPINAN", "HR"] },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        status: { type: String, enum: ["APPROVED", "REJECTED"] },
        date: Date,
        note: String,
      },
    ],

    delegation: {
      active: { type: Boolean, default: false },
      from: { type: String, enum: ["PIMPINAN"] },
      to: { type: String, enum: ["HR"] },
      delegatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      delegatedAt: Date,
      note: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessTrip", businessTripSchema);
