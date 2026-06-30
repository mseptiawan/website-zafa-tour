import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    file_ktp: { type: String },
    file_kk: { type: String },
    file_skck: { type: String },
    tanggal_kadaluarsa_skck: { type: Date },
    sertifikat_kompetensi: [
      {
        nama_sertifikat: { type: String },
        penerbit: { type: String },
        nomor_sertifikat: { type: String },
        tanggal_terbit: { type: Date },
        tanggal_kadaluarsa: { type: Date },
        file_sertifikat: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const EmployeeDocument = mongoose.model("EmployeeDocument", employeeDocumentSchema);
export default EmployeeDocument;
