import mongoose from "mongoose";

// =========================================================================
// EMBEDDED SCHEMAS (Sub-Dokumen didefinisikan terpisah agar Mongoose rapi)
// =========================================================================

const budgetItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1, min: 1 },
    unit: { type: String, required: true, default: "Hari" },
    pricePerUnit: { type: Number, required: true, default: 0, min: 0 },
    allocatedAmount: { type: Number, default: 0 },
    description: String,
  },
  { _id: true }
);

const timelineSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ["APPROVED", "REJECTED"], required: true },
    date: { type: Date, default: Date.now },
    note: String,
  },
  { _id: true }
);

// =========================================================================
// MAIN BUSINESS TRIP SCHEMA (Embedded Main Object)
// =========================================================================

const businessTripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    requesterRole: { type: String, required: true },

    title: { type: String, required: true },
    purpose: {
      type: String,
      enum: ["KUNJUNGAN_SALES", "RAPAT", "PELATIHAN", "SURVEI", "LAINNYA"],
      required: true,
    },
    meetWith: { type: String, required: true, maxlength: 100 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    destination: { type: String, required: true },
    description: String,

    budget: {
      total: { type: Number, default: 0 },
      items: [budgetItemSchema],
    },

    timeline: [timelineSchema],

    currentStep: { type: String, default: null },
    approvals: [approvalSchema],

    payment: {
      proofUrl: String,
      paidAt: Date,
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      note: String,
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "COMPLETED",
      ],
      default: "PENDING",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessTrip", businessTripSchema);

 import Bidang from "../../models/basic/Bidang.model.js";
import Role from "../../models/basic/Role.model.js";

const bidangSeeder = async () => {
  await Bidang.deleteMany();
  const managerKeuangan = await Role.findOne({
    name: "MANAGER_KEUANGAN",
  });

  const managerAdministrasi = await Role.findOne({
    name: "MANAGER_ADMINISTRASI",
  });

  const managerHajiUmrah = await Role.findOne({
    name: "MANAGER_HAJI_UMRAH",
  });

  const wakilDirektur = await Role.findOne({
    name: "WAKIL_DIREKTUR",
  });
  await Bidang.insertMany([
    {
      name: "Keuangan",
      managerRoleId: managerKeuangan._id,
    },

    {
      name: "Marketing dan Kemitraan",
      managerRoleId: wakilDirektur._id,
    },

    {
      name: "Administrasi",
      managerRoleId: managerAdministrasi._id,
    },

    {
      name: "Haji dan Umrah",
      managerRoleId: managerHajiUmrah._id,
    },

    {
      name: "IT dan Multimedia",
      managerRoleId: wakilDirektur._id,
    },

    {
      name: "Umum dan Perlengkapan",
      managerRoleId: wakilDirektur._id,
    },
  ]);

  console.log("Bidang seeded");
};

export default bidangSeeder;

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
      enum: ["Pegawai Tetap", "Pegawai Kontrak", "Magang / Intern", "Pensiun", "Resign"],
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
import mongoose from "mongoose";
import BusinessTrip from "../models/BusinessTrip.model.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import {
  createTripService,
  getTripDetailService,
  updateTripService,
  getEditableTripService,
  handleApprovalService,
  editTripService,
  getApprovalTripsService,
} from "../services/trip.service.js";

// ==========================================
// AKSESIBILITAS SISI KARYAWAN (PENGAJU)
// ==========================================

/**
 * Menampilkan halaman formulir pengajuan dinas luar baru
 */
export const renderCreateTripForm = (req, res) => {
  res.render("trip/user/create", { title: "Pengajuan Dinas Luar", old: {}, errors: {} });
};

/**
 * Memproses penyimpanan data pengajuan dinas luar baru ke database
 */
export const storeTrip = async (req, res) => {
  try {
    await createTripService({
      user: req.session.user,
      body: req.body,
    });

    return res.redirect("/trip/me");
  } catch (err) {
    console.error(err);
    const status = err.status || 400;
    const errorMessage = err.message || "Gagal membuat pengajuan";

    return res.status(status).render("trip/user/create", {
      title: "Pengajuan Dinas Luar",
      old: req.body,
      errors: { global: errorMessage },
    });
  }
};

/**
 * Menampilkan daftar riwayat perjalanan dinas luar milik karyawan yang sedang login
 */
