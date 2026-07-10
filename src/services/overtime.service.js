import mongoose from "mongoose";
import { Overtime } from "../models/Overtime.model.js";
import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import { getPagination, getPaginationMeta } from "../utils/pagination.js";
import { PAGINATION, MODULES, NOTIF_CATEGORIES } from "../config/constants.js";
import notificationService from "./notification.service.js";

/**
 * Membuat pengajuan lembur baru dan memproses alur persetujuan otomatis tingkat manajemen.
 * @param {Object} params
 * @param {Object} params.user - Objek user dari session login
 * @param {Object} params.body - Payload form lembur
 * @param {Object} [params.file] - File bukti pendukung dari multer
 * @returns {Promise<Object>} Data Overtime yang berhasil dibuat
 */
export const createOvertime = async ({ user, body, file }) => {
  const rawDate = new Date(body.date);
  const workDate = new Date(Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate()));

  const start = new Date(`${body.date}T${body.startTime}:00Z`);
  let end = new Date(`${body.date}T${body.endTime}:00Z`);

  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const totalHours = (end - start) / (1000 * 60 * 60);
  const period = getPayrollPeriod(workDate);

  if (!period?.id) {
    throw new Error("Periode payroll tidak valid atau belum dikonfigurasi.");
  }

  const employeeId = user.employeeId;
  if (!employeeId) {
    throw new Error("Profil karyawan (Employee ID) tidak ditemukan pada sesi Anda.");
  }

  // Ambil data Employee untuk mendapatkan financialData (overtimeRate)
  const employeeData = await Employee.findById(employeeId).lean();
  if (!employeeData) {
    throw new Error("Data karyawan tidak ditemukan di sistem.");
  }

  let status = "SUBMITTED";
  let approvedBy = null;
  let approvedAt = null;
  let overtimeRateSnapshot = undefined;
  let multiplierSnapshot = undefined;
  let requiredManagerRole = null;
  let bidangId = null;

  const historyAction = [];
  const isWadirOrManager =
    user.role === "WAKIL_DIREKTUR" || (user.role || "").startsWith("MANAGER_");

  if (isWadirOrManager) {
    status = "APPROVED";
    approvedBy = user._id;
    approvedAt = new Date();
    overtimeRateSnapshot = employeeData.financialData?.overtimeRate || 0;
    multiplierSnapshot = 1.5;

    const basicCareer = await EmployeeCareer.findOne({ employee_id: employeeId });
    bidangId = basicCareer?.bidangId || null;

    if (!bidangId) {
      const sampleBidang = await mongoose.model("Bidang").findOne({});
      if (sampleBidang) {
        bidangId = sampleBidang._id;
      } else {
        throw new Error("Gagal memproses lembur. Bidang operasional tidak ditemukan.");
      }
    }

    requiredManagerRole = user.role;
    historyAction.push(
      { action: "SUBMITTED", by: user._id, role: user.role, at: new Date() },
      {
        action: "APPROVED",
        by: user._id,
        role: user.role,
        note: "Sistem otomatis menyetujui pengajuan dinas lembur tingkat Manajemen Utama / Wakil Direktur.",
        at: new Date(),
      }
    );
  } else {
    const career = await EmployeeCareer.findOne({ employee_id: employeeId }).populate({
      path: "bidangId",
      populate: { path: "managerRoleId" },
    });

    if (!career?.bidangId?.managerRoleId?.name) {
      throw new Error("Struktur organisasi (Bidang/Atasan) untuk karir Anda belum dikonfigurasi.");
    }

    bidangId = career.bidangId._id;
    requiredManagerRole = career.bidangId.managerRoleId.name;

    historyAction.push({ action: "SUBMITTED", by: user._id, role: user.role, at: new Date() });
  }

  const overtime = await Overtime.create({
    userId: user._id,
    employeeId,
    employeeName: user.fullName,
    date: workDate,
    startTime: body.startTime,
    endTime: body.endTime,
    totalHours: Number(totalHours.toFixed(2)),
    workDescription: body.workDescription.trim(),
    result: body.result?.trim() || "",
    location: body.location,
    proofFile: file ? file.filename : null,
    status,
    payrollPeriodId: period.id,
    payrollStatus: "PENDING",
    bidangId,
    requiredManagerRole,
    overtimeRateSnapshot,
    multiplierSnapshot,
    approvedBy,
    approvedAt,
    approvalHistory: historyAction,
  });

  if (status === "SUBMITTED") {
    try {
      const managerCareer = await EmployeeCareer.findOne({
        bidangId,
        positionId: career?.bidangId?.managerRoleId?._id,
      }).populate("employee_id");
      if (managerCareer?.employee_id?.userId) {
        await notificationService.createManyNotifications({
          userIds: [managerCareer.employee_id.userId],
          senderId: user._id,
          senderName: user.fullName,
          title: "Pengajuan Lembur Baru",
          text: `${user.fullName} mengajukan lembur untuk tanggal ${body.date}.`,
          module: MODULES.OVERTIME,
          referenceId: overtime._id,
          actionUrl: `/overtime/approval`,
          type: "OVERTIME",
          category: NOTIF_CATEGORIES.INFO,
        });
      }
    } catch (err) {
      console.error("Gagal mengirim notifikasi lembur:", err.message);
    }
  }

  return overtime;
};

