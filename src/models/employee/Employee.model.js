import mongoose from "mongoose";

// ==========================================
// SUB-SCHEMAS (EMBEDDED DATA)
// ==========================================

const familyMemberSchema = new mongoose.Schema({
  nama: { type: String, required: false },
  hubungan: {
    type: String,
    enum: ["Suami", "Istri", "Anak", "Orang Tua", "Saudara Kandung"],
    required: false,
  },
  nik: { type: String, required: false, trim: true },
  tanggal_lahir: { type: Date, required: false },
  jenis_kelamin: { type: String, enum: ["Laki-laki", "Perempuan"], required: false },
  pekerjaan: { type: String },
  status_tanggungan: { type: Boolean, default: false },
});

const contactSchema = new mongoose.Schema(
  {
    nomor_telp: { type: String, trim: true },
    alamat: { type: String },
    nama_kontak_darurat: { type: String },
    hubungan_kontak_darurat: { type: String },
    nomor_kontak_darurat: { type: String, trim: true },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    pendidikan_terakhir: {
      type: String,
      enum: ["SMA/SMK", "D3", "D4", "S1", "S2", "S3"],
      required: false,
    },
    institusi_pendidikan: { type: String },
    tahun_kelulusan: { type: Number },
    jurusan: { type: String, default: "-" },
    file_ijazah: { type: String },
  },
  { _id: false }
);

const financialSchema = new mongoose.Schema(
  {
    nomor_rekening: { type: String, trim: true },
    nama_bank: { type: String },
    nama_pemilik_rekening: { type: String },
    npwp: { type: String, trim: true },
    bpjstk: { type: String, trim: true },
    overtimeRate: { type: Number, default: 0 },
    basicSalary: { type: Number, required: true, default: 0, min: 0 },
  },
  { _id: false }
);

// ==========================================
// MAIN SCHEMA
// ==========================================

const employeeSchema = new mongoose.Schema(
  {
    employeeIdNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    nomor_ktp: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    tempat_lahir: { type: String },
    tanggal_lahir: { type: Date },
    jenis_kelamin: {
      type: String,
      enum: ["Laki-Laki", "Perempuan"],
      required: true,
    },
    agama: { type: String, required: true },
    golongan_darah: { type: String, trim: true },
    status_pernikahan: {
      type: String,
      enum: ["Lajang", "Menikah", "Cerai"],
    },
    foto_profile: { type: String },

    contactData: contactSchema,
    educationData: educationSchema,
    financialData: financialSchema,
    familyData: [familyMemberSchema],
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

// ==========================================
// VIRTUALS RELATION (REFERENCING DATA)
// ==========================================

employeeSchema.virtual("terminationHistory", {
  ref: "Termination",
  localField: "_id",
  foreignField: "employeeId",
  justOne: false,
});

employeeSchema.virtual("careerData", {
  ref: "EmployeeCareer",
  localField: "_id",
  foreignField: "employee_id",
  justOne: false,
});

employeeSchema.virtual("documentData", {
  ref: "EmployeeDocument",
  localField: "_id",
  foreignField: "employee_id",
  justOne: true,
});
employeeSchema.virtual("resignationHistory", {
  ref: "Resignation",
  localField: "_id",
  foreignField: "employee_id",
  justOne: false,
});
const Employee = mongoose.model("Employee", employeeSchema);
export default Employee;
