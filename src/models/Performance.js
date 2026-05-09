import mongoose from "mongoose";

const performanceReviewSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },

    periodMonth: Number,
    periodYear: Number,

    totalScore: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
);

const PerformanceReview = mongoose.model(
  "PerformanceReview",
  performanceReviewSchema,
);

export default PerformanceReview;