export const getTripHistory = async (req, res) => {
  try {
    const { page, limit, skip } = getPagination({
      page: req.query.page,
      limit: 10,
    });

    const query = { userId: req.session.user._id };
    const [trips, total] = await Promise.all([
      BusinessTrip.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      BusinessTrip.countDocuments(query),
    ]);

    const pagination = getPaginationMeta({ page, limit, total });

    res.render("trip/user/history", {
      title: "Perjalanan Saya",
      trips,
      pagination,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Gagal memuat data", errors: null });
  }
};

/**
 * Menampilkan detail lengkap informasi pengajuan dinas luar bagi sisi pengaju
 */
export const getTripDetail = async (req, res) => {
  try {
    const trip = await getTripDetailService(req.params.id);
    if (!trip) return res.status(404).render("errors/404", { title: "Data Tidak Ditemukan" });

    res.render("trip/user/detail", {
      title: "Detail Perjalanan Dinas",
      trip,
      approvals: trip.approvals || [],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Gagal memuat detail perjalanan" });
  }
};

/**
 * Menampilkan halaman edit formulir pengajuan dinas luar
 */
export const renderEditTripForm = async (req, res) => {
  try {
    const trip = await getEditableTripService(req.params.id, req.session.user._id);
    return res.render("trip/user/edit", { title: "Edit Pengajuan", trip });
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN") return res.status(403).send("Tidak dapat mengedit pengajuan");
    return res.status(500).send("Error load edit form");
  }
};

/**
 * Memproses pembaruan data pengajuan dinas luar dari form edit
 */
export const updateTrip = async (req, res) => {
  try {
    await editTripService(req.params.id, req.session.user._id, req.body);
    return res.redirect("/trip/me");
  } catch (err) {
    if (err.message === "INVALID_ID" || err.message === "NOT_FOUND")
      return res.status(404).send("Data tidak ditemukan");
    if (err.message === "FORBIDDEN") return res.status(403).send("Pengajuan tidak dapat diedit");
    return res.status(500).send("Error update pengajuan");
  }
};

// ==========================================
// AKSESIBILITAS SISI ATASAN (OTORISASI)
// ==========================================

/**
 * Menampilkan daftar pengajuan masuk yang membutuhkan approval dari atasan
 */
export const getIncomingTrips = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.status(401).send("Session expired");

    const trips = await getApprovalTripsService(user);

    const activeStatuses = ["PENDING", "IN_REVIEW"];
    const activeTrips = trips.filter((t) =>
      activeStatuses.includes((t.status || "").toUpperCase().trim())
    );
    const historyTrips = trips.filter(
      (t) => !activeStatuses.includes((t.status || "").toUpperCase().trim())
    );

    return res.render("trip/user/approvals", {
      title: "Approval Dinas Luar",
      activeTrips,
      historyTrips,
      user,
      error: null,
    });
  } catch (err) {
    if (err.message === "FORBIDDEN") {
      return res.status(403).send("Tidak memiliki akses approval");
    }
    return res.status(500).send(`Error load approval page: ${err.message}`);
  }
};

/**
 * Menampilkan detail dokumen dinas luar masuk khusus untuk lembar otorisasi atasan
 */
export const getIncomingTripDetail = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("Invalid ID");

    const trip = await BusinessTrip.findById(id).populate("userId");
    if (!trip) return res.status(404).send("Trip not found");

    return res.render("trip/approval/approval-detail", {
      title: "Detail Persetujuan",
      trip,
      user: req.session.user,
      error: null,
      approvals: trip.approvals || [],
    });
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

/**
 * Memproses aksi persetujuan (Approve, Reject, Revision) dari atasan
 */
export const actionTripApproval = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send("Invalid ID");

    await handleApprovalService({
      id,
      user: req.session.user,
      action: req.body.action,
      note: req.body.note,
    });

    return res.redirect(`/trip/incoming/${id}`); // Redirect diarahkan kembali ke rute detail incoming yang baru
  } catch (err) {
    const trip = await BusinessTrip.findById(req.params.id);
    return res.status(err.status || 400).render("trip/approval/approval-detail", {
      title: "Approval Trip",
      user: req.session.user,
      error: err.message,
      id: req.params.id,
      trip,
    });
  }
};
import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import Role from "../models/basic/Role.model.js";
import User from "../models/basic/User.model.js";
import mongoose from "mongoose";

export const attachEmployeeName = async (docs) => {
  const employees = await Employee.find().select("userId fullName");
  const map = new Map(employees.map((e) => [e.userId?.toString(), e.fullName]));
  return docs.map((d) => ({
    ...d.toObject(),
    fullName: map.get(d.userId?.toString()) || "-",
  }));
};

