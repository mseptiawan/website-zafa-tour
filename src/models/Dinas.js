import mongoose from "mongoose";

const dinasSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    type: {
      type: String,
      enum: ["DINAS_LUAR", "SALES_VISIT"],
    },

    startDate: Date,
    endDate: Date,

    destination: String,
    purpose: String,
    note: String,

    location: {
      lat: Number,
      lng: Number,
    },

    budget: {
      fuel: Number,
      meal: Number,
    },

    sales: {
      customerName: String,
      result: String,
    },

    photos: [String],

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

export default mongoose.model("Dinas", dinasSchema);
