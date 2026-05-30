import mongoose from "mongoose";

const employeeEducationSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    pendidikan_terakhir: {
      type: String,
      enum: ["SMA/SMK", "D3", "D4", "S1", "S2", "S3"],
      required: false,
    },
    institusi_pendidikan: {
      type: String,
      required: false,
    },
    tahun_kelulusan: {
      type: Number,
      required: false,
    },
    file_ijazah: {
      type: String,
      required: false,
    },
    sertifikat_profesional: {
      type: mongoose.Schema.Types.Mixed,
    },
    keahlian_utama: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeEducation = mongoose.model("EmployeeEducation", employeeEducationSchema);
export default EmployeeEducation;