const parseAndValidateBudget = (budgetData) => {
  let budgetItems = budgetData?.items;
  if (!Array.isArray(budgetItems)) {
    budgetItems = budgetItems ? [budgetItems] : [];
  }

  const normalizedBudgetItems = budgetItems
    .map((item) => {
      const quantity = Number(item?.quantity || 1);
      const pricePerUnit = Number(item?.pricePerUnit || 0);
      return {
        title: item?.title?.trim(),
        quantity,
        unit: item?.unit?.trim() || "Hari",
        pricePerUnit,
        allocatedAmount: quantity * pricePerUnit,
        description: item?.description?.trim() || "",
      };
    })
    .filter((item) => item.title);

  if (normalizedBudgetItems.length === 0) {
    const err = new Error("Rincian budget wajib diisi minimal 1 item");
    err.status = 400;
    throw err;
  }

  const isBudgetInvalid = normalizedBudgetItems.some(
    (item) =>
      isNaN(item.quantity) ||
      item.quantity <= 0 ||
      isNaN(item.pricePerUnit) ||
      item.pricePerUnit < 0
  );

  if (isBudgetInvalid) {
    const err = new Error("Kuantitas atau nominal harga unit budget tidak valid / bernilai minus");
    err.status = 400;
    throw err;
  }

  const totalBudget = normalizedBudgetItems.reduce((sum, item) => sum + item.allocatedAmount, 0);

  return {
    total: totalBudget,
    items: normalizedBudgetItems,
  };
};

export const createTripService = async ({ user, body }) => {
  if (!user) {
    const err = new Error("Session tidak valid");
    err.status = 401;
    throw err;
  }

  let { title, purpose, startDate, endDate, destination, description, budget, meetWith, timeline } =
    body;

  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) {
    const err = new Error("Employee tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career) {
    const err = new Error("Career tidak ditemukan");
    err.status = 400;
    throw err;
  }

  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang || !bidang.managerRoleId) {
    const err = new Error("Manager bidang belum diset");
    err.status = 400;
    throw err;
  }

  const managerRole = bidang.managerRoleId.name;

  if (!Array.isArray(timeline)) timeline = timeline ? [timeline] : [];
  const normalizedTimeline = timeline
    .map((t, index) => ({
      address: typeof t === "string" ? t : t?.address?.trim?.(),
      order: index + 1,
    }))
    .filter((t) => t.address);

  const processedBudget = parseAndValidateBudget(budget);

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (!title || title.trim().length < 5) throw new Error("Judul minimal 5 karakter");
  if (isNaN(start) || isNaN(end) || start > end) throw new Error("Tanggal tidak valid");
  if (!destination || destination.trim().length < 3) throw new Error("Destination tidak valid");
  if (normalizedTimeline.length === 0) throw new Error("Timeline wajib diisi");

  return await BusinessTrip.create({
    userId: user._id,
    requesterRole: user.role,
    title: title.trim(),
    purpose,
    startDate: start,
    endDate: end,
    destination: destination.trim(),
    description: description?.trim(),
    meetWith,
    timeline: normalizedTimeline,
    budget: processedBudget,
    status: "PENDING",
    currentStep: managerRole,
    approvals: [],
  });
};

export const getMyTripsService = async (userId) => {
  return await BusinessTrip.find({ userId }).sort({ createdAt: -1 });
};

export const getTripDetailService = async (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findById(id).populate({
    path: "userId",
    select: "username roleId",
    populate: { path: "roleId", select: "name" },
  });
  if (!trip) throw new Error("NOT_FOUND");
  return trip;
};

export const getApprovalTripsService = async (user) => {
  const role = (user.role || "").toUpperCase();
  const baseFilter = { status: { $in: ["PENDING", "IN_REVIEW"] } };

  if (role === "DIREKTUR_UTAMA") {
    baseFilter.currentStep = "DIREKTUR_UTAMA";
    return await BusinessTrip.find(baseFilter).populate("userId", "username");
  }

  if (role === "WAKIL_DIREKTUR") {
    baseFilter.$or = [
      { currentStep: "WAKIL_DIREKTUR" },
      {
        currentStep: "DIREKTUR_UTAMA",
        "delegation.active": true,
        "delegation.to": "WAKIL_DIREKTUR",
      },
    ];
    return await BusinessTrip.find(baseFilter).populate("userId", "username");
  }

  const employee = await Employee.findOne({ userId: user._id });
  if (!employee) return [];
  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career) return [];
  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang?.managerRoleId) return [];

  baseFilter.currentStep = bidang.managerRoleId.name;
  return await BusinessTrip.find(baseFilter).populate("userId", "username");
};

const editableStatuses = ["PENDING", "REJECTED"];

export const getEditableTripService = async (id, userId) => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error("INVALID_ID");
  const trip = await BusinessTrip.findOne({ _id: id, userId });
  if (!trip) throw new Error("NOT_FOUND");
  if (!editableStatuses.includes(trip.status)) throw new Error("FORBIDDEN");
  return trip;
};

