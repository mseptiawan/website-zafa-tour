import EmployeeLog from "../models/rewardPunishment/EmployeeLog.model.js";
import RewardPunishmentType from "../models/rewardPunishment/RewardPunishmentType.model.js";
import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.model.js";
import notificationService from "./notification.service.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";

// =========================================================================
// ─── LOG TRANSACTION SERVICES (UPDATED WITH NOTIFICATION) ───
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

export const createLog = async ({ body, userId, attachmentPath }) => {
  const { employeeId, typeId, reason, skNumber, dateIssued, effectiveDate, amount } = body;

  // 1. Ambil data master tipe untuk keperluan teks notifikasi
  const typeMaster = await RewardPunishmentType.findById(typeId).lean();
  if (!typeMaster) {
    throw new Error("Tipe Reward/Punishment yang dipilih tidak valid atau tidak ditemukan.");
  }

  // 2. Cari target Employee untuk mendapatkan relasi `userId` akunnya
  const targetEmployee = await Employee.findById(employeeId).select("fullName userId").lean();
  if (!targetEmployee) {
    throw new Error("Data pegawai tidak ditemukan pada sistem.");
  }

  // 3. Simpan data transaksi ke database
  const log = await EmployeeLog.create({
    employeeId,
    typeId,
    reason,
    skNumber,
    dateIssued: new Date(dateIssued),
    effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
    amount: Number(amount) || 0,
    attachment: attachmentPath || "",
    createdBy: userId,
  });

  // 4. TRIGGER NOTIFIKASI OTOMATIS KE PEGAWAI BERSANGKUTAN
  try {
    if (targetEmployee.userId) {
      const categoryLabel =
        typeMaster.category === "REWARD"
          ? "Penghargaan (Reward) 🎉"
          : "Sanksi/Peringatan (Punishment) ⚠️";
      const formattedAmount =
        Number(amount) > 0 ? ` senilai Rp ${Number(amount).toLocaleString("id-ID")}` : "";

      await notificationService.createNotification({
        userId: targetEmployee.userId, // Mengirim langsung ke akun user pegawai
        senderId: userId, // ID Admin / HRD penanggung jawab
        senderName: "Manajemen SDM",
        title: `${categoryLabel} Baru Diterbitkan`,
        text: `Halo ${targetEmployee.fullName}, Anda menerima ${typeMaster.name}${formattedAmount} terkait: "${reason}". SK: ${skNumber}.`,
        module: MODULES.REWARD_PUNISHMENT || "REWARD_PUNISHMENT",
        referenceId: log._id,
        actionUrl: `/reward-punishment/my-logs`, // Arahkan ke halaman log riwayat pegawai
        type: "REWARD_PUNISHMENT",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi Reward/Punishment:", notifError.message);
  }

  return log;
};

export const deleteLogById = async (id) => {
  return await EmployeeLog.findByIdAndDelete(id);
};

// =========================================================================
// ─── MASTER TYPES SERVICES (AS IS) ───
// =========================================================================

export const findMasterTypes = async () => {
  return await RewardPunishmentType.find().sort({ category: 1, name: 1 }).lean();
};

export const findActiveMasterTypes = async () => {
  return await RewardPunishmentType.find({ isActive: true }).sort({ category: 1, name: 1 }).lean();
};

export const checkDuplicateTypeName = async (name, category) => {
  if (!name || !category) return false;
  const existing = await RewardPunishmentType.findOne({
    category,
    name: { $regex: `^${name.trim()}$`, $options: "i" },
  }).lean();
  return !!existing;
};

export const createType = async ({ category, name, description, financialImpact }) => {
  return await RewardPunishmentType.create({
    category,
    name: name.trim(),
    description,
    financialImpact: Number(financialImpact) || 0,
    isActive: true,
  });
};

export const updateTypeById = async (id, { category, name, description, financialImpact }) => {
  return await RewardPunishmentType.findByIdAndUpdate(
    id,
    { category, name: name.trim(), description, financialImpact: Number(financialImpact) || 0 },
    { new: true }
  ).lean();
};

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
