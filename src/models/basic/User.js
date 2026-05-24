import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      unique: true,
      required: false,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
userSchema.virtual("employeeData", {
  ref: "Employee",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});

userSchema.virtual("leaveBalanceData", {
  ref: "LeaveBalance",
  localField: "_id",
  foreignField: "userId",
  justOne: true,
});
const User = mongoose.model("User", userSchema);

export default User;