export const editTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);
  if (trip.status !== "PENDING") throw new Error("FORBIDDEN");

  const processedBudget = parseAndValidateBudget(body.budget);
  Object.assign(trip, {
    title: body.title,
    destination: body.destination,
    description: body.description,
    meetWith: body.meetWith,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: processedBudget,
  });

  await trip.save();
  return trip;
};

export const updateTripService = async (id, userId, body) => {
  const trip = await getEditableTripService(id, userId);
  if (trip.status !== "REJECTED") throw new Error("FORBIDDEN");

  const processedBudget = parseAndValidateBudget(body.budget);
  Object.assign(trip, {
    title: body.title,
    destination: body.destination,
    description: body.description,
    meetWith: body.meetWith,
    startDate: body.startDate,
    endDate: body.endDate,
    budget: processedBudget,
  });

  const lastRejected = [...trip.approvals].reverse().find((a) => a.status === "REJECTED");
  if (!lastRejected) throw new Error("REJECT_HISTORY_NOT_FOUND");

  const isHRFlow =
    trip.delegation?.active === true &&
    trip.delegation?.to === "WAKIL_DIREKTUR" &&
    lastRejected.actor === "WAKIL_DIREKTUR";

  trip.approvals = [];
  trip.status = "IN_REVIEW";

  if (isHRFlow) {
    trip.currentStep = "DIREKTUR_UTAMA";
    trip.delegation.active = true;
  } else if (
    lastRejected.step === "DIREKTUR_UTAMA" ||
    lastRejected.step === "MANAGER_ADMINISTRASI"
  ) {
    trip.currentStep = lastRejected.step;
    trip.status = lastRejected.step === "MANAGER_ADMINISTRASI" ? "PENDING" : "IN_REVIEW";
    trip.delegation.active = false;
  } else {
    throw new Error("INVALID_WORKFLOW_STATE");
  }

  await trip.save();
  return trip;
};

export const handleApprovalService = async ({ id, user, action, note }) => {
  const trip = await BusinessTrip.findById(id).populate("userId");
  if (!trip) {
    const err = new Error("Data tidak ditemukan");
    err.status = 404;
    throw err;
  }

  const employee = await Employee.findOne({ userId: trip.userId._id });
  if (!employee) {
    const err = new Error("Employee tidak ditemukan");
    err.status = 400;
    throw err;
  }
  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career) {
    const err = new Error("Career tidak ditemukan");
    err.status = 400;
    throw err;
  }
  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang || !bidang.managerRoleId) {
    const err = new Error("Manager bidang belum diset");
    err.status = 400;
    throw err;
  }

  const managerRole = bidang.managerRoleId.name;
  const step = trip.currentStep;

  if (["APPROVED", "REJECTED", "PAID"].includes(trip.status)) {
    const err = new Error("Approval sudah selesai");
    err.status = 400;
    throw err;
  }

  const effectiveActor =
    trip.delegation?.active && step === "DIREKTUR_UTAMA" && user.role === "WAKIL_DIREKTUR"
      ? "WAKIL_DIREKTUR"
      : user.role;

  if (action === "APPROVE") {
    trip.approvals.push({
      step,
      actor: effectiveActor,
      userId: user._id,
      status: "APPROVED",
      date: new Date(),
      note: note || null,
    });

    if (step === managerRole) {
      trip.currentStep = "DIREKTUR_UTAMA";
      trip.status = "IN_REVIEW";
    } else if (step === "DIREKTUR_UTAMA") {
      trip.status = "APPROVED";
      trip.currentStep = null;
    }

    await trip.save();
    return { message: "Approved" };
  }

  if (action === "REJECT") {
    if (!note || note.trim().length < 5) {
      const err = new Error("Alasan reject minimal 5 karakter");
      err.status = 400;
      throw err;
    }
    trip.approvals.push({
      step,
      actor: effectiveActor,
      userId: user._id,
      status: "REJECTED",
      date: new Date(),
      note,
    });
    trip.status = "REJECTED";
    trip.currentStep = null;

    await trip.save();
    return { message: "Rejected" };
  }

  const err = new Error("Action tidak valid");
  err.status = 400;
  throw err;
};


  
 pelajarin kode itu, trip model, ketika pegawai mengajukan dinas luar maka perlu acc ke manager bidang, setelah itu acc direktur utama, kalo manager bidang yang mengajukan maka langsung ke direktur utama, stlh selesai acc maka butuh acc finance manager keuangan  maka status approved, pada trip gua udah hapus resubmit agar lebih ringkas, berikan kode baru trip