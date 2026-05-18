import Leave from "../models/leave/Leave.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";
import User from "../models/User.js";
import Holiday from "../models/calender/Holiday.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";

const determineNextStep = (role) => {
  if (role === "KARYAWAN" || role === "KEUANGAN") return "MANAGER";
  if (role === "MANAGER") return "HR";
  if (role === "HR") return "PIMPINAN";
  return "PIMPINAN";
};

export const showApplyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();
    const leaveTypes = await LeaveType.find({ isActive: true });
    const employees = await User.find({ _id: { $ne: userId } }).select("name username");
    const leaveBalance = await LeaveBalance.findOne({ userId, year: currentYear });

    res.render("leave/create", {
      title: "Pengajuan Cuti Baru",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      oldData: undefined,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const { leaveTypeId, startDate, endDate, reason, handoverUserId } = req.body;
    const currentYear = new Date(startDate).getFullYear();

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType || !leaveType.isActive) {
      return res.status(404).json({ success: false, message: "Jenis cuti tidak valid." });
    }

    if (leaveType.requiresAttachment && !req.file) {
      return res.status(400).json({ success: false, message: "Wajib unggah dokumen pendukung!" });
    }

    const documentPath = req.file ? `/uploads/documents/${req.file.filename}` : null;
    let start = new Date(startDate);
    let end = new Date(endDate);

    if (start > end) {
      return res.status(400).json({ success: false, message: "Tanggal tidak valid." });
    }

    const holidays = await Holiday.find({ date: { $gte: start, $lte: end } });
    const holidayStrings = holidays.map((h) => h.date.toISOString().split("T")[0]);

    let totalDays = 0;
    let companyHolidayDays = 0;
    let currentLoopDate = new Date(start);

    while (currentLoopDate <= end) {
      const isSunday = currentLoopDate.getDay() === 0;
      const dateString = currentLoopDate.toISOString().split("T")[0];
      const foundHoliday = holidays.find((h) => h.date.toISOString().split("T")[0] === dateString);

      if (!isSunday) {
        if (foundHoliday) {
          if (foundHoliday.isDeductLeave) {
            companyHolidayDays++;
            totalDays++;
          }
        } else {
          totalDays++;
        }
      }
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    if (totalDays === 0) {
      return res.status(400).json({ success: false, message: "Durasi cuti 0 hari." });
    }

    if (leaveType.isDeductBalance) {
      const balance = await LeaveBalance.findOne({ userId, year: currentYear });
      if (!balance || totalDays > balance.remaining) {
        return res
          .status(400)
          .json({ success: false, message: "Sisa jatah saldo cuti tidak mencukupi." });
      }
    }

    const firstStep = determineNextStep(req.user.role);

    const newLeave = await Leave.create({
      userId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      documentPath,
      handoverUserId,
      status: "PENDING",
      currentApprovalStep: firstStep,
    });

    await LeaveApproval.create({
      leaveId: newLeave._id,
      step: "HANDOVER",
      approverId: handoverUserId,
      status: "PENDING",
    });

    res
      .status(201)
      .json({ success: true, message: "Berhasil diajukan, menunggu konfirmasi handover." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const myLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const leaves = await Leave.find({ userId });
    const balance = (await LeaveBalance.findOne({ userId, year: currentYear })) || {
      totalQuota: 12,
      used: 0,
      remaining: 12,
    };

    const holidays = await Holiday.find({
      date: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
    });
    const totalCompanyHolidays = holidays.filter((h) => h.isDeductLeave).length;

    const pendingApprovalCount = await Leave.countDocuments({ userId, status: "PENDING" });
    const usedPrivateCuti = leaves
      .filter((l) => l.status === "APPROVED")
      .reduce((acc, curr) => acc + curr.totalDays, 0);

    const myHistory = await Leave.find({ userId })
      .populate("leaveTypeId", "name code")
      .populate({
        path: "handoverUserId", // Masuk ke field User
        select: "username",
        populate: {
          path: "employeeData", // Panggil jalan virtual tadi ke tabel Employee
          select: "name", // Ambil field 'name' dari tabel Employee
        },
      })
      .sort({ createdAt: -1 });

    res.render("leave/my-history", {
      title: "Riwayat Cuti Saya",
      leaves: myHistory,
      summary: {
        totalQuota: balance.totalQuota,
        companyHolidays: totalCompanyHolidays,
        usedPrivate: usedPrivateCuti,
        pending: pendingApprovalCount,
        remaining: balance.remaining,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getLeaveDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id)
      .populate("leaveTypeId", "name code requiresAttachment")
      .populate("handoverUserId", "name");

    if (!leave) return res.status(404).render("error", { message: "Data tidak ditemukan" });

    const approvals = await LeaveApproval.find({ leaveId: id })
      .populate("approverId", "name role")
      .sort({ createdAt: 1 });

    res.render("leave/detail", {
      title: "Detail & Timeline Status Cuti",
      leave,
      approvals,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const editLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", { message: "Berkas tidak dapat diedit." });
    }

    const leaveTypes = await LeaveType.find({ isActive: true });
    const employees = await User.find({ _id: { $ne: req.user._id } }).select("name username");
    const leaveBalance = await LeaveBalance.findOne({
      userId: req.user._id,
      year: new Date().getFullYear(),
    });

    res.render("leave/create", {
      title: "Edit Pengajuan Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      oldData: leave,
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave || leave.status !== "PENDING") {
      return res.status(400).json({ success: false, message: "Pengajuan tidak bisa diubah." });
    }

    const { leaveTypeId, startDate, endDate, reason, handoverUserId } = req.body;

    let start = new Date(startDate);
    let end = new Date(endDate);
    const holidays = await Holiday.find({ date: { $gte: start, $lte: end } });
    const holidayStrings = holidays.map((h) => h.date.toISOString().split("T")[0]);

    let totalDays = 0;
    let currentLoopDate = new Date(start);
    while (currentLoopDate <= end) {
      const isSunday = currentLoopDate.getDay() === 0;
      if (!isSunday && !holidayStrings.includes(currentLoopDate.toISOString().split("T")[0])) {
        totalDays++;
      }
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    leave.leaveTypeId = leaveTypeId;
    leave.startDate = start;
    leave.endDate = end;
    leave.totalDays = totalDays;
    leave.reason = reason;
    leave.handoverUserId = handoverUserId;
    if (req.file) {
      leave.documentPath = `/uploads/documents/${req.file.filename}`;
    }

    await leave.save();
    await LeaveApproval.deleteMany({ leaveId: id });
    await LeaveApproval.create({
      leaveId: id,
      step: "HANDOVER",
      approverId: handoverUserId,
      status: "PENDING",
    });

    res.status(200).json({ success: true, message: "Pengajuan berhasil diperbarui." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cancelPendingLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, userId: req.user._id });
    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", { message: "Gagal membatalkan berkas." });
    }
    leave.status = "CANCELLED";
    await leave.save();
    res.redirect("/leave/my");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const requestCancelApprovedLeave = async (req, res) => {
  try {
    const leave = await Leave.findOne({ _id: req.params.id, userId: req.user._id });
    if (!leave || leave.status !== "APPROVED") {
      return res
        .status(400)
        .render("error", { message: "Hanya dokumen approved yang bisa dibatalkan." });
    }

    leave.status = "CANCELLATION_PENDING";
    leave.currentApprovalStep = "PIMPINAN";
    await leave.save();

    await LeaveApproval.create({
      leaveId: leave._id,
      step: "PIMPINAN",
      status: "PENDING",
      note: "Permohonan pembatalan cuti oleh karyawan.",
    });

    res.redirect("/leave/my");
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const showResubmitLeave = async (req, res) => {
  try {
    const oldLeave = await Leave.findById(req.params.id);
    if (!oldLeave || (oldLeave.status !== "REJECTED" && oldLeave.status !== "CANCELLED")) {
      return res.status(400).render("error", { message: "Dokumen tidak bisa di-resubmit." });
    }

    const lastRejectApproval = await LeaveApproval.findOne({
      leaveId: oldLeave._id,
      status: "REJECTED",
    }).sort({ createdAt: -1 });

    const leaveTypes = await LeaveType.find({ isActive: true });
    const employees = await User.find({ _id: { $ne: req.user._id } }).select("name username");
    const leaveBalance = await LeaveBalance.findOne({
      userId: req.user._id,
      year: new Date().getFullYear(),
    });

    res.render("leave/create", {
      title: "Resubmit Pengajuan Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      oldData: oldLeave,
      rejectNote: lastRejectApproval ? lastRejectApproval.note : "Dibatalkan oleh karyawan.",
    });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const myDelegations = async (req, res) => {
  try {
    const delegations = await LeaveApproval.find({
      approverId: req.user._id,
      step: "HANDOVER",
      status: "PENDING",
    }).populate({
      path: "leaveId",
      populate: [
        { path: "userId", select: "name" },
        { path: "leaveTypeId", select: "name" },
      ],
    });
    res.render("leave/delegation", { title: "Delegasi Tugas Saya", delegations });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const approveDelegation = async (req, res) => {
  try {
    const approval = await LeaveApproval.findOne({ _id: req.params.id, approverId: req.user._id });
    if (!approval)
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });

    approval.status = "APPROVED";
    approval.actionDate = new Date();
    await approval.save();

    const leave = await Leave.findById(approval.leaveId).populate("userId");
    const nextStep = leave.currentApprovalStep;

    await LeaveApproval.create({
      leaveId: leave._id,
      step: nextStep,
      status: "PENDING",
    });

    res.redirect("/leave/delegation");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const rejectDelegation = async (req, res) => {
  try {
    const approval = await LeaveApproval.findOne({ _id: req.params.id, approverId: req.user._id });
    if (!approval)
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });

    approval.status = "REJECTED";
    approval.actionDate = new Date();
    await approval.save();

    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });
    res.redirect("/leave/delegation");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const showApprovals = async (req, res) => {
  try {
    const userRole = req.user.role;
    if (userRole === "KARYAWAN" || userRole === "KEUANGAN") {
      return res.status(403).render("error", { message: "Akses ditolak." });
    }

    const pendingApprovals = await LeaveApproval.find({
      step: userRole,
      status: "PENDING",
    }).populate({
      path: "leaveId",
      populate: [
        { path: "userId", select: "name role" },
        { path: "leaveTypeId", select: "name" },
      ],
    });

    res.render("leave/approvals", { title: "Manajemen Approval Cuti", pendingApprovals });
  } catch (error) {
    res.status(500).render("error", { message: error.message });
  }
};

export const processApproval = async (req, res) => {
  try {
    const { status, note } = req.body;
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      step: req.user.role,
      status: "PENDING",
    });
    if (!approval)
      return res.status(404).json({ success: false, message: "Data transaksi tidak ditemukan." });

    approval.status = status;
    approval.note = note;
    approval.actionDate = new Date();
    await approval.save();

    const leave = await Leave.findById(approval.leaveId);

    if (status === "REJECTED") {
      leave.status = "REJECTED";
      await leave.save();
      return res.redirect("/leave/approvals");
    }

    if (leave.status === "CANCELLATION_PENDING") {
      if (req.user.role === "PIMPINAN" && status === "APPROVED") {
        leave.status = "CANCELLED";
        await leave.save();
        await LeaveBalance.findOneAndUpdate(
          { userId: leave.userId, year: new Date(leave.startDate).getFullYear() },
          { $inc: { remaining: leave.totalDays, used: -leave.totalDays } }
        );
      }
      return res.redirect("/leave/approvals");
    }

    const currentStep = req.user.role;
    let nextStep = null;

    if (currentStep === "MANAGER") nextStep = "HR";
    if (currentStep === "HR") nextStep = "PIMPINAN";

    if (nextStep) {
      leave.currentApprovalStep = nextStep;
      await leave.save();
      await LeaveApproval.create({ leaveId: leave._id, step: nextStep, status: "PENDING" });
    } else {
      leave.status = "APPROVED";
      await leave.save();
      await LeaveBalance.findOneAndUpdate(
        { userId: leave.userId, year: new Date(leave.startDate).getFullYear() },
        { $inc: { remaining: -leave.totalDays, used: leave.totalDays } }
      );
    }

    res.redirect("/leave/approvals");
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
