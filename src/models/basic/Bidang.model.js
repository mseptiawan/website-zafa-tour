import mongoose from "mongoose";

const bidangSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    managerRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Bidang = mongoose.model("Bidang", bidangSchema);

export default Bidang;
