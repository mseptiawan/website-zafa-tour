import mongoose from "mongoose";

const employeeCareerSchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    status_pegawai: {
      type: String,
      enum: ["Pegawai Tetap", "Pegawai Kontrak", "Magang / Intern", "Pensiun"],
      required: true,
    },
    tanggal_mulai_bergabung: {
      type: Date,
      required: true,
    },
    tanggal_berakhir_kontrak: {
      type: Date,
    },
    bidangId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bidang",
    },
    unitId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Unit",
    },
    positionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Position",
    },
    penempatan: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EmployeeCareer = mongoose.model("EmployeeCareer", employeeCareerSchema);
export default EmployeeCareer;
