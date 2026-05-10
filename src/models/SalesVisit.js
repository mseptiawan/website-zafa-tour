import mongoose from "mongoose";

const salesVisitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    customerName: String,
    address: String,

    note: String,
    result: String,

    location: {
      lat: Number,
      lng: Number,
    },

    photos: [String],

    visitTime: Date,
  },
  { timestamps: true },
);

export default mongoose.model("SalesVisit", salesVisitSchema);
