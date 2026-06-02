import mongoose from "mongoose";

const employeeFinancialSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    nomor_rekening: {
      type: String,
      required: false,
      trim: true,
    },
    nama_bank: {
      type: String,
      required: false,
    },
    nama_pemilik_rekening: {
      type: String,
      required: false,
    },
    npwp: {
      type: String,
      required: false,
      trim: true,
    },
    bpjstk: {
      type: String,
      required: false,
      trim: true,
    },

    overtimeRate: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeFinancial = mongoose.model("EmployeeFinancial", employeeFinancialSchema);
export default EmployeeFinancial;
