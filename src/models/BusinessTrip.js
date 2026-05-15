import mongoose from "mongoose";

const businessTripSchema = new mongoose.Schema(
  {
    // Core
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],

    title: String,

    purpose: {
      type: String,
      enum: ["SALES_VISIT", "MEETING", "TRAINING", "SURVEY", "OTHER"],
    },

    meetWith: {
      type: String,
      required: true,
      maxlength: 100,
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

    status: {
      type: String,
      enum: ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"],
      default: "PENDING",
    },

    // Finance
    paymentStatus: {
      type: String,
      enum: ["UNPAID", "PAID"],
      default: "UNPAID",
    },

    paidAt: Date,

    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Workflow approval
    currentStep: {
      type: String,
      enum: ["MANAGER", "PIMPINAN"],
      default: "MANAGER",
    },

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

    // Delegasi
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
