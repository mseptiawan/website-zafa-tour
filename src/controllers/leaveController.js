import Leave from "../models/leave/Leave.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import User from "../models/User.js";
import Holiday from "../models/calender/Holiday.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";

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

    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      if (requester.role === "HR") {
        currentStep = "PIMPINAN";
        const pimpinanUser = await User.findOne({ role: "PIMPINAN" });
        approverId = pimpinanUser ? pimpinanUser._id : null;
      } else if (requester.role === "MANAGER") {
        currentStep = "HR";
        const hrUser = await User.findOne({ role: "HR" });
        approverId = hrUser ? hrUser._id : null;
      } else {
        currentStep = "MANAGER";
        const managerUser = await User.findOne({ role: "MANAGER" });
        approverId = managerUser ? managerUser._id : null;
      }
    }

    if (approverId) {
      await LeaveApproval.create({
        leaveId: newLeave._id,
        step: currentStep,
        approverId,
        status: "PENDING",
      });
    }

    res.redirect("/leave/my-history");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const myLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leaves, balance, holidays] = await Promise.all([
      Leave.find({ userId })
        .populate("leaveTypeId", "name code")
        .populate({
          path: "handoverUserId",
          populate: { path: "employeeData", select: "fullName" },
        })
        .sort({ createdAt: -1 }),
      LeaveBalance.findOne({ userId, year: currentYear }) || {
        totalQuota: 12,
        used: 0,
        remaining: 12,
      },
      Holiday.find({
        date: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31`) },
      }),
    ]);

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

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
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
        // Isi populate untuk virtual employeeData
        populate: {
          path: "employeeData",
          model: "Employee", // Tegaskan nama model target virtualnya
          select: "fullName",
        },
      })
      .sort({ createdAt: 1 });

    // UBAH workflows MENJADI approvals: workflows DI SINI
    res.render("leave/detail", {
      title: "Detail Pengajuan Cuti",
      leave,
      approvals: workflows, // EJS lo bakal ngebaca ini sebagai 'approvals'
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

    await LeaveApproval.deleteMany({ leaveId: leave._id });

    let currentStep = "";
    let approverId = null;

    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      if (requester.role === "HR") {
        currentStep = "PIMPINAN";
        const pimpinanUser = await User.findOne({ role: "PIMPINAN" });
        approverId = pimpinanUser ? pimpinanUser._id : null;
      } else if (requester.role === "MANAGER") {
        currentStep = "HR";
        const hrUser = await User.findOne({ role: "HR" });
        approverId = hrUser ? hrUser._id : null;
      } else {
        currentStep = "MANAGER";
        const managerUser = await User.findOne({ role: "MANAGER" });
        approverId = managerUser ? managerUser._id : null;
      }
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

    // Sesuaikan pengecekan status (pastikan string-nya seragam "PENDING")
    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", {
        message: "Pembatalan gagal. Pengajuan tidak ditemukan atau sudah diproses.",
      });
    }

    // 1. Ubah status induk menjadi CANCELED (Gunakan single 'L' agar singkron dengan filter backend)
    leave.status = "CANCELED";
    await leave.save();

    // 2. PERBAIKAN UTAMA: Jangan di-delete, tapi perbarui status approval-nya
    // Ini agar jejak di timeline tetap terbaca dengan status CANCELED
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
    // 1. Ambil data approval AKTIF (PENDING) yang ditujukan ke user saat ini
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

    // 2. Ambil data RIWAYAT (APPROVED / REJECTED) yang ditujukan ke user saat ini
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

    // 3. PROSES FILTER SINKRONISASI (Fungsi asli tetap dipertahankan):
    // Pastikan data leaveId ada (not null) DAN status cuti utamanya sesuai
    const filteredActive = rawActiveDelegations.filter((del) => {
      return del.leaveId && del.leaveId.status === "PENDING";
    });

    // Untuk riwayat, validasi data leaveId tetap ada
    const filteredHistory = rawHistoryDelegations.filter((del) => {
      return del.leaveId;
    });

    // 4. Kirim kedua data hasil filter ke file EJS
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
    });

    if (!approval) {
      return res.status(404).render("error", {
        message: "Data tidak ditemukan.",
      });
    }

    approval.status = "APPROVED";
    approval.actionDate = new Date();

    // simpan catatan
    approval.note = note || "";

    await approval.save();

    const leave = await Leave.findById(approval.leaveId).populate("userId");

    const requester = leave.userId;

    let nextStep = "";
    let nextApproverId = null;

    if (requester.role === "HR") {
      nextStep = "PIMPINAN";

      const pimpinanUser = await User.findOne({
        role: "PIMPINAN",
      });

      nextApproverId = pimpinanUser?._id;
    } else if (requester.role === "MANAGER") {
      nextStep = "HR";

      const hrUser = await User.findOne({
        role: "HR",
      });

      nextApproverId = hrUser?._id;
    } else {
      nextStep = "MANAGER";

      const managerUser = await User.findOne({
        role: "MANAGER",
      });

      nextApproverId = managerUser?._id;
    }

    if (nextApproverId) {
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    }

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", {
      message: error.message,
    });
  }
};

export const rejectDelegation = async (req, res) => {
  try {
    const { note } = req.body;
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: req.user._id,
      step: "HANDOVER",
    });
    if (!approval) return res.status(404).render("error", { message: "Data tidak ditemukan." });

    approval.status = "REJECTED";
    approval.note = note;
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

// export const processApproval = async (req, res) => {
//   try {
//     const { status, note } = req.body;
//     const approval = await LeaveApproval.findOne({
//       _id: req.params.id,
//       approverId: req.user._id,
//       status: "PENDING",
//     });
//     if (!approval) return res.status(404).render("error", { message: "Data tidak ditemukan." });

//     approval.status = status;
//     approval.note = note;
//     approval.actionDate = new Date();
//     await approval.save();

//     const leave = await Leave.findById(approval.leaveId).populate("userId");
//     const requester = leave.userId;

//     if (status === "REJECTED") {
//       leave.status = "REJECTED";
//       await leave.save();
//       return res.redirect("/leave/approvals");
//     }

//     let nextStep = "";
//     let nextApproverId = null;

//     if (approval.step === "MANAGER") {
//       nextStep = "HR";
//       const hrUser = await User.findOne({ role: "HR" });
//       nextApproverId = hrUser ? hrUser._id : null;
//     } else if (approval.step === "HR") {
//       if (requester.role === "HR") {
//         nextStep = "PIMPINAN";
//         const pimpinanUser = await User.findOne({ role: "PIMPINAN" });
//         nextApproverId = pimpinanUser ? pimpinanUser._id : null;
//       } else {
//         leave.status = "APPROVED";
//         await leave.save();

//         const currentYear = new Date(leave.startDate).getFullYear();
//         const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });
//         if (balance) {
//           balance.used += leave.totalDays;
//           balance.remaining -= leave.totalDays;
//           await balance.save();
//         }
//       }
//     } else if (approval.step === "PIMPINAN") {
//       leave.status = "APPROVED";
//       await leave.save();

//       const currentYear = new Date(leave.startDate).getFullYear();
//       const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });
//       if (balance) {
//         balance.used += leave.totalDays;
//         balance.remaining -= leave.totalDays;
//         await balance.save();
//       }
//     }

//     if (nextApproverId) {
//       await LeaveApproval.create({
//         leaveId: leave._id,
//         step: nextStep,
//         approverId: nextApproverId,
//         status: "PENDING",
//       });
//     }

//     res.redirect("/leave/approvals");
//   } catch (error) {
//     res.status(500).render("error", { message: error.message });
//   }
// };
export const approveLeave = async (req, res) => {
  // logic approve
};

export const rejectLeave = async (req, res) => {
  // logic reject
};
