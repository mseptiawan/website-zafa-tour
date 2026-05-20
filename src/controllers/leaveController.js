import Leave from "../models/leave/Leave.model.js";
import LeaveApproval from "../models/leave/LeaveApproval.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import User from "../models/User.js";
import Holiday from "../models/calender/Holiday.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";
import Role from "../models/Role.js";

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
    // PERBAIKAN: Tambahkan properti title agar tidak crash saat error
    return res.status(500).render("error", {
      title: "Kalender Manajemen - Error",
      message: error.message,
    });
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
    // PERBAIKAN UTAMA: Tambahkan title agar layout main.ejs tidak crash saat error database/input
    return res.status(500).render("error", {
      title: "Tambah Agenda - Error",
      message: error.message,
    });
  }
};

export const updateHoliday = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res
        .status(403)
        .json({ success: false, message: "Akses ditolak. Hanya HR yang dapat mengubah kalender." });
    }

    const { id } = req.params;
    const { name, date, endDate, type, isDeductLeave, isRecurring, description } = req.body;

    const parsedDate = new Date(date);
    const year = parsedDate.getFullYear();

    await Holiday.findByIdAndUpdate(id, {
      name,
      date: parsedDate,
      endDate: endDate ? new Date(endDate) : null,
      type,
      isDeductLeave: isDeductLeave === "true" || isDeductLeave === true,
      isRecurring: isRecurring === "true" || isRecurring === true,
      description,
      year,
    });

    res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    res.status(500).render("error", { title: "update holiday error", message: error.message });
  }
};

