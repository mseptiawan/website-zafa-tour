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
      required: true,
      trim: true,
    },
    nama_bank: {
      type: String,
      required: true,
    },
    nama_pemilik_rekening: {
      type: String,
      required: true,
    },
    npwp: {
      type: String,
      trim: true,
    },
    bpjstk: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeFinancial = mongoose.model("EmployeeFinancial", employeeFinancialSchema);
export default EmployeeFinancial;
