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
      position: String,
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
      enum: ["PENDING", "APPROVED_MANAGER", "APPROVED_DIRECTOR", "REJECTED"],
      default: "PENDING",
    },

    approvedByManager: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: Date,
    },

    approvedByDirector: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      date: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessTrip", businessTripSchema);