/**
 * Mengambil riwayat lembur milik user yang sedang login (Terpaginasi).
 */
export const findMineOvertime = async ({ userId, page, limit }) => {
  const paginationArgs = getPagination({ page, limit: limit || PAGINATION.DEFAULT_LIMIT });
  const filter = { userId };
  const total = await Overtime.countDocuments(filter);

  const data = await Overtime.find(filter)
    .sort({ createdAt: -1 })
    .skip(paginationArgs.skip)
    .limit(paginationArgs.limit)
    .lean();

  return {
    data,
    meta: getPaginationMeta({ page: paginationArgs.page, limit: paginationArgs.limit, total }),
  };
};

/**
 * Mengambil daftar pengajuan lembur yang memerlukan persetujuan manager aktif (Terpaginasi).
 */
export const findManagerApprovalList = async ({ user, query }) => {
  const page = parseInt(query.page) || 1;
  const limit = 10;
  const skip = (page - 1) * limit;
  const { search, tab = "active" } = query;

  const baseFilter = {
    userId: { $ne: user._id },
    requiredManagerRole: user.role,
  };

  if (search) {
    baseFilter.employeeName = { $regex: search, $options: "i" };
  }

  const activeFilter = { ...baseFilter, status: "SUBMITTED" };
  const historyFilter = { ...baseFilter, status: { $in: ["APPROVED", "REJECTED"] } };

  const [totalActive, totalHistory, activeData, historyData] = await Promise.all([
    Overtime.countDocuments(activeFilter),
    Overtime.countDocuments(historyFilter),
    Overtime.find(activeFilter)
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(tab === "active" ? skip : 0)
      .limit(limit)
      .lean(),
    Overtime.find(historyFilter)
      .populate("userId")
      .sort({ createdAt: -1 })
      .skip(tab === "history" ? skip : 0)
      .limit(limit)
      .lean(),
  ]);

  return {
    active: { data: activeData, meta: getPaginationMeta({ page, limit, total: totalActive }) },
    history: { data: historyData, meta: getPaginationMeta({ page, limit, total: totalHistory }) },
  };
};

export const getOvertimeSummary = async (employeeId, date = new Date()) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      console.log(`ID Karyawan tidak valid: ${employeeId}`);
      return { totalHours: 0, totalPay: 0 };
    }

    const period = getPayrollPeriod(date);
    const empObjectId = new mongoose.Types.ObjectId(employeeId);

    const records = await Overtime.find({
      employeeId: empObjectId,
      status: "APPROVED",
      payrollPeriodId: period.id,
    }).lean();

    console.log(`Ditemukan ${records.length} data lembur APPROVED untuk periode ${period.id}`);

    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    const totalPay = records.reduce((sum, r) => {
      const rate = r.overtimeRateSnapshot || 0;
      const multiplier = r.multiplierSnapshot || 1.5;

      return sum + (r.totalHours || 0) * rate * multiplier;
    }, 0);

    return {
      period,
      totalHours,
      totalPay,
    };
  } catch (error) {
    console.error("Error di getOvertimeSummary Service:", error);
    return {
      period: null,
      totalHours: 0,
      totalPay: 0,
    };
  }
};
