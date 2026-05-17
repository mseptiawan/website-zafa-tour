import mongoose from "mongoose";

const leaveTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    maxdays: {
      type: Number,
      required: true,
      default: 0, // Maksimal hari yang boleh diambil untuk jenis cuti ini
    },
    minadvancedays: {
      type: Number,
      required: true,
      default: 0, // Minimal H-minus pengajuan sebelum tanggal mulai
    },
    isdeductbalance: {
      type: Boolean,
      required: true,
      default: true, // true jika memotong kuota tahunan
    },
    requiresattachment: {
      type: Boolean,
      required: true,
      default: false, // true jika wajib unggah dokumen pendukung
    },
    deskription: {
      type: String,
      trim: true,
    },
    isactive: {
      type: Boolean,
      required: true,
      default: true, // Status aktif/nonaktif jenis cuti
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("LeaveType", leaveTypeSchema);