export const toggleHolidayStatus = async (req, res) => {
  try {
    if (req.user.role !== "HR") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
    }

    // Toggle status (Jika true jadi false, jika false jadi true)
    holiday.isActive = !holiday.isActive;
    await holiday.save();

    res.status(200).json({
      success: true,
      message: `Hari libur berhasil ${holiday.isActive ? "diaktifkan kembali" : "dinonaktifkan (diarsipkan)"}.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
async function getNextApprover(requesterRoleName, currentStep) {
  // Pastikan requesterRoleName berupa string nama rolenya (ex: "STAFF")
  const steps = WORKFLOW[requesterRoleName] || [];

  if (!currentStep || currentStep === "HANDOVER") {
    if (steps.length > 0) {
      const nextStep = steps[0]; // Contoh: "MANAGER"

      // 1. Cari dulu dokumen Role-nya berdasarkan nama string-nya
      const roleDoc = await Role.findOne({ name: nextStep });
      if (!roleDoc) return { nextStep: null, nextApproverId: null };

      // 2. FIX: Ubah 'role' menjadi 'roleId' sesuai skema model User kamu
      const approver = await User.findOne({ roleId: roleDoc._id });

      console.log(
        `DEBUG WORKFLOW - Langkah Berikutnya: ${nextStep}, ID Approver:`,
        approver ? approver._id : "TIDAK KETEMU"
      );

      return { nextStep, nextApproverId: approver ? approver._id : null };
    }
    return { nextStep: null, nextApproverId: null };
  }

  const currentIndex = steps.indexOf(currentStep);
  if (currentIndex !== -1 && currentIndex < steps.length - 1) {
    const nextStep = steps[currentIndex + 1];

    // Lakukan hal yang sama untuk pencarian step berikutnya
    const roleDoc = await Role.findOne({ name: nextStep });
    if (!roleDoc) return { nextStep: null, nextApproverId: null };

    // 2. FIX JUGA DI SINI: Ubah 'role' menjadi 'roleId'
    const approver = await User.findOne({ roleId: roleDoc._id });
    return { nextStep, nextApproverId: approver ? approver._id : null };
  }

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
    res.status(500).render("error", { title: "show apply leave error", message: error.message });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, totalDays, reason, handoverUserId } = req.body;
    const requester = req.session.user;
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
    res.status(500).render("error", { title: "get leave detail err", message: error.message });
  }
};

export const editLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    // Tambahkan .populate() pada Leave.findById agar relasi tipe cutinya terbawa
    const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
      Leave.findById(req.params.id).populate("leaveTypeId"), // <-- Ubah bagian ini
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
    ]);

    if (!leave || leave.status !== "PENDING") {
      return res
        .status(400)
        .render("error", { title: "edit leave", message: "Cuti tidak bisa diubah." });
    }

    res.render("leave/create", {
      title: "Edit Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "EDIT",
      leave,
      error: null,
    });
  } catch (error) {
    res.status(500).render("error", { title: "edit leave", message: error.message });
  }
};
export const updateLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, totalDays, reason, handoverUserId } = req.body;
    const requester = req.user;

    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "PENDING") {
      return res
        .status(400)
        .render("error", { title: "update leave", message: "Gagal update data." });
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
    // PERBAIKAN UTAMA: Tambahkan title agar layout main.ejs tidak crash saat error database/input
    return res.status(500).render("error", {
      title: "Tambah Agenda - Error",
      message: error.message,
    });
  }
};

export const cancelPendingLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave || leave.status !== "PENDING") {
      return res.status(400).render("error", {
        title: "cancel pending error",
        message: "Pembatalan gagal. Pengajuan tidak ditemukan atau sudah diproses.",
      });
    }

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

    res.redirect("/leave/my-history");
  } catch (error) {
    // FIX: Tambahkan title juga di sini
    return res.status(500).render("error", {
      title: "Error Sistem", // <-- WAJIB ADA
      message: error.message,
    });
  }
};

export const requestCancelApprovedLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave || leave.status !== "APPROVED") {
      return res
        .status(400)
        .render("error", { title: "request cancel error", message: "Status cuti tidak valid." });
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
    // PERBAIKAN: Tambahkan title di block catch error
    return res.status(500).render("error", {
      title: "Error Sistem",
      message: error.message,
    });
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
      return res.status(400).render("error", {
        title: "show resubmit error",
        message: "Cuti tidak berstatus ditolak.",
      });
    }

    res.render("leave/create", {
      title: "Ajukan Ulang Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "RESUBMIT",
      leave,
    });
  } catch (error) {
    // PERBAIKAN UTAMA: Tambahkan title di block catch error
    return res.status(500).render("error", {
      title: "Ajukan Ulang - Error",
      message: error.message,
    });
  }
};
export const myDelegations = async (req, res) => {
  try {
    const baseQuery = {
      approverId: req.user._id,
      step: "HANDOVER",
    };

    const [active, history] = await Promise.all([
      LeaveApproval.find({
        ...baseQuery,
        status: "PENDING",
      }).populate({
        path: "leaveId",
        populate: [
          {
            path: "userId",
            model: "User",
            select: "username employeeData",
            populate: {
              path: "employeeData",
              model: "Employee",
              select: "fullName",
            },
          },
          {
            path: "leaveTypeId",
            model: "LeaveType",
            select: "name",
          },
        ],
      }),

      LeaveApproval.find({
        ...baseQuery,
        status: { $in: ["APPROVED", "REJECTED"] },
      }).populate({
        path: "leaveId",
        populate: [
          {
            path: "userId",
            model: "User",
            select: "username employeeData",
            populate: {
              path: "employeeData",
              model: "Employee",
              select: "fullName",
            },
          },
          {
            path: "leaveTypeId",
            model: "LeaveType",
            select: "name",
          },
        ],
      }),
    ]);

    const delegations = active.filter((d) => d.leaveId);
    const historyDelegations = history.filter((d) => d.leaveId);
    console.log(JSON.stringify(delegations[0], null, 2));
    return res.render("leave/delegation", {
      title: "Delegasi Tugas Saya",
      delegations,
      historyDelegations,
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Delegasi Error",
      message: error.message,
    });
  }
};
export const approveDelegation = async (req, res) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res
        .status(401)
        .render("error", { title: "Error", message: "Sesi Anda telah berakhir." });
    }

    // 1. Cari data antrean handover yang sedang PENDING
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id,
      step: "HANDOVER",
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", { title: "Error", message: "Data tidak ditemukan." });
    }

    // 2. Setujui tahap Handover
    approval.status = "APPROVED";
    approval.actionDate = new Date();
    approval.note = note || "";
    await approval.save();

    // 3. Ambil data cuti dan populate field 'roleId' milik pemohon
    const leave = await Leave.findById(approval.leaveId).populate({
      path: "userId",
      populate: { path: "roleId" },
    });

    const requester = leave.userId;

    // PERBAIKAN UTAMA: Gunakan 'roleId' bukan 'role' karena field skema kamu adalah roleId
    const requesterRoleName =
      requester.roleId && requester.roleId.name
        ? requester.roleId.name.toString().trim().toUpperCase()
        : "";

    console.log("DEBUG - BERHASIL MENDAPATKAN ROLE STRUKTURAL:", requesterRoleName);

    // 4. Cari tahapan atasan pertama (misal: MANAGER) setelah HANDOVER sukses
    const { nextStep, nextApproverId } = await getNextApprover(requesterRoleName, "HANDOVER");

    if (nextApproverId) {
      // Jika ditemukan (misal akun Manager ada di database), buat antrean baru
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });
    } else {
      // Jalur pengaman jika memang role tersebut adalah kasta tertinggi (tanpa atasan lagi)
      leave.status = "APPROVED";
      await leave.save();

      const currentYear = new Date(leave.startDate).getFullYear();
      // Menggunakan requester._id karena leave.userId sudah berbentuk objek terpopulasi
      const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });
      if (balance) {
        balance.used += leave.totalDays;
        balance.remaining -= leave.totalDays;
        await balance.save();
      }
    }

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", { title: "Error", message: error.message });
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
    if (!approval)
      return res
        .status(404)
        .render("error", { title: "reject delegation", message: "Data tidak ditemukan." });

    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    res.redirect("/leave/my-delegations");
  } catch (error) {
    res.status(500).render("error", { title: "reject delegation error", message: error.message });
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
    res.status(500).render("error", { title: "show approval error", message: error.message });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { note } = req.body;

    // 1. Ambil data user login dari session (bukan req.user)
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).render("error", {
        title: "Error",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    }

    // 2. Cari data antrean persetujuan (bisa step MANAGER, HR, dll)
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id, // FIX: Pakai sessionUser
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", {
        title: "approve leave",
        message: "Data persetujuan tidak ditemukan atau sudah diproses.",
      });
    }

    // 3. Update status antrean saat ini menjadi APPROVED
    approval.status = "APPROVED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    // 4. FIX POPULATE: Lakukan deep populate sampai ke roleId milik pemohon
    const leave = await Leave.findById(approval.leaveId).populate({
      path: "userId",
      populate: { path: "roleId" },
    });

    const requester = leave.userId;

    // 5. FIX NAMA FIELD: Ambil string nama role dari roleId (contoh: "STAFF")
    const requesterRoleName =
      requester.roleId && requester.roleId.name
        ? requester.roleId.name.toString().trim().toUpperCase()
        : "";

    console.log(
      `DEBUG APPROVE LEAVE - Pemohon: ${requester.username} (${requesterRoleName}), Step Saat Ini: ${approval.step}`
    );

    // 6. Cari tahapan berikutnya di objek WORKFLOW
    // Jika requesterRoleName = "STAFF" dan approval.step = "MANAGER", nextStep harusnya jadi "HR"
    const { nextStep, nextApproverId } = await getNextApprover(requesterRoleName, approval.step);

    if (nextApproverId) {
      // Jika ditemukan approver untuk step berikutnya (misal: user dengan role HR), buat antrean baru
      await LeaveApproval.create({
        leaveId: leave._id,
        step: nextStep,
        approverId: nextApproverId,
        status: "PENDING",
      });

      console.log(`DEBUG WORKFLOW - Berhasil melempar persetujuan ke tahap: ${nextStep}`);
    } else {
      // Jika sudah mencapai ujung alur WORKFLOW (misal selesai di PIMPINAN)
      leave.status = "APPROVED";
      await leave.save();

      // Potong kuota cuti tahunan milik user pemohon
      const currentYear = new Date(leave.startDate).getFullYear();
      const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });
      if (balance) {
        balance.used += leave.totalDays;
        balance.remaining -= leave.totalDays;
        await balance.save();
      }

      console.log(`DEBUG WORKFLOW - Alur selesai. Cuti otomatis FINAL APPROVED.`);
    }

    res.redirect("/leave/manage-requests");
  } catch (error) {
    res.status(500).render("error", { title: "approve leave", message: error.message });
  }
};
export const rejectLeave = async (req, res) => {
  try {
    const { note } = req.body;

    // 1. Ambil data user login dari session (bukan req.user)
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).render("error", {
        title: "Error",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    }

    // 2. Cari data antrean persetujuan yang ditujukan ke user login saat ini
    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id, // FIX: Pakai sessionUser
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", {
        title: "Reject Leave",
        message: "Data persetujuan tidak ditemukan atau sudah diproses.",
      });
    }

    // 3. Ubah status step approval saat ini menjadi REJECTED
    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    // 4. Gagalkan status utama pengajuan (induk) langsung di tabel Leave
    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    console.log(
      `DEBUG REJECT LEAVE - Pengajuan Cuti ID: ${approval.leaveId} berhasil DITOLAK oleh ${sessionUser.username} pada tahap ${approval.step}`
    );

    // 5. FIX REDIRECT: Alihkan ke halaman kelola request yang baru
    return res.redirect("/leave/manage-requests");
  } catch (error) {
    res.status(500).render("error", { title: "Error", message: error.message });
  }
};
export const getManageLeavePage = async (req, res) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.redirect("/?error=UNAUTHORIZED");
    }

    const normalizedRole = (sessionUser.role || "").toString().trim().toUpperCase();
    sessionUser.role = normalizedRole;

    const APPROVER_ROLES = ["MANAGER", "HR", "PIMPINAN", "GENERAL_MANAGER"];

    if (!APPROVER_ROLES.includes(normalizedRole)) {
      return res.redirect("/?error=FORBIDDEN");
    }

    // 1. Ambil SEMUA data approval milik user ini berdasarkan approverId atau role-nya (selain HANDOVER)
    const myStructuralApprovals = await LeaveApproval.find({
      $or: [
        { approverId: sessionUser._id },
        { step: normalizedRole }, // Jaga-jaga jika approverId belum di-set di awal, kita filter via step/role
      ],
      step: { $ne: "HANDOVER" },
    });

    const activeLeaveIds = [];
    const historyLeaveIds = [];

    // 2. Lakukan validasi antrean berantai secara ketat
    for (const app of myStructuralApprovals) {
      if (app.status === "PENDING") {
        // --- GERBANG 1: JIKA SAYA MANAGER, CEK HANDOVER ---
        if (app.step === "MANAGER") {
          const handoverCheck = await LeaveApproval.findOne({
            leaveId: app.leaveId,
            step: "HANDOVER",
          });

          // hanya blok kalau handover ADA tapi belum approve
          if (handoverCheck && handoverCheck.status !== "APPROVED") {
            continue;
          }
        }

        // --- GERBANG 2: JIKA SAYA HR, CEK MANAGER ---
        if (app.step === "HR") {
          const managerCheck = await LeaveApproval.findOne({
            leaveId: app.leaveId,
            step: "MANAGER",
          });
          // Jika manager belum approve (atau reject), HR belum boleh lihat
          if (managerCheck && managerCheck.status !== "APPROVED") {
            continue;
          }
        }

        // --- GERBANG 3: JIKA SAYA PIMPINAN / GM, CEK HR ---
        if (app.step === "PIMPINAN" || app.step === "GENERAL_MANAGER") {
          const hrCheck = await LeaveApproval.findOne({
            leaveId: app.leaveId,
            step: "HR",
          });
          // Jika HR belum approve, Pimpinan/GM belum boleh lihat
          if (hrCheck && hrCheck.status !== "APPROVED") {
            continue;
          }
        }

        // Jika lolos semua sensor antrean di atas, baru masuk ke tab Aktif
        activeLeaveIds.push(app.leaveId);
      } else {
        // Jika statusnya sudah APPROVED/REJECTED oleh user ini, langsung masuk ke riwayat
        historyLeaveIds.push(app.leaveId);
      }
    }

    // 3. Ambil data Leave untuk Tab Aktif (Hanya yang lolos sensor antrean)
    const activeLeaves = await Leave.find({
      _id: { $in: activeLeaveIds },
      status: "PENDING", // Memastikan cutinya sendiri memang belum konklusi/selesai
    })
      .populate("leaveTypeId", "name")
      .populate({
        path: "userId",
        populate: { path: "employeeData", select: "fullName" },
      })
      .sort({ createdAt: -1 });

    // 4. Ambil data Leave untuk Tab Riwayat
    const historyLeaves = await Leave.find({
      _id: { $in: historyLeaveIds },
    })
      .populate("leaveTypeId", "name")
      .populate({
        path: "userId",
        populate: { path: "employeeData", select: "fullName" },
      })
      .sort({ createdAt: -1 });

    // Kalender
    const currentYear = new Date().getFullYear();
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    return res.render("leave/manage-center", {
      title: "Pusat Manajemen Cuti",
      user: sessionUser,
      activeLeaves,
      historyLeaves,
      holidays,
      selectedYear,
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Pusat Manajemen Cuti - Error",
      message: error.message,
    });
  }
};
