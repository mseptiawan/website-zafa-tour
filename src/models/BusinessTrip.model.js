import mongoose from "mongoose";

const budgetItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unit: { type: String, required: true, default: "Hari" },
    pricePerUnit: { type: Number, required: true, default: 0, min: 0 },
    allocatedAmount: { type: Number, default: 0 },
    description: String,
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    actor: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
    date: { type: Date, default: Date.now },
    note: String,
  },
  { _id: true }
);

const businessTripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requesterRole: { type: String, required: true },

    title: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["KUNJUNGAN_SALES", "RAPAT", "PELATIHAN", "SURVEI", "LAINNYA"],
      required: true,
    },
    meetWith: { type: String, required: true, maxlength: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    destination: { type: String, required: true },
    description: String,

    budget: {
      total: { type: Number, default: 0 },
      items: [budgetItemSchema],
    },

    timeline: [timelineSchema],

    currentStep: { type: String, default: null },
    approvals: [approvalSchema],

    payment: {
      proofUrl: String,
      paidAt: Date,
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: String,
    },

    status: {
      type: String,
      enum: ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED", "COMPLETED"],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessTrip", businessTripSchema);
