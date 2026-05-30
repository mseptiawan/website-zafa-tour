import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
  },
  hubungan: {
    type: String,
    enum: ["Suami", "Istri", "Anak", "Orang Tua", "Saudara Kandung"],
    required: true,
  },
  nik: {
    type: String,
  },
  tanggal_lahir: {
    type: Date,
  },
  jenis_kelamin: {
    type: String,
    enum: ["Laki-laki", "Perempuan"],
  },
  pekerjaan: {
    type: String,
  },
  status_tanggungan: {
    type: Boolean,
    default: false,
  },
});

const employeeFamilySchema = new mongoose.Schema(
  {
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      unique: true,
    },
    anggota_keluarga: [familyMemberSchema],
  },
  {
    timestamps: true,
  }
);

const EmployeeFamily = mongoose.model("EmployeeFamily", employeeFamilySchema);
export default EmployeeFamily;
