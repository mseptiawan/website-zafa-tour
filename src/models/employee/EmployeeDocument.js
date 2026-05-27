import mongoose from "mongoose";

const employeeDocumentSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    file_ktp: {
      type: String,
    },
    file_kk: {
      type: String,
    },
    file_skck: {
      type: String,
    },
    tanggal_kadaluarsa_skck: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeDocument = mongoose.model("EmployeeDocument", employeeDocumentSchema);
export default EmployeeDocument;
