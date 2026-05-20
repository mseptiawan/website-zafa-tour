import Leave from "../models/leave/Leave.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import User from "../models/User.js";
import Holiday from "../models/calender/Holiday.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";

// Definisi Alur Persetujuan berdasarkan Role Pemohon
const WORKFLOW = {
  STAFF: ["MANAGER", "HR"],
  KEUANGAN: ["MANAGER", "HR"],
  MANAGER: ["HR"],
  GENERAL_MANAGER: ["HR"],
  HR: ["PIMPINAN"],
  PIMPINAN: [],
};
export const getHolidaysPage = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter data pengajuan agar approver hanya melihat data yang melibatkan mereka
    if (["MANAGER", "HR", "PIMPINAN"].includes(userRole)) {
      const structuralApprovals = await LeaveApproval.find({ approverId: req.user._id });
      const leaveIds = structuralApprovals.map((app) => app.leaveId);
      query = { _id: { $in: leaveIds } };
    }

    // 1. Ambil data pengajuan cuti masal
    const allLeaves = await Leave.find(query)
      .populate("leaveTypeId", "name")
      .populate({ path: "userId", populate: { path: "employeeData", select: "fullName" } })
      .sort({ createdAt: -1 });

    // Pisahkan data pengajuan aktif vs selesai
    const activeLeaves = allLeaves.filter((leave) => leave.status === "PENDING");
    const historyLeaves = allLeaves.filter((leave) => leave.status !== "PENDING");

    // 2. Ambil data Kalender Libur (untuk tahun ini)
    const currentYear = new Date().getFullYear();
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    // SOLUSI: Arahkan ke file views/leave/manage-center.ejs yang menyatukan semua tab
    res.render("leave/manage-center", {
      title: "Pusat Manajemen Cuti",
      user: req.user,
      activeLeaves,
      historyLeaves,
      holidays,
      selectedYear,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

// Menambahkan Hari Libur / Cuti Bersama baru
export const createHoliday = async (req, res) => {
  try {
    const { name, date, endDate, type, isDeductLeave, isRecurring, description } = req.body;

    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();

    await Holiday.create({
      name,
      date: parsedDate,
      endDate: endDate ? new Date(endDate) : null,
      type,
      isDeductLeave: isDeductLeave === "true" || isDeductLeave === true,
      isRecurring: isRecurring === "true" || isRecurring === true,
      description,
      year,
    });

    // SOLUSI: Setelah submit form, kembalikan (redirect) ke endpoint utama halaman pusat manajemen
    res.redirect("/leave/manage-calendar");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

// Menghapus data hari libur
export const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Hari libur berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Helper untuk mencari langkah persetujuan berikutnya setelah langkah saat ini selesai
async function getNextApprover(requesterRole, currentStep) {
  const steps = WORKFLOW[requesterRole] || [];

  // Jika saat ini belum masuk ke workflow struktural (misal baru kelar HANDOVER), ambil langkah pertama
  if (!currentStep || currentStep === "HANDOVER") {
    if (steps.length > 0) {
      const nextStep = steps[0];
      const approver = await User.findOne({ role: nextStep });
      return { nextStep, nextApproverId: approver ? approver._id : null };
    }
    return { nextStep: null, nextApproverId: null };
  }

  // Jika sedang berjalan di dalam roda WORKFLOW, cari indeks langkah berikutnya
  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex !== -1 && currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1];
    const approver = await User.findOne({ role: nextStep });
    return { nextStep, nextApproverId: approver ? approver._id : null };
  }

  // Jika sudah berada di ujung array langkah persetujuan
  return { nextStep: null, nextApproverId: null };
}

export const showApplyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leaveTypes, employees, leaveBalance] = await Promise.all([
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    res.render("leave/create", {
      title: "Pengajuan Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "CREATE",
      leave: null,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, totalDays, reason, handoverUserId } = req.body;
    const requester = req.user;
    const documentPath = req.file ? `/uploads/files/${req.file.filename}` : null;

    const newLeave = await Leave.create({
      userId: requester._id,
      leaveTypeId,
      startDate,
      endDate,
      totalDays,
      reason,
      documentPath,
      handoverUserId: handoverUserId || null,
      status: "PENDING",
    });

    let currentStep = "";
    let approverId = null;

    // Jika ada tugas mandatoris penyerahan berkas (Handover)
    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      // Jika tanpa handover, langsung cari tahapan pertama berdasarkan rule WORKFLOW
      const { nextStep, nextApproverId } = await getNextApprover(requester.role, null);
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
      // Skenario khusus jika role tersebut tidak butuh persetujuan sama sekali (ex: PIMPINAN)
      newLeave.status = "APPROVED";
      await newLeave.save();

      const currentYear = new Date(startDate).getFullYear();
      const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });
      if (balance) {
        balance.used += Number(totalDays);
        balance.remaining -= Number(totalDays);
        await balance.save();
      }
    }

    res.redirect("/leave/my-history");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const myLeave = async (req, res) => {
  try {
    const userId = req.user._id;
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

    res.render("leave/my-history", {
      title: "Riwayat Cuti",
      leaves,
      summary: {
        totalQuota: balance.totalQuota,
        companyHolidays: totalCompanyHolidays,
        usedPrivate: usedPrivateCuti,
        pending: pendingApprovalCount,
        remaining: balance.remaining,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const getLeaveDetail = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate("leaveTypeId", "name")
      .populate({ path: "userId", populate: { path: "employeeData", select: "fullName" } })
      .populate({ path: "handoverUserId", populate: { path: "employeeData", select: "fullName" } });

    const workflows = await LeaveApproval.find({ leaveId: req.params.id })
      .populate({
        path: "approverId",
        populate: {
          path: "employeeData",
          model: "Employee",
          select: "fullName",
        },
      })
      .sort({ createdAt: 1 });

    res.render("leave/detail", {
      title: "Detail Pengajuan Cuti",
      leave,
      approvals: workflows,
      user: req.user,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const editLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
      Leave.findById(req.params.id),
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", { message: "Cuti tidak bisa diubah." });
    }

    res.render("leave/form-page", {
      title: "Edit Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "EDIT",
      leave,
      error: null,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const updateLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, totalDays, reason, handoverUserId } = req.body;
    const requester = req.user;

    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", { message: "Gagal update data." });
    }

    leave.leaveTypeId = leaveTypeId;
    leave.startDate = startDate;
    leave.endDate = endDate;
    leave.totalDays = totalDays;
    leave.reason = reason;
    leave.handoverUserId = handoverUserId || null;
    await leave.save();

    // Hapus alur approval lama untuk dibuild ulang
    await LeaveApproval.deleteMany({ leaveId: leave._id });

    let currentStep = "";
    let approverId = null;

    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      const { nextStep, nextApproverId } = await getNextApprover(requester.role, null);
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

    res.redirect("/leave/my-history");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const cancelPendingLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", {
        message: "Pembatalan gagal. Pengajuan tidak ditemukan atau sudah diproses.",
      });
    }

    leave.status = "CANCELED";
    await leave.save();

    await LeaveApproval.updateMany(
      { leaveId: leave._id, status: "PENDING" },
      {
        status: "CANCELED",
        note: "Dibatalkan oleh pemohon",
        actionDate: new Date(),
      }
    );

    res.redirect("/leave/my-history");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const requestCancelApprovedLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "APPROVED") {
      return res.status(400).render("error", { message: "Status cuti tidak valid." });
    }

    leave.status = "CANCELLED";
    await leave.save();

    const currentYear = new Date(leave.startDate).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });
    if (balance) {
      balance.used -= leave.totalDays;
      balance.remaining += leave.totalDays;
      await balance.save();
    }

    res.redirect("/leave/my-history");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const showResubmitLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
      Leave.findById(req.params.id),
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    if (!leave || leave.status !== "REJECTED") {
      return res.status(400).render("error", { message: "Cuti tidak berstatus ditolak." });
    }

    res.render("leave/form-page", {
      title: "Ajukan Ulang Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "RESUBMIT",
      leave,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const myDelegations = async (req, res) => {
  try {
    const rawActiveDelegations = await LeaveApproval.find({
      approverId: req.user._id,
      step: "HANDOVER",
      status: "PENDING",
    }).populate({
      path: "leaveId",
      populate: [
        { path: "userId", populate: { path: "employeeData", select: "fullName" } },
        { path: "leaveTypeId", select: "name" },
      ],
    });

    const rawHistoryDelegations = await LeaveApproval.find({
      approverId: req.user._id,
      step: "HANDOVER",
      status: { $in: ["APPROVED", "REJECTED"] },
    }).populate({
      path: "leaveId",
      populate: [
        { path: "userId", populate: { path: "employeeData", select: "fullName" } },
        { path: "leaveTypeId", select: "name" },
      ],
    });

    const filteredActive = rawActiveDelegations.filter(
      (del) => del.leaveId && del.leaveId.status === "PENDING"
    );
    const filteredHistory = rawHistoryDelegations.filter((del) => del.leaveId);

    res.render("leave/delegation", {
      title: "Delegasi Tugas Saya",
      delegations: filteredActive,
      historyDelegations: filteredHistory,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const approveDelegation = async (req, res) => {
  try {
    const { note } = req.body;

    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: req.user._id,
      step: "HANDOVER",
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", { message: "Data tidak ditemukan." });
    }

    approval.status = "APPROVED";
    approval.actionDate = new Date();
    approval.note = note || "";
    await approval.save();

    const leave = await Leave.findById(approval.leaveId).populate("userId");
    const requester = leave.userId;

    // Setelah HANDOVER disetujui, tentukan langkah struktural pertama berdasarkan role pemohon
    const { nextStep, nextApproverId } = await getNextApprover(requester.role, "HANDOVER");

    if (nextApproverId) {
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    } else {
      // Jika ternyata role pemohon tidak punya alur lanjutan setelah handover
      leave.status = "APPROVED";
      await leave.save();

      const currentYear = new Date(leave.startDate).getFullYear();
      const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });
      if (balance) {
        balance.used += leave.totalDays;
        balance.remaining -= leave.totalDays;
        await balance.save();
      }
    }

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const rejectDelegation = async (req, res) => {
  try {
    const { note } = req.body;
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: req.user._id,
      step: "HANDOVER",
      status: "PENDING",
    });
    if (!approval) return res.status(404).render("error", { message: "Data tidak ditemukan." });

    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const showApprovals = async (req, res) => {
  try {
    const approvals = await LeaveApproval.find({
      approverId: req.user._id,
      step: { $in: ["MANAGER", "HR", "PIMPINAN"] },
      status: "PENDING",
    }).populate({
      path: "leaveId",
      populate: [
        { path: "userId", populate: { path: "employeeData", select: "fullName" } },
        { path: "leaveTypeId", select: "name" },
      ],
    });

    res.render("leave/approvals", { title: "Persetujuan Cuti Karyawan", approvals });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { note } = req.body;

    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: req.user._id,
      status: "PENDING",
    });

    if (!approval)
      return res.status(404).render("error", { message: "Data persetujuan tidak ditemukan." });

    approval.status = "APPROVED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    const leave = await Leave.findById(approval.leaveId).populate("userId");
    const requester = leave.userId;

    // Cari langkah berikutnya berdasarkan fungsi helper WORKFLOW kita
    const { nextStep, nextApproverId } = await getNextApprover(requester.role, approval.step);

    if (nextApproverId) {
      // Jika ada approver selanjutnya, buat record baru bertipe PENDING
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    } else {
      // Jika sudah tidak ada langkah lagi di objek WORKFLOW, ubah status induk menjadi APPROVED
      leave.status = "APPROVED";
      await leave.save();

      // Potong kuota cuti tahunan milik user
      const currentYear = new Date(leave.startDate).getFullYear();
      const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });
      if (balance) {
        balance.used += leave.totalDays;
        balance.remaining -= leave.totalDays;
        await balance.save();
      }
    }

    res.redirect("/leave/approvals");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    const { note } = req.body;

    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: req.user._id,
      status: "PENDING",
    });

    if (!approval)
      return res.status(404).render("error", { message: "Data persetujuan tidak ditemukan." });

    // 1. Ubah status step approval saat ini menjadi REJECTED
    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    // 2. Gagalkan status utama pengajuan (induk) langsung tanpa lanjut alur berikutnya
    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    res.redirect("/leave/approvals");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};
export const getManageLeavePage = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    // Filter data pengajuan agar approver hanya melihat data yang melibatkan mereka
    if (["MANAGER", "HR", "PIMPINAN"].includes(userRole)) {
      const structuralApprovals = await LeaveApproval.find({ approverId: req.user._id });
      const leaveIds = structuralApprovals.map((app) => app.leaveId);
      query = { _id: { $in: leaveIds } };
    }

    // 1. Ambil data pengajuan cuti masal
    const allLeaves = await Leave.find(query)
      .populate("leaveTypeId", "name")
      .populate({ path: "userId", populate: { path: "employeeData", select: "fullName" } })
      .sort({ createdAt: -1 });

    // Pisahkan data pengajuan aktif vs selesai
    const activeLeaves = allLeaves.filter((leave) => leave.status === "PENDING");
    const historyLeaves = allLeaves.filter((leave) => leave.status !== "PENDING");

    // 2. Ambil data Kalender Libur (untuk tahun ini)
    const currentYear = new Date().getFullYear();
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    // 3. Render satu halaman tunggal membawa seluruh payload data
    res.render("leave/manage-center", {
      title: "Pusat Manajemen Cuti",
      user: req.user,
      activeLeaves,
      historyLeaves,
      holidays,
      selectedYear,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};
