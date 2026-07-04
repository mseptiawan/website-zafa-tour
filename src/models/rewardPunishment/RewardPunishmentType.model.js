import mongoose from "mongoose";

const rewardPunishmentTypeSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["REWARD", "PUNISHMENT"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const RewardPunishmentType = mongoose.model("RewardPunishmentType", rewardPunishmentTypeSchema);
export default RewardPunishmentType;
