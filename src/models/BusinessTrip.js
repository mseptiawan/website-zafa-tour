import mongoose from "mongoose";

const businessTripSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: String,

    purpose: {
      type: String,
      enum: ["SALES_VISIT", "MEETING", "TRAINING", "SURVEY", "OTHER"],
    },

    contactPerson: {
      name: String,
      phone: String,
    },

    startDate: Date,
    endDate: Date,

    destination: String,
    description: String,

    budget: {
      type: Number,
      default: 0,
    },

    timeline: [
      {
        address: String,
        order: Number,
      },
    ],

    // =========================
    // WORKFLOW STATE
    // =========================
    status: {
      type: String,
      enum: ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    currentStep: {
      type: String,
      enum: ["MANAGER", "PIMPINAN", null],
      default: "MANAGER",
    },

    // =========================
    // APPROVAL AUDIT TRAIL
    // =========================
    approvals: [
      {
        role: {
          type: String,
          enum: ["MANAGER", "PIMPINAN"],
        },

        actingAs: {
          type: String,
          enum: ["MANAGER", "HR", "PIMPINAN"],
        },

        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },

        status: {
          type: String,
          enum: ["APPROVED", "REJECTED"],
        },

        date: Date,

        note: String,
      },
    ],

    // =========================
    // DELEGATION (PIMPINAN ↔ HR)
    // =========================
    delegation: {
      from: {
        type: String,
        enum: ["PIMPINAN"],
      },

      to: {
        type: String,
        enum: ["HR"],
      },

      active: {
        type: Boolean,
        default: false,
      },

      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },

      createdAt: Date,

      note: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessTrip", businessTripSchema);
