import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      unique: true,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    phoneNumber: {
      type: String,
    },

    gender: {
      type: String,
      enum: ["Laki-Laki", "Perempuan"],
    },

    birthDate: {
      type: Date,
    },

    address: {
      type: String,
    },

    joinDate: {
      type: Date,
      default: Date.now,
    },

    employmentStatus: {
      type: String,
      enum: ["Tetap", "Kontrak", "Magang"],
      default: "Tetap",
    },

    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
    },

    bidangId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bidang",
    },

    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },

    baseSalary: {
      type: Number,
      default: 0,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    profilePhoto: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
