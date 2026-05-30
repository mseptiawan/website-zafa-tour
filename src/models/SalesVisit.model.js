import mongoose from "mongoose";

const salesVisitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    address: String,

    meetWith: {
      type: String,
      required: true,
      maxlength: 100,
    },

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
