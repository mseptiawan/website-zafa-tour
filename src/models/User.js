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
      required: true,
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
  },
  {
    toJSON: { virtuals: true }, // Pastikan virtuals aktif saat di-convert ke JSON/Object
    toObject: { virtuals: true },
  }
);
userSchema.virtual("employeeData", {
  ref: "Employee", // Nama model target
  localField: "_id", // Field di model User saat ini
  foreignField: "userId", // Field di model Employee yang nge-ref ke User id
  justOne: true,
});
const User = mongoose.model("User", userSchema);

export default User;
