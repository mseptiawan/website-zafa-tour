import EmployeeLog from "../models/rewardPunishment/EmployeeLog.model.js";
import RewardPunishmentType from "../models/rewardPunishment/RewardPunishmentType.model.js";
import Employee from "../models/employee/Employee.model.js";

// =========================================================================
// ─── LOG TRANSACTION SERVICES (EXISTING) ───
// =========================================================================

export const findAllLogs = async () => {
  return await EmployeeLog.find()
    .populate("employeeId", "fullName")
    .populate("typeId")
    .populate("createdBy", "username")
    .sort({ dateIssued: -1 })
    .lean();
};

export const findAvailableEmployees = async () => {
  return await Employee.find({}, "_id fullName").sort({ fullName: 1 }).lean();
};

export const createLog = async ({ body, userId }) => {
  const { employeeId, typeId, reason, skNumber, dateIssued } = body;
  return await EmployeeLog.create({
    employeeId,
    typeId,
    reason,
    skNumber,
    dateIssued: new Date(dateIssued),
    createdBy: userId,
  });
};

export const deleteLogById = async (id) => {
  return await EmployeeLog.findByIdAndDelete(id);
};

// =========================================================================
// ─── MASTER TYPES SERVICES (NEW MANAGEMENT) ───
// =========================================================================

// Mengambil semua tanpa pengecualian status (Untuk halaman kelola master)
export const findMasterTypes = async () => {
  return await RewardPunishmentType.find().sort({ category: 1, name: 1 }).lean();
};

// Mengambil HANYA yang aktif (Untuk dropdown pilihan di form create log baru)
export const findActiveMasterTypes = async () => {
  return await RewardPunishmentType.find({ isActive: true }).sort({ category: 1, name: 1 }).lean();
};

// Validasi Duplikasi Nama dalam satu kategori yang sama
export const checkDuplicateTypeName = async (name, category) => {
  if (!name || !category) return false;
  const existing = await RewardPunishmentType.findOne({
    category,
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  }).lean();
  return !!existing;
};

// Tambah Data Baru
export const createType = async ({ category, name, description, financialImpact }) => {
  return await RewardPunishmentType.create({
    category,
    name: name.trim(),
    description,
    financialImpact: Number(financialImpact) || 0,
    isActive: true, // Nilai default saat dibuat pertama kali
  });
};

// Update Data Terpilih
export const updateTypeById = async (id, { category, name, description, financialImpact }) => {
  return await RewardPunishmentType.findByIdAndUpdate(
    id,
    { category, name: name.trim(), description, financialImpact: Number(financialImpact) || 0 },
    { new: true }
  ).lean();
};

// Mengubah status aktif/nonaktif (Soft Delete)
export const updateTypeStatus = async (id, isActive) => {
  return await RewardPunishmentType.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
};

export const findEmployeeLogs = async (employeeId) => {
  return await EmployeeLog.find({ employeeId })
    .populate("employeeId", "fullName")
    .populate("typeId")
    .populate("createdBy", "username")
    .sort({ dateIssued: -1 })
    .lean();
};
