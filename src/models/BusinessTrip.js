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
      enum: ["KUNJUNGAN_SALES", "RAPAT", "PELATIHAN", "SURVEI", "LAINNYA"],
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
    tripReport: {
      isSubmitted: { type: Boolean, default: false },

      submittedAt: Date,

      description: String,

      attachments: [
        {
          filename: String,
          url: String,
          mimetype: String,
          size: Number,
        },
      ],
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "IN_REVIEW",
        "APPROVED",
        "REJECTED",
        "PAYMENT_PROCESSING",
        "READY_TO_TRAVEL",
        "PAID",
        "ON_TRIP",
        "SUBMITTED",
      ],
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

    payment: {
      status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "PAID", "FAILED"],
        default: "PENDING",
      },

      proof: {
        filename: String,
        url: String,
        uploadedAt: Date,
      },

      amount: { type: Number, default: 0 },

      paidAt: Date,

      paidBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      note: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessTrip", businessTripSchema);
