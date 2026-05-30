import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: false,
  },
  hubungan: {
    type: String,
    enum: ["Suami", "Istri", "Anak", "Orang Tua", "Saudara Kandung"],
    required: false,
  },
  nik: {
    type: String,
    required: false,
  },
  tanggal_lahir: {
    type: Date,
    required: false,
  },
  jenis_kelamin: {
    type: String,
    enum: ["Laki-laki", "Perempuan"],
    required: false,
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
