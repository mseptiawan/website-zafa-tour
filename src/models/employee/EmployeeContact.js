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
      required: false,
      trim: true,
    },
    alamat: {
      type: String,
      required: false,
    },
    nama_kontak_darurat: {
      type: String,
      required: false,
    },
    hubungan_kontak_darurat: {
      type: String,
      required: false,
    },
    nomor_kontak_darurat: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeContact = mongoose.model("EmployeeContact", employeeContactSchema);
export default EmployeeContact;
