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
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const Bidang = mongoose.model("Bidang", bidangSchema);

export default Bidang;
