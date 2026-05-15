import mongoose from "mongoose";

const salesVisitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    customerName: String,
    address: String,

    result: String,

    attachments: [
      {
        filename: String,
        originalName: String,
        mimetype: String,
        size: Number,
        path: String,
      },
    ],

    visitTime: Date,
  },
  { timestamps: true }
);

export default mongoose.model("SalesVisit", salesVisitSchema);
