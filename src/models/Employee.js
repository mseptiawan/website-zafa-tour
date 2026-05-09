import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    employeeCode: {
      type: String,
      unique: true,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    phoneNumber: String,

    gender: {
      type: String,
      enum: ["Laki-Laki", "Perempuan"],
    },

    birthDate: Date,

    address: String,

    joinDate: {
      type: Date,
      default: Date.now,
    },

    employmentStatus: {
      type: String,
      enum: ["Tetap", "Kontrak", "Magang"],
      default: "Tetap",
    },

    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
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

    profilePhoto: String,
  },
  {
    timestamps: true,
  },
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
