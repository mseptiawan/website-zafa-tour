import mongoose from "mongoose";

const employeeContactSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    nomor_telp: {
      type: String,
      required: true,
      trim: true,
    },
    alamat: {
      type: String,
      required: true,
    },
    nama_kontak_darurat: {
      type: String,
      required: true,
    },
    hubungan_kontak_darurat: {
      type: String,
      required: true,
    },
    nomor_kontak_darurat: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeContact = mongoose.model("EmployeeContact", employeeContactSchema);
export default EmployeeContact;
