import mongoose from "mongoose";

const positionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Position = mongoose.model("Position", positionSchema);

export default Position;
