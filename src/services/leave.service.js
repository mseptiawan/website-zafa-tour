import Leave from "../models/leave/Leave.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import User from "../models/basic/User.model.js";
import Holiday from "../models/calender/Holiday.model.js";
import Employee from "../models/employee/Employee.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";
import Role from "../models/basic/Role.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Bidang from "../models/basic/Bidang.model.js";
import LeaveCancellation from "../models/leave/LeaveCancellation.model.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";
import notificationService from "./notification.service.js";

// ─── WORKFLOW & HELPER INTERNAL SERVICE ───────────────────
const WORKFLOW = {
  PEGAWAI: ["MANAGER_BIDANG", "WAKIL_DIREKTUR"],
  MANAGER_HAJI_UMRAH: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"],
  MANAGER_KEUANGAN: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"],
  MANAGER_ADMINISTRASI: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"],
  WAKIL_DIREKTUR: ["DIREKTUR_UTAMA"],
  DIREKTUR_UTAMA: [],
};

export const getWakilDirektur = async () => {
  const role = await Role.findOne({ name: "WAKIL_DIREKTUR" });
  if (!role) throw new Error("Role WAKIL_DIREKTUR tidak ditemukan pada sistem database.");

  const user = await User.findOne({ roleId: role._id });
  if (!user) throw new Error("User dengan role WAKIL_DIREKTUR tidak ditemukan.");

  return { step: "WAKIL_DIREKTUR", approverId: user._id };
};

export const getManagerByBidang = async (userId) => {
  const employee = await Employee.findOne({ userId });
  if (!employee) return getWakilDirektur();

  const career = await EmployeeCareer.findOne({ employee_id: employee._id });
  if (!career?.bidangId) return getWakilDirektur();

  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");
  if (!bidang?.managerRoleId) return getWakilDirektur();

  const roleDoc = await Role.findOne({ name: bidang.managerRoleId.name });
  if (!roleDoc) return getWakilDirektur();

  const managerUser = await User.findOne({ roleId: roleDoc._id });
  if (!managerUser) return getWakilDirektur();

  return {
    step: bidang.managerRoleId.name,
    approverId: managerUser._id,
  };
};

export const calculateWorkDays = async (start, end) => {
  const startStr = new Date(start).toISOString().split("T")[0];
  const endStr = new Date(end).toISOString().split("T")[0];

  const startDate = new Date(startStr + "T00:00:00.000Z");
  const endDate = new Date(endStr + "T23:59:59.999Z");

  if (endDate < startDate) return 0;

  const holidays = await Holiday.find({
    isActive: true,
    date: { $gte: startDate, $lte: endDate },
  });

  const holidayDatesSet = new Set();
  holidays.forEach((h) => {
    if (h.date) {
      const dateStr = new Date(h.date).toISOString().split("T")[0];
      holidayDatesSet.add(dateStr);
    }
  });

  let count = 0;
  let curDate = new Date(startDate);

  while (curDate <= endDate) {
    const dateStr = curDate.toISOString().split("T")[0];
    const dayOfWeek = curDate.getDay();

    const isSunday = dayOfWeek === 0;
    const isHoliday = holidayDatesSet.has(dateStr);

    if (!isSunday && !isHoliday) {
      count++;
    }

    curDate.setDate(curDate.getDate() + 1);
  }

  return count;
};

// ─── SERVICE METHOD 1: HITUNG HARI CUTI ───────────────────
export const calculateLeaveDaysService = async ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    const error = new Error("Parameter tanggal pelaksanaan tidak lengkap.");
    error.statusCode = 400;
    throw error;
  }
  return await calculateWorkDays(startDate, endDate);
};

