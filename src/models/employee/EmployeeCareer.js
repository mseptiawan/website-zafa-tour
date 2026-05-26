import mongoose from "mongoose";

const employeeCareerSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    status_karyawan: {
      type: String,
      enum: ["Tetap", "Kontrak", "Magang", "Harian"],
      required: true,
    },
    tanggal_mulai_bergabung: {
      type: Date,
      required: true,
    },
    tanggal_berakhir_kontrak: {
      type: Date,
    },
    bidang: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bidang",
      required: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
    posisi: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeCareer = mongoose.model("EmployeeCareer", employeeCareerSchema);
export default EmployeeCareer;
