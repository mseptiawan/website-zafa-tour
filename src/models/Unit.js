import mongoose from "mongoose";

const unitSchema = new mongoose.Schema(
  {
    bidangId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bidang",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Unit = mongoose.model("Unit", unitSchema);

export default Unit;