// ─── SERVICE METHOD 2: AMBIL DATA PUSAT MANAJEMEN CUTI ────
export const findLeaveManagementCenterDataService = async ({ currentUser, yearQuery }) => {
  const userRole = currentUser.role;
  let query = {};

  if (["MANAGER_ADMINISTRASI", "WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(userRole)) {
    const structuralApprovals = await LeaveApproval.find({ approverId: currentUser._id });
    const leaveIds = structuralApprovals.map((app) => app.leaveId);
    query = { _id: { $in: leaveIds } };
  }

  const allLeaves = await Leave.find(query)
    .populate("leaveTypeId", "name")
    .populate({ path: "userId", populate: { path: "employeeData", select: "fullName" } })
    .sort({ createdAt: -1 });

  const activeLeaves = allLeaves.filter((leave) => leave.status === "PENDING");
  const historyLeaves = allLeaves.filter((leave) => leave.status !== "PENDING");

  const currentYear = new Date().getFullYear();
  const selectedYear = yearQuery ? parseInt(yearQuery) : currentYear;

  const holidays = await Holiday.find({
    $or: [{ year: selectedYear }, { isRecurring: true }],
  }).sort({ date: 1 });

  return {
    activeLeaves,
    historyLeaves,
    holidays,
    selectedYear,
  };
};

// ─── SERVICE METHOD 3: TAMBAH AGENDA LIBUR BARU ───────────
export const createHolidayService = async ({ body }) => {
  const { name, date, endDate, type, isDeductLeave, description } = body;

  const parsedDate = new Date(date);
  const year = parsedDate.getFullYear();

  let finalIsDeductLeave = false;
  if (type === "COMPANY") {
    finalIsDeductLeave = true;
  } else if (type === "NATIONAL") {
    finalIsDeductLeave = false;
  } else if (type === "RELIGIOUS") {
    finalIsDeductLeave = isDeductLeave === "true" || isDeductLeave === true;
  }

  const newHoliday = await Holiday.create({
    name,
    date: parsedDate,
    endDate: endDate ? new Date(endDate) : null,
    type,
    isDeductLeave: finalIsDeductLeave,
    description,
    year,
  });

  if (finalIsDeductLeave === true) {
    await LeaveBalance.updateMany({ year: year }, { $inc: { remaining: -1, used: 1 } });
  }

  return newHoliday;
};

// ─── SERVICE METHOD 4: UPDATE DATA AGENDA LIBUR ───────────
export const updateHolidayService = async ({ id, body, currentUser }) => {
  if (currentUser.role !== "WAKIL_DIREKTUR") {
    const error = new Error(
      "Akses ditolak. Hanya Wakil Direktur (HR) yang memiliki hak memodifikasi kalender."
    );
    error.statusCode = 403;
    throw error;
  }

  const { name, date, endDate, type, isDeductLeave, description } = body;

  const oldHoliday = await Holiday.findById(id);
  if (!oldHoliday) {
    const error = new Error("Data agenda kalender libur tidak ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const parsedStartDate = new Date(date);
  parsedStartDate.setHours(0, 0, 0, 0);
  const year = parsedStartDate.getFullYear();

  const parsedEndDate = endDate ? new Date(endDate) : new Date(date);
  parsedEndDate.setHours(0, 0, 0, 0);

  const diffTimeNew = Math.abs(parsedEndDate - parsedStartDate);
  const totalDaysNew = Math.ceil(diffTimeNew / (1000 * 60 * 60 * 24)) + 1;

  const oldStart = new Date(oldHoliday.date);
  const oldEnd = oldHoliday.endDate ? new Date(oldHoliday.endDate) : new Date(oldHoliday.date);
  const diffTimeOld = Math.abs(oldEnd - oldStart);
  const totalDaysOld = Math.ceil(diffTimeOld / (1000 * 60 * 60 * 24)) + 1;

  let finalIsDeductLeave = false;
  if (type === "COMPANY") {
    finalIsDeductLeave = true;
  } else if (type === "NATIONAL") {
    finalIsDeductLeave = false;
  } else if (type === "RELIGIOUS") {
    finalIsDeductLeave = isDeductLeave === "true" || isDeductLeave === true;
  }

  if (oldHoliday.isActive) {
    const wasDeduct = oldHoliday.isDeductLeave === true;
    const isNowDeduct = finalIsDeductLeave === true;

    if (!wasDeduct && isNowDeduct) {
      await LeaveBalance.updateMany(
        { year: year },
        { $inc: { remaining: -totalDaysNew, used: totalDaysNew } }
      );
    } else if (wasDeduct && !isNowDeduct) {
      await LeaveBalance.updateMany(
        { year: oldHoliday.year },
        { $inc: { remaining: totalDaysOld, used: -totalDaysOld } }
      );
    } else if (wasDeduct && isNowDeduct) {
      const dayDifference = totalDaysOld - totalDaysNew;
      if (dayDifference !== 0) {
        await LeaveBalance.updateMany(
          { year: year },
          { $inc: { remaining: dayDifference, used: -dayDifference } }
        );
      }
    }
  }

  return await Holiday.findByIdAndUpdate(
    id,
    {
      name,
      date: parsedStartDate,
      endDate: endDate ? parsedEndDate : null,
      type,
      isDeductLeave: finalIsDeductLeave,
      description,
      year,
    },
    { new: true }
  );
};
// ─── HELPER ENGINE WORKFLOW CUTI ──────────────────────────
export const getNextApprover = async (requesterRoleName, currentStep) => {
  const steps = WORKFLOW[requesterRoleName] || [];

  if (!currentStep || currentStep === "HANDOVER") {
    if (steps.length > 0) {
      const nextStep = steps[0];
      const roleDoc = await Role.findOne({ name: nextStep });
      if (!roleDoc) return { nextStep: null, nextApproverId: null };

      const approver = await User.findOne({ roleId: roleDoc._id });
      return { nextStep, nextApproverId: approver ? approver._id : null };
    }
    return { nextStep: null, nextApproverId: null };
  }

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex !== -1 && currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1];
    const roleDoc = await Role.findOne({ name: nextStep });
    if (!roleDoc) return { nextStep: null, nextApproverId: null };

    const approver = await User.findOne({ roleId: roleDoc._id });
    return { nextStep, nextApproverId: approver ? approver._id : null };
  }

  return { nextStep: null, nextApproverId: null };
};

// ─── SERVICE METHOD 5: TOGGLE STATUS AKTIF AGENDA LIBUR ───
export const toggleHolidayStatusService = async ({ id, currentUser }) => {
  if (currentUser.role !== "WAKIL_DIREKTUR") {
    const error = new Error(
      "Akses ditolak. Kewenangan pembaruan status kalender hanya milik Wakil Direktur."
    );
    error.statusCode = 403;
    throw error;
  }

  const holiday = await Holiday.findById(id);
  if (!holiday) {
    const error = new Error("Data agenda kalender libur tidak dapat ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const start = new Date(holiday.date);
  const end = holiday.endDate ? new Date(holiday.endDate) : new Date(holiday.date);
  const diffTime = Math.abs(end - start);
  const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const targetStatus = !holiday.isActive;

  if (holiday.isDeductLeave === true) {
    if (holiday.isActive === true && targetStatus === false) {
      // Mengarsipkan: kembalikan saldo cuti tahunan pegawai
      await LeaveBalance.updateMany(
        { year: holiday.year },
        { $inc: { remaining: totalDays, used: -totalDays } }
      );
    } else if (holiday.isActive === false && targetStatus === true) {
      // Mengaktifkan kembali: potong saldo cuti tahunan pegawai
      await LeaveBalance.updateMany(
        { year: holiday.year },
        { $inc: { remaining: -totalDays, used: totalDays } }
      );
    }
  }

  holiday.isActive = targetStatus;
  await holiday.save();

  return holiday;
};

// ─── SERVICE METHOD 6: HAPUS AGENDA LIBUR KALENDER ────────
export const deleteHolidayService = async ({ id }) => {
  const deletedHoliday = await Holiday.findByIdAndDelete(id);
  if (!deletedHoliday) {
    const error = new Error("Gagal menghapus. Agenda tidak ditemukan pada sistem.");
    error.statusCode = 404;
    throw error;
  }
  return deletedHoliday;
};

// ─── SERVICE METHOD 7: GENERATE ATAU RESET SALDO CUTI ─────
export const generateOrResetLeaveBalanceService = async ({ yearInput }) => {
  const selectedYear = yearInput ? parseInt(yearInput) : new Date().getFullYear();
  const DEFAULT_LEAVE_QUOTA = 12;

  const activeEmployees = await User.find({ status: "Active" });
  if (activeEmployees.length === 0) {
    const error = new Error("Tidak ada Pegawai dengan status Active ditemukan di sistem database.");
    error.statusCode = 400;
    throw error;
  }

  const companyHolidays = await Holiday.find({
    year: selectedYear,
    isActive: true,
    isDeductLeave: true,
  });

  let totalDeductedDays = 0;
  companyHolidays.forEach((h) => {
    const start = new Date(h.date);
    start.setHours(0, 0, 0, 0);
    const end = h.endDate ? new Date(h.endDate) : new Date(h.date);
    end.setHours(0, 0, 0, 0);

    let loop = new Date(start);
    while (loop <= end) {
      if (loop.getDay() !== 0) {
        // Kecuali hari Minggu
        totalDeductedDays++;
      }
      loop.setDate(loop.getDate() + 1);
    }
  });

  await Promise.all(
    activeEmployees.map(async (employee) => {
      const approvedLeaves = await Leave.find({
        userId: employee._id,
        status: "APPROVED",
        startDate: {
          $gte: new Date(`${selectedYear}-01-01`),
          $lte: new Date(`${selectedYear}-12-31`),
        },
      });

      let totalCutiMandiriTerpakai = 0;
      approvedLeaves.forEach((leave) => {
        totalCutiMandiriTerpakai += leave.totalDays;
      });

      const initialRemaining = Math.max(
        0,
        DEFAULT_LEAVE_QUOTA - totalDeductedDays - totalCutiMandiriTerpakai
      );

      await LeaveBalance.findOneAndUpdate(
        { userId: employee._id, year: selectedYear },
        {
          $set: {
            userId: employee._id,
            year: selectedYear,
            allocated: DEFAULT_LEAVE_QUOTA,
            remaining: initialRemaining,
            used: totalCutiMandiriTerpakai,
            updatedAt: new Date(),
          },
        },
        { upsert: true, returnDocument: "after" }
      );
    })
  );

  return selectedYear;
};

// ─── SERVICE METHOD 8: AMBIL PREREQUISITE PENGALAMAN FORM ─
export const getApplyLeaveFormDataService = async ({ userId }) => {
  const currentYear = new Date().getFullYear();

  const [leaveTypes, employees, leaveBalance, employee] = await Promise.all([
    LeaveType.find({ isActive: true }),
    User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
    LeaveBalance.findOne({ userId, year: currentYear }),
    Employee.findOne({ userId }).select("jenis_kelamin"),
  ]);

  return {
    leaveTypes,
    employees,
    leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
    employee,
  };
};

// ─── SERVICE METHOD 9: SUBMIT / PROSES PENGAJUAN CUTI ─────
export const applyLeaveService = async ({ body, currentUser, file }) => {
  const { leaveTypeId, startDate, endDate, reason, handoverUserId } = body;
  const documentPath = file ? `/uploads/files/${file.filename}` : null;
  const currentYear = new Date(startDate || Date.now()).getFullYear();

  // 0. Ambil data profil karyawan untuk kebutuhan pengirim notifikasi (senderName)
  const employee = await Employee.findOne({ userId: currentUser._id }).lean();
  const senderName = employee?.fullName || currentUser.username || "Pegawai";

  // 1. Ambil data tipe cuti untuk mendeteksi apakah ini Cuti Tahunan atau bukan
  const leaveType = await LeaveType.findById(leaveTypeId);
  if (!leaveType) {
    const error = new Error("Kategori/Tipe cuti yang dipilih tidak valid.");
    error.statusCode = 404;
    throw error;
  }

  const balance = await LeaveBalance.findOne({ userId: currentUser._id, year: currentYear });
  const finalTotalDays = await calculateWorkDays(startDate, endDate);

  if (finalTotalDays === 0) {
    const error = new Error(
      "Pengajuan ditolak. Semua tanggal yang Anda pilih adalah hari libur atau cuti bersama."
    );
    error.statusCode = 400;
    throw error;
  }

  // 2. KONDISI FIX: Tentukan apakah jenis cuti ini adalah cuti tahunan
  const isCutiTahunan = leaveType.code === "CT" || leaveType.name.toLowerCase().includes("tahunan");

  // Validasi saldo HANYA berjalan jika pegawai memilih Cuti Tahunan
  if (isCutiTahunan) {
    if (!balance || balance.remaining < finalTotalDays) {
      const error = new Error(
        "Saldo kuota cuti tahunan Anda tidak mencukupi untuk durasi tersebut."
      );
      error.statusCode = 400;
      throw error;
    }
  }

  const newLeave = await Leave.create({
    userId: currentUser._id,
    leaveTypeId,
    startDate: new Date(startDate),
    endDate: new Date(endDate),
    totalDays: finalTotalDays,
    reason,
    documentPath,
    handoverUserId: handoverUserId || null,
    status: "PENDING",
  });

  let currentStep = "";
  let approverId = null;

  if (handoverUserId) {
    currentStep = "HANDOVER";
    approverId = handoverUserId;
  } else {
    let nextStep;
    let nextApproverId;

    if (currentUser.role === "PEGAWAI") {
      const manager = await getManagerByBidang(currentUser._id);
      nextStep = manager.step;
      nextApproverId = manager.approverId;
    } else {
      const workflow = await getNextApprover(currentUser.role, null);
      nextStep = workflow.nextStep;
      nextApproverId = workflow.nextApproverId;
    }
    currentStep = nextStep;
    approverId = nextApproverId;
  }

  if (approverId) {
    await LeaveApproval.create({
      leaveId: newLeave._id,
      step: currentStep,
      approverId,
      status: "PENDING",
    });
  } else {
    newLeave.status = "APPROVED";
    await newLeave.save();

    // 3. KONDISI FIX: Potong saldo jatah cuti HANYA jika tipenya Cuti Tahunan
    if (isCutiTahunan && balance) {
      balance.used += Number(finalTotalDays);
      balance.remaining -= Number(finalTotalDays);
      await balance.save();
    }
  }

  // ─── INTEGRASI ENGINE NOTIFIKASI BERANTAI (LEAVE WORKFLOW) ───
  try {
    if (approverId) {
      if (currentStep === "HANDOVER") {
        // Notifikasi ke user yang ditunjuk untuk Handover Pekerjaan
        await notificationService.createNotification({
          userId: approverId,
          senderId: currentUser._id,
          senderName: senderName,
          title: "Permintaan Handover Tugas Cuti",
          text: `${senderName} mendelegasikan pekerjaan kepada Anda untuk pengajuan cuti (${leaveType.name}) selama ${finalTotalDays} hari kerja.`,
          module: MODULES.LEAVE || "LEAVE",
          referenceId: newLeave._id,
          actionUrl: `/leave/detail/${newLeave._id}`,
          type: "LEAVE",
          category: NOTIF_CATEGORIES.INFO,
        });
      } else {
        // Notifikasi ke Manager / Atasan untuk persetujuan (Approval)
        await notificationService.createNotification({
          userId: approverId,
          senderId: currentUser._id,
          senderName: senderName,
          title: "Persetujuan Cuti Pegawai Baru",
          text: `${senderName} mengajukan ${leaveType.name} selama ${finalTotalDays} hari kerja dan menunggu persetujuan Anda.`,
          module: MODULES.LEAVE || "LEAVE",
          referenceId: newLeave._id,
          actionUrl: `/leave/detail/${newLeave._id}`,
          type: "LEAVE",
          category: NOTIF_CATEGORIES.INFO,
        });
      }
    } else {
      // Jika disetujui otomatis oleh sistem (Tanpa Alur Approval/Direksi)
      await notificationService.createNotification({
        userId: currentUser._id,
        senderId: currentUser._id,
        senderName: "Sistem HRIS",
        title: "Pengajuan Cuti Disetujui Otomatis 🎉",
        text: `Hore! Pengajuan ${leaveType.name} Anda selama ${finalTotalDays} hari berhasil disetujui secara otomatis.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: newLeave._id,
        actionUrl: `/leave/detail/${newLeave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    // Memastikan core business logik pembuatan cuti tetap aman/berjalan meskipun server notifikasi drop
    console.error("Gagal mengirimkan notifikasi alur cuti:", notifError.message);
  }

  return newLeave;
};

// ─── SERVICE METHOD 10: DASHBOARD RIWAYAT CUTI PEGAWAI ────
export const getUserLeaveHistoryService = async ({ userId }) => {
  const currentYear = new Date().getFullYear();

  const [leaves, balanceResult, holidays] = await Promise.all([
    Leave.find({ userId })
      .populate("leaveTypeId", "name code")
      .populate({
        path: "handoverUserId",
        populate: { path: "employeeData", select: "fullName" },
      })
      .sort({ createdAt: -1 }),

    LeaveBalance.findOne({ userId, year: currentYear }),

    Holiday.find({
      date: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    }),
  ]);

  const balance = balanceResult || { totalQuota: 12, used: 0, remaining: 12 };
  const totalCompanyHolidays = holidays.filter((h) => h.isDeductLeave).length;
  const pendingApprovalCount = await Leave.countDocuments({ userId, status: "PENDING" });

  const usedPrivateCuti = leaves
    .filter((l) => l.status === "APPROVED")
    .reduce((acc, curr) => acc + curr.totalDays, 0);

  return {
    leaves,
    holidays,
    summary: {
      totalQuota: balance.totalQuota,
      companyHolidays: totalCompanyHolidays,
      usedPrivate: usedPrivateCuti,
      pending: pendingApprovalCount,
      remaining: balance.remaining,
    },
  };
};
// ─── SERVICE METHOD 11: AMBIL DETAIL PENGAJUAN CUTI ───────
export const getLeaveDetailService = async ({ id }) => {
  const leave = await Leave.findById(id)
    .populate("leaveTypeId", "name")
    .populate({
      path: "userId",
      populate: [
        {
          path: "employeeData",
          select: "fullName",
          populate: {
            path: "careerData",
            select: "unitId",
            populate: { path: "unitId", select: "name" },
          },
        },
        { path: "leaveBalanceData" },
      ],
    })
    .populate({
      path: "handoverUserId",
      populate: { path: "employeeData", select: "fullName" },
    });

  if (!leave) {
    const error = new Error("Data pengajuan cuti tidak dapat ditemukan.");
    error.statusCode = 404;
    throw error;
  }

  const approvals = await LeaveApproval.find({ leaveId: id })
    .populate({
      path: "approverId",
      populate: {
        path: "employeeData",
        model: "Employee",
        select: "fullName",
      },
    })
    .sort({ createdAt: 1 });

  return { leave, approvals };
};

// ─── SERVICE METHOD 12: AMBIL DATA UNTUK EDIT CUTI ────────
export const getEditLeaveDataService = async ({ id, userId }) => {
  const currentYear = new Date().getFullYear();

  const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
    Leave.findById(id).populate("leaveTypeId"),
    LeaveType.find({ isActive: true }),
    User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
    LeaveBalance.findOne({ userId, year: currentYear }),
  ]);

  if (!leave || leave.status !== "PENDING") {
    const error = new Error("Data cuti tidak ditemukan atau status sudah tidak dapat diubah.");
    error.statusCode = 400;
    throw error;
  }

  return {
    leave,
    leaveTypes,
    employees,
    leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
  };
};

// ─── SERVICE METHOD 13: EKSEKUSI PEMBARUAN DATA CUTI ──────
export const updateLeaveService = async ({ id, body, currentUser }) => {
  const { leaveTypeId, startDate, endDate, totalDays, reason, handoverUserId } = body;

  const leave = await Leave.findById(id);
  if (!leave || leave.status !== "PENDING") {
    const error = new Error("Gagal memperbarui data. Dokumen cuti tidak valid.");
    error.statusCode = 400;
    throw error;
  }

  leave.leaveTypeId = leaveTypeId;
  leave.startDate = startDate;
  leave.endDate = endDate;
  leave.totalDays = totalDays;
  leave.reason = reason;
  leave.handoverUserId = handoverUserId || null;
  await leave.save();

  // Reset approval workflow
  await LeaveApproval.deleteMany({ leaveId: leave._id });

  let currentStep = "";
  let approverId = null;

  if (handoverUserId) {
    currentStep = "HANDOVER";
    approverId = handoverUserId;
  } else {
    let nextStep, nextApproverId;

    if (currentUser.role === "PEGAWAI") {
      const manager = await getManagerByBidang(currentUser._id);
      nextStep = manager.step;
      nextApproverId = manager.approverId;
    } else {
      const workflow = await getNextApprover(currentUser.role, null);
      nextStep = workflow.nextStep;
      nextApproverId = workflow.nextApproverId;
    }

    currentStep = nextStep;
    approverId = nextApproverId;
  }

  if (approverId) {
    await LeaveApproval.create({
      leaveId: leave._id,
      step: currentStep,
      approverId,
      status: "PENDING",
    });
  }

  return leave;
};

export const cancelPendingLeaveService = async ({ id }) => {
  const leave = await Leave.findById(id);
  if (!leave || leave.status !== "PENDING") {
    const error = new Error(
      "Pembatalan gagal. Dokumen tidak ditemukan atau sudah diproses system."
    );
    error.statusCode = 400;
    throw error;
  }

  // Cari siapa approver yang sedang memegang berkas pending ini SEBELUM statusnya diubah
  const activeApprovals = await LeaveApproval.find({
    leaveId: leave._id,
    status: "PENDING",
  }).lean();

  leave.status = "CANCELLED";
  await leave.save();

  await LeaveApproval.updateMany(
    { leaveId: leave._id, status: "PENDING" },
    {
      status: "CANCELLED",
      note: "Dibatalkan oleh pemohon",
      actionDate: new Date(),
    }
  );

  // ─── NOTIFIKASI PEMBATALAN OLEH PEGAWAI (STATUS PENDING) ───
  try {
    const employee = await Employee.findOne({ userId: leave.userId }).lean();
    const requesterName = employee?.fullName || "Karyawan Pemohon";

    const targetUserIds = activeApprovals.map((app) => app.approverId);

    if (targetUserIds.length > 0) {
      // Mengirimkan notifikasi ke satu atau beberapa approver yang memegang berkas terkait
      await notificationService.createManyNotifications({
        userIds: targetUserIds,
        senderId: leave.userId,
        senderName: requesterName,
        title: "Penarikan / Pembatalan Berkas Cuti",
        text: `${requesterName} membatalkan dokumen usulan cuti mereka yang sebelumnya berada di antrean Anda.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi pembatalan pending cuti:", notifError.message);
  }

  return leave;
};

export const requestCancelApprovedLeaveService = async ({ id, body, currentUser }) => {
  const { reason } = body;

  const leave = await Leave.findOne({
    _id: id,
    userId: currentUser._id,
    status: "APPROVED",
  });

  if (!leave) {
    const error = new Error("Data cuti tidak ditemukan atau tidak valid untuk dibatalkan.");
    error.statusCode = 404;
    throw error;
  }

  leave.status = "CANCELLATION_PENDING";
  await leave.save();

  await LeaveCancellation.create({
    leaveId: leave._id,
    requestedBy: currentUser._id,
    cancelReason: reason || "Mengajukan pembatalan cuti.",
    status: "PENDING",
  });

  const userRole = (currentUser.role || "").toString().trim().toUpperCase();
  let targetStep = null;
  let targetApproverId = null;

  if (userRole === "PEGAWAI") {
    const manager = await getManagerByBidang(currentUser._id);
    if (!manager || !manager.approverId) {
      const error = new Error("Manager bidang belum dikonfigurasi pada sistem.");
      error.statusCode = 500;
      throw error;
    }
    targetStep = manager.step;
    targetApproverId = manager.approverId;
  } else if (
    ["MANAGER_ADMINISTRASI", "MANAGER_KEUANGAN", "MANAGER_HAJI_UMRAH"].includes(userRole)
  ) {
    targetStep = "WAKIL_DIREKTUR";
  } else if (userRole === "WAKIL_DIREKTUR") {
    targetStep = "DIREKTUR_UTAMA";
  }

  if (!targetApproverId && targetStep) {
    const roleDoc = await Role.findOne({ name: targetStep });
    if (!roleDoc) {
      const error = new Error(`Role struktural ${targetStep} tidak ditemukan.`);
      error.statusCode = 500;
      throw error;
    }

    const approver = await User.findOne({ roleId: roleDoc._id });
    if (!approver) {
      const error = new Error(`User untuk pejabat role ${targetStep} belum tersedia.`);
      error.statusCode = 500;
      throw error;
    }
    targetApproverId = approver._id;
  }

  // Jika alur bypass/selesai, langsung eksekusi pembatalan mutlak (Instant Cancelled)
  if (!targetStep || !targetApproverId) {
    leave.status = "CANCELLED";
    await leave.save();

    await LeaveCancellation.findOneAndUpdate(
      { leaveId: leave._id, status: "PENDING" },
      { status: "APPROVED" }
    );

    const currentYear = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: currentUser._id, year: currentYear });
    if (balance) {
      balance.used -= Number(leave.totalDays);
      balance.remaining += Number(leave.totalDays);
      await balance.save();
    }

    // ─── NOTIFIKASI JIKA INSTAN BATAL (TANPA ALUR PERSETUJUAN) ───
    try {
      await notificationService.createNotification({
        userId: currentUser._id,
        senderId: currentUser._id,
        senderName: "Sistem HRIS",
        title: "Pembatalan Cuti Berhasil 🎉",
        text: "Permintaan pembatalan dokumen cuti Anda berhasil diproses secara instan oleh sistem.",
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    } catch (notifError) {
      console.error("Gagal mengirimkan notifikasi instan cancellation:", notifError.message);
    }

    return { instantCancelled: true };
  }

  await LeaveApproval.create({
    leaveId: leave._id,
    step: targetStep,
    approverId: targetApproverId,
    status: "PENDING",
    note: reason || "Mengajukan pembatalan cuti.",
  });

  // ─── NOTIFIKASI MINTA BATAL KARENA SUDAH APPROVED (BUTUH APPROVAL ULANG) ───
  try {
    const employee = await Employee.findOne({ userId: currentUser._id }).lean();
    const requesterName = employee?.fullName || currentUser.username || "Karyawan";

    await notificationService.createNotification({
      userId: targetApproverId,
      senderId: currentUser._id,
      senderName: requesterName,
      title: "Permohonan Pembatalan Dokumen Cuti",
      text: `${requesterName} memohon pembatalan atas cuti kerja yang terlanjur disetujui. Mohon tinjau ulang kelayakan operasional.`,
      module: MODULES.LEAVE || "LEAVE",
      referenceId: leave._id,
      actionUrl: `/leave/detail/${leave._id}`,
      type: "LEAVE",
      category: NOTIF_CATEGORIES.INFO,
    });
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi request cancellation:", notifError.message);
  }

  return { instantCancelled: false };
};

// ─── SERVICE METHOD 16: DATA AJUKAN ULANG CUTI TOLAK ─────
export const getResubmitLeaveDataService = async ({ id, userId }) => {
  const currentYear = new Date().getFullYear();

  const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
    Leave.findById(id),
    LeaveType.find({ isActive: true }),
    User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
    LeaveBalance.findOne({ userId, year: currentYear }),
  ]);

  if (!leave || leave.status !== "REJECTED") {
    const error = new Error("Data pengajuan tidak berstatus ditolak, tidak bisa diajukan ulang.");
    error.statusCode = 400;
    throw error;
  }

  return {
    leave,
    leaveTypes,
    employees,
    leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
  };
};

// ─── SERVICE METHOD 17: AMBIL DAFTAR DELEGASI TUGAS SAYA ──
export const getMyDelegationsService = async ({ userId }) => {
  const baseQuery = { approverId: userId, step: "HANDOVER" };

  const populateConfig = {
    path: "leaveId",
    populate: [
      {
        path: "userId",
        model: "User",
        select: "username employeeData",
        populate: { path: "employeeData", model: "Employee", select: "fullName" },
      },
      { path: "leaveTypeId", model: "LeaveType", select: "name" },
    ],
  };

  const [active, history] = await Promise.all([
    LeaveApproval.find({ ...baseQuery, status: "PENDING" }).populate(populateConfig),
    LeaveApproval.find({ ...baseQuery, status: { $in: ["APPROVED", "REJECTED"] } }).populate(
      populateConfig
    ),
  ]);

  return {
    delegations: active.filter((d) => d.leaveId),
    historyDelegations: history.filter((d) => d.leaveId),
  };
};

export const approveDelegationService = async ({ id, body, currentUser }) => {
  const { note } = body;

  const approval = await LeaveApproval.findOne({
    _id: id,
    approverId: currentUser._id,
    step: "HANDOVER",
    status: "PENDING",
  });

  if (!approval) {
    const error = new Error("Data delegasi tidak valid atau telah ditindaklanjuti sebelumnya.");
    error.statusCode = 404;
    throw error;
  }

  approval.status = "APPROVED";
  approval.actionDate = new Date();
  approval.note = note || "";
  await approval.save();

  const leave = await Leave.findById(approval.leaveId).populate({
    path: "userId",
    populate: { path: "roleId" },
  });

  const requester = leave.userId;
  const requesterRoleName = requester.roleId?.name?.toString().trim().toUpperCase() || "";

  let nextStep = null;
  let nextApproverId = null;

  if (requesterRoleName === "PEGAWAI") {
    const manager = await getManagerByBidang(requester._id);
    nextStep = manager.step;
    nextApproverId = manager.approverId;
  } else if (requesterRoleName.startsWith("MANAGER")) {
    const roleDoc = await Role.findOne({ name: "WAKIL_DIREKTUR" });
    const user = await User.findOne({ roleId: roleDoc._id });
    nextStep = "WAKIL_DIREKTUR";
    nextApproverId = user?._id;
  } else if (requesterRoleName === "WAKIL_DIREKTUR") {
    const roleDoc = await Role.findOne({ name: "DIREKTUR_UTAMA" });
    const user = await User.findOne({ roleId: roleDoc._id });
    nextStep = "DIREKTUR_UTAMA";
    nextApproverId = user?._id;
  }

  if (nextApproverId) {
    await LeaveApproval.create({
      leaveId: leave._id,
      step: nextStep,
      approverId: nextApproverId,
      status: "PENDING",
    });
  } else {
    leave.status = "APPROVED";
    await leave.save();

    const currentYear = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });
    if (balance) {
      balance.used += Number(leave.totalDays);
      balance.remaining -= Number(leave.totalDays);
      await balance.save();
    }
  }

  // ─── NOTIFIKASI APPROVE DELEGASI ───
  try {
    const approverEmp = await Employee.findOne({ userId: currentUser._id }).lean();
    const requesterEmp = await Employee.findOne({ userId: requester._id }).lean();

    const handlerName = approverEmp?.fullName || currentUser.username || "Rekan Kerja";
    const requesterName = requesterEmp?.fullName || "Pegawai";

    // 1. Notif ke Pemohon Cuti bahwa delegasinya diterima
    await notificationService.createNotification({
      userId: requester._id,
      senderId: currentUser._id,
      senderName: handlerName,
      title: "Delegasi Tugas Cuti Diterima",
      text: `${handlerName} telah menerima pelimpahan tugas Anda. Berkas kini diteruskan ke tahap persetujuan.`,
      module: MODULES.LEAVE || "LEAVE",
      referenceId: leave._id,
      actionUrl: `/leave/detail/${leave._id}`,
      type: "LEAVE",
      category: NOTIF_CATEGORIES.INFO,
    });

    // 2. Notif ke Approver berikutnya (jika ada) atau langsung notif Approved Akhir
    if (nextApproverId) {
      await notificationService.createNotification({
        userId: nextApproverId,
        senderId: currentUser._id,
        senderName: handlerName,
        title: "Persetujuan Cuti Baru (Pasca Handover)",
        text: `Tugas mandatori telah diserahterimakan. Pengajuan cuti ${requesterName} menunggu persetujuan Anda.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    } else {
      await notificationService.createNotification({
        userId: requester._id,
        senderId: currentUser._id,
        senderName: "Sistem HRIS",
        title: "Cuti Disetujui Penuh 🎉",
        text: `Hore! Karena tidak memerlukan approval lanjutan, cuti Anda resmi disetujui sistem setelah serah terima tugas.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi approve delegation:", notifError.message);
  }

  return approval;
};

export const rejectDelegationService = async ({ id, body, currentUser }) => {
  const { note } = body;

  const approval = await LeaveApproval.findOne({
    _id: id,
    approverId: currentUser._id,
    step: "HANDOVER",
    status: "PENDING",
  });

  if (!approval) {
    const error = new Error("Data pelimpahan tugas delegasi tidak ditemukan atau sudah diproses.");
    error.statusCode = 404;
    throw error;
  }

  approval.status = "REJECTED";
  approval.note = note || "";
  approval.actionDate = new Date();
  await approval.save();

  const leave = await Leave.findByIdAndUpdate(
    approval.leaveId,
    { status: "REJECTED" },
    { returnDocument: "after" }
  );

  // ─── NOTIFIKASI REJECT DELEGASI ───
  try {
    const approverEmp = await Employee.findOne({ userId: currentUser._id }).lean();
    const handlerName = approverEmp?.fullName || currentUser.username || "Rekan Kerja";

    await notificationService.createNotification({
      userId: leave.userId,
      senderId: currentUser._id,
      senderName: handlerName,
      title: "Delegasi Tugas Cuti Ditolak",
      text: `Permintaan serah terima tugas cuti Anda ditolak oleh ${handlerName}. Alasan: "${note || "Tidak ada catatan"}"`,
      module: MODULES.LEAVE || "LEAVE",
      referenceId: leave._id,
      actionUrl: `/leave/detail/${leave._id}`,
      type: "LEAVE",
      category: NOTIF_CATEGORIES.INFO,
    });
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi reject delegation:", notifError.message);
  }

  return approval;
};
// ─── SERVICE METHOD 20: AMBIL DATA ANTREAN PERSETUJUAN ────
export const getPendingApprovalsDataService = async ({ currentUser }) => {
  const approvals = await LeaveApproval.find({
    approverId: currentUser._id,
    step: {
      $in: [
        "MANAGER_ADMINISTRASI",
        "MANAGER_KEUANGAN",
        "MANAGER_HAJI_UMRAH",
        "WAKIL_DIREKTUR",
        "DIREKTUR_UTAMA",
      ],
    },
    status: "PENDING",
  }).populate({
    path: "leaveId",
    populate: [
      { path: "userId", populate: { path: "employeeData", select: "fullName" } },
      { path: "leaveTypeId", select: "name" },
    ],
  });

  // Ambil data profil struktural approver saat ini untuk kelengkapan berkas di view
  const employee = await Employee.findOne({ userId: currentUser._id });

  return { approvals, employee };
};

export const approveLeaveService = async ({ id, body, currentUser }) => {
  const { note } = body;

  const approval = await LeaveApproval.findOne({
    _id: id,
    approverId: currentUser._id,
    status: "PENDING",
  });

  if (!approval) {
    const error = new Error(
      "Berkas antrean persetujuan tidak ditemukan atau telah ditindaklanjuti."
    );
    error.statusCode = 404;
    throw error;
  }

  approval.status = "APPROVED";
  approval.note = note || "";
  approval.actionDate = new Date();
  await approval.save();

  const leave = await Leave.findById(approval.leaveId).populate({
    path: "userId",
    populate: { path: "roleId" },
  });

  const requester = leave.userId;
  const requesterRoleName = requester.roleId?.name?.toString().trim().toUpperCase() || "";

  // ==========================================
  // ALUR A: PEMBATALAN CUTI (CANCELLATION)
  // ==========================================
  if (leave.status === "CANCELLATION_PENDING") {
    leave.status = "CANCELLED";
    await leave.save();

    await LeaveCancellation.findOneAndUpdate(
      { leaveId: leave._id, status: "PENDING" },
      { status: "APPROVED" }
    );

    const currentYear = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });

    if (balance) {
      balance.used -= Number(leave.totalDays);
      balance.remaining += Number(leave.totalDays);
      await balance.save();
    }

    // ─── NOTIFIKASI PEMBATALAN APPROVED ───
    try {
      const approverEmp = await Employee.findOne({ userId: currentUser._id }).lean();
      const handlerName = approverEmp?.fullName || currentUser.username || "Atasan";

      await notificationService.createNotification({
        userId: requester._id,
        senderId: currentUser._id,
        senderName: handlerName,
        title: "Permohonan Pembatalan Cuti Disetujui",
        text: `Pembatalan cuti Anda telah disetujui oleh ${handlerName}. Saldo kuota jatah cuti tahunan Anda telah dipulihkan.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    } catch (notifError) {
      console.error("Gagal mengirimkan notifikasi approve cancellation:", notifError.message);
    }

    return { type: "CANCELLATION", leave };
  }

  // ==========================================
  // ALUR B: PENGAJUAN CUTI BARU/NORMAL
  // ==========================================
  let nextStep = null;
  let nextApproverId = null;
  const role = requesterRoleName;

  if (role === "PEGAWAI") {
    if (approval.step === "HANDOVER") {
      const manager = await getManagerByBidang(requester._id);
      nextStep = manager.step;
      nextApproverId = manager.approverId;
    } else if (approval.step.includes("MANAGER")) {
      const roleDoc = await Role.findOne({ name: "WAKIL_DIREKTUR" });
      const user = await User.findOne({ roleId: roleDoc._id });
      nextStep = "WAKIL_DIREKTUR";
      nextApproverId = user?._id;
    } else if (approval.step === "WAKIL_DIREKTUR") {
      const roleDoc = await Role.findOne({ name: "DIREKTUR_UTAMA" });
      const user = await User.findOne({ roleId: roleDoc._id });
      nextStep = "DIREKTUR_UTAMA";
      nextApproverId = user?._id;
    }
  } else if (role.startsWith("MANAGER")) {
    if (approval.step === "HANDOVER") {
      const roleDoc = await Role.findOne({ name: "WAKIL_DIREKTUR" });
      const user = await User.findOne({ roleId: roleDoc._id });
      nextStep = "WAKIL_DIREKTUR";
      nextApproverId = user?._id;
    } else if (approval.step === "WAKIL_DIREKTUR") {
      const roleDoc = await Role.findOne({ name: "DIREKTUR_UTAMA" });
      const user = await User.findOne({ roleId: roleDoc._id });
      nextStep = "DIREKTUR_UTAMA";
      nextApproverId = user?._id;
    }
  } else if (role === "WAKIL_DIREKTUR") {
    if (approval.step === "HANDOVER") {
      const roleDoc = await Role.findOne({ name: "DIREKTUR_UTAMA" });
      const user = await User.findOne({ roleId: roleDoc._id });
      nextStep = "DIREKTUR_UTAMA";
      nextApproverId = user?._id;
    }
  }

  if (nextApproverId) {
    await LeaveApproval.create({
      leaveId: leave._id,
      step: nextStep,
      approverId: nextApproverId,
      status: "PENDING",
    });
  } else {
    leave.status = "APPROVED";
    await leave.save();

    const currentYear = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });

    if (balance) {
      balance.used += Number(leave.totalDays);
      balance.remaining -= Number(leave.totalDays);
      await balance.save();
    }
  }

  // ─── NOTIFIKASI APPROVAL CUTI NORMAL ───
  try {
    const approverEmp = await Employee.findOne({ userId: currentUser._id }).lean();
    const requesterEmp = await Employee.findOne({ userId: requester._id }).lean();

    const handlerName = approverEmp?.fullName || currentUser.username || "Atasan";
    const requesterName = requesterEmp?.fullName || "Pegawai";

    if (nextApproverId) {
      // Notif ke pemohon bahwa berkas naik tingkat
      await notificationService.createNotification({
        userId: requester._id,
        senderId: currentUser._id,
        senderName: handlerName,
        title: "Cuti Disetujui (Tahap Lanjutan)",
        text: `Pengajuan cuti Anda disetujui oleh ${handlerName} (Step: ${approval.step}) dan naik ke tingkat ${nextStep}.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });

      // Notif ke pejabat struktural tingkat atasnya
      await notificationService.createNotification({
        userId: nextApproverId,
        senderId: currentUser._id,
        senderName: handlerName,
        title: "Antrean Persetujuan Cuti Baru",
        text: `Berkas pengajuan cuti ${requesterName} masuk ke dalam antrean kerja peninjauan struktural ${nextStep} Anda.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    } else {
      // Notif Persetujuan Mutlak/Final
      await notificationService.createNotification({
        userId: requester._id,
        senderId: currentUser._id,
        senderName: handlerName,
        title: "Pengajuan Cuti Resmi Disetujui Penuh 🎉",
        text: `Selamat! Berkas permohonan cuti Anda selama ${leave.totalDays} hari kerja telah disetujui sepenuhnya oleh jajaran struktural tertinggi.`,
        module: MODULES.LEAVE || "LEAVE",
        referenceId: leave._id,
        actionUrl: `/leave/detail/${leave._id}`,
        type: "LEAVE",
        category: NOTIF_CATEGORIES.INFO,
      });
    }
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi approval cuti:", notifError.message);
  }

  return { type: "STANDARD", leave };
};

export const rejectLeaveService = async ({ id, body, currentUser }) => {
  const { note } = body;

  const approval = await LeaveApproval.findOne({
    _id: id,
    approverId: currentUser._id,
    status: "PENDING",
  });

  if (!approval) {
    const error = new Error("Data usulan persetujuan tidak ditemukan untuk ditolak.");
    error.statusCode = 404;
    throw error;
  }

  approval.status = "REJECTED";
  approval.note = note || "";
  approval.actionDate = new Date();
  await approval.save();

  const leave = await Leave.findByIdAndUpdate(
    approval.leaveId,
    { status: "REJECTED" },
    { returnDocument: "after" }
  );

  // ─── NOTIFIKASI PENOLAKAN CUTI ATASAN ───
  try {
    const approverEmp = await Employee.findOne({ userId: currentUser._id }).lean();
    const handlerName = approverEmp?.fullName || currentUser.username || "Atasan";

    await notificationService.createNotification({
      userId: leave.userId,
      senderId: currentUser._id,
      senderName: handlerName,
      title: "Pengajuan Cuti Ditolak Atasan",
      text: `Pengajuan cuti Anda resmi ditolak oleh ${handlerName} pada tingkat ${approval.step}. Catatan: "${note || "Tidak ada catatan"}"`,
      module: MODULES.LEAVE || "LEAVE",
      referenceId: leave._id,
      actionUrl: `/leave/detail/${leave._id}`,
      type: "LEAVE",
      category: NOTIF_CATEGORIES.INFO,
    });
  } catch (notifError) {
    console.error("Gagal mengirimkan notifikasi reject cuti:", notifError.message);
  }

  return approval;
};

// ─── SERVICE METHOD 23: PUSAT DATA MANAJEMEN KENDALI CUTI ─
export const getManageLeavePageDataService = async ({ currentUser, yearQuery }) => {
  const activeApprovals = await LeaveApproval.find({
    approverId: currentUser._id,
    status: "PENDING",
  });

  const historyApprovals = await LeaveApproval.find({
    approverId: currentUser._id,
    status: { $in: ["APPROVED", "REJECTED"] },
  });

  const activeLeaveIds = activeApprovals.map((a) => a.leaveId);
  const historyLeaveIds = historyApprovals.map((a) => a.leaveId);

  const activeLeaves = await Leave.find({
    _id: { $in: activeLeaveIds },
    status: { $in: ["PENDING", "CANCELLATION_PENDING"] },
  })
    .populate("leaveTypeId", "name")
    .populate({
      path: "userId",
      populate: { path: "employeeData", select: "fullName" },
    })
    .sort({ createdAt: -1 });

  const historyLeaves = await Leave.find({
    _id: { $in: historyLeaveIds },
  })
    .populate("leaveTypeId", "name")
    .populate({
      path: "userId",
      populate: { path: "employeeData", select: "fullName" },
    })
    .sort({ createdAt: -1 });

  const currentYear = new Date().getFullYear();
  const selectedYear = yearQuery ? parseInt(yearQuery) : currentYear;

  const holidays = await Holiday.find({
    $or: [{ year: selectedYear }, { isRecurring: true }],
  }).sort({ date: 1 });

  return {
    activeLeaves,
    historyLeaves,
    holidays,
    selectedYear,
  };
};
