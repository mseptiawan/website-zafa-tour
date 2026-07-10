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

async function getManagerByBidang(userId) {
  const employee = await Employee.findOne({ userId });

  if (!employee) {
    return getWakilDirektur();
  }

  const career = await EmployeeCareer.findOne({
    employee_id: employee._id,
  });

  if (!career?.bidangId) {
    return getWakilDirektur();
  }

  const bidang = await Bidang.findById(career.bidangId).populate("managerRoleId");

  if (!bidang?.managerRoleId) {
    return getWakilDirektur();
  }

  const roleDoc = await Role.findOne({
    name: bidang.managerRoleId.name,
  });

  if (!roleDoc) {
    return getWakilDirektur();
  }

  const managerUser = await User.findOne({
    roleId: roleDoc._id,
  });

  if (!managerUser) {
    return getWakilDirektur();
  }

  return {
    step: bidang.managerRoleId.name,
    approverId: managerUser._id,
  };
}

async function getWakilDirektur() {
  const role = await Role.findOne({
    name: "WAKIL_DIREKTUR",
  });

  if (!role) {
    throw new Error("Role WAKIL_DIREKTUR tidak ditemukan");
  }

  const user = await User.findOne({
    roleId: role._id,
  });

  if (!user) {
    throw new Error("User WAKIL_DIREKTUR tidak ditemukan");
  }

  return {
    step: "WAKIL_DIREKTUR",
    approverId: user._id,
  };
}

const WORKFLOW = {
  PEGAWAI: ["MANAGER_BIDANG", "WAKIL_DIREKTUR"],
  MANAGER_HAJI_UMRAH: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"],
  MANAGER_KEUANGAN: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"],
  MANAGER_ADMINISTRASI: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"],
  WAKIL_DIREKTUR: ["DIREKTUR_UTAMA"],
  DIREKTUR_UTAMA: [],
};

const calculateWorkDays = async (start, end) => {
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

export const calculateLeaveDays = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Parameter tanggal tidak lengkap",
      });
    }
    const totalDays = await calculateWorkDays(startDate, endDate);

    return res.status(200).json({
      success: true,
      totalDays: totalDays,
    });
  } catch (error) {
    console.error("Error calculating leave days:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
export const getHolidaysPage = async (req, res) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (["MANAGER_ADMINISTRASI", "WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(userRole)) {
      const structuralApprovals = await LeaveApproval.find({ approverId: req.user._id });
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
    const selectedYear = req.query.year ? parseInt(req.query.year) : currentYear;

    const holidays = await Holiday.find({
      $or: [{ year: selectedYear }, { isRecurring: true }],
    }).sort({ date: 1 });

    res.render("leave/manage-center", {
      title: "Pusat Manajemen Cuti",
      user: req.user,
      activeLeaves,
      historyLeaves,
      holidays,
      selectedYear,
    });
  } catch (error) {
    return res.status(500).render("error", {
      title: "Kalender Manajemen - Error",
      message: error.message,
    });
  }
};

export const createHoliday = async (req, res) => {
  try {
    const { name, date, endDate, type, isDeductLeave, description } = req.body;

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
      console.log(
        `Mendeteksi Cuti Baru [${name}] memotong kuota. Memperbarui saldo seluruh Pegawai tahun ${year}...`
      );

      await LeaveBalance.updateMany(
        { year: year },
        {
          $inc: { remaining: -1, used: 1 },
        }
      );
    }

    return res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    console.error("Error Create Holiday:", error);
    return res.status(500).render("error", {
      title: "Tambah Agenda - Error",
      message: error.message,
    });
  }
};

export const updateHoliday = async (req, res) => {
  try {
    if (req.user.role !== "WAKIL_DIREKTUR") {
      return res
        .status(403)
        .json({ success: false, message: "Akses ditolak. Hanya HR yang dapat mengubah kalender." });
    }

    const { id } = req.params;
    const { name, date, endDate, type, isDeductLeave, description } = req.body;

    const oldHoliday = await Holiday.findById(id);
    if (!oldHoliday) {
      return res
        .status(404)
        .render("error", { title: "Error", message: "Agenda tidak ditemukan." });
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

    await Holiday.findByIdAndUpdate(id, {
      name,
      date: parsedStartDate,
      endDate: endDate ? parsedEndDate : null,
      type,
      isDeductLeave: finalIsDeductLeave,
      description,
      year,
    });

    return res.redirect("/leave/manage-calendar?tab=calendar");
  } catch (error) {
    console.error("Error Update Holiday:", error);
    return res
      .status(500)
      .render("error", { title: "update holiday error", message: error.message });
  }
};

export const toggleHolidayStatus = async (req, res) => {
  try {
    if (req.user.role !== "WAKIL_DIREKTUR") {
      return res.status(403).json({ success: false, message: "Akses ditolak." });
    }

    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) {
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });
    }

    const start = new Date(holiday.date);
    const end = holiday.endDate ? new Date(holiday.endDate) : new Date(holiday.date);
    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const targetStatus = !holiday.isActive;

    if (holiday.isDeductLeave === true) {
      if (holiday.isActive === true && targetStatus === false) {
        console.log(
          `Mengarsipkan agenda [${holiday.name}]. Me-refund ${totalDays} hari ke Pegawai...`
        );
        await LeaveBalance.updateMany(
          { year: holiday.year },
          { $inc: { remaining: totalDays, used: -totalDays } }
        );
      } else if (holiday.isActive === false && targetStatus === true) {
        console.log(
          ` Mengaktifkan kembali [${holiday.name}]. Memotong kembali ${totalDays} hari dari Pegawai...`
        );
        await LeaveBalance.updateMany(
          { year: holiday.year },
          { $inc: { remaining: -totalDays, used: totalDays } }
        );
      }
    }

    holiday.isActive = targetStatus;
    await holiday.save();

    return res.status(200).json({
      success: true,
      message: `Hari libur berhasil ${holiday.isActive ? "diaktifkan kembali" : "dinonaktifkan (diarsipkan)"}.`,
    });
  } catch (error) {
    console.error("Error Toggle Holiday Status:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    await Holiday.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Hari libur berhasil dihapus." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generateOrResetLeaveBalance = async (req, res) => {
  try {
    const selectedYear = req.body.year ? parseInt(req.body.year) : new Date().getFullYear();
    const DEFAULT_LEAVE_QUOTA = 12;

    console.log(
      ` Memulai proses Generate/Reset Saldo Cuti untuk seluruh Pegawai di tahun ${selectedYear}...`
    );

    const activeEmployees = await User.find({ status: "Active" });

    if (activeEmployees.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Tidak ada Pegawai dengan status Active ditemukan.",
      });
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
          totalDeductedDays++;
        }
        loop.setDate(loop.getDate() + 1);
      }
    });

    console.log(
      `Ditemukan total ${totalDeductedDays} hari cuti bersama (memotong kuota) di tahun ${selectedYear}.`
    );

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
          {
            userId: employee._id,
            year: selectedYear,
          },
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
          {
            upsert: true,
            returnDocument: "after",
          }
        );
      })
    );

    return res.redirect(`/leave/manage-requests?tab=balances&status=success&year=${selectedYear}`);
  } catch (error) {
    console.error("Error Generate/Reset Leave Balance:", error);
    return res.status(500).render("error", {
      title: "Reset Saldo - Error",
      message: error.message,
    });
  }
};

async function getNextApprover(requesterRoleName, currentStep) {
  const steps = WORKFLOW[requesterRoleName] || [];

  if (!currentStep || currentStep === "HANDOVER") {
    if (steps.length > 0) {
      const nextStep = steps[0];

      const roleDoc = await Role.findOne({ name: nextStep });
      if (!roleDoc) return { nextStep: null, nextApproverId: null };

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

    const roleDoc = await Role.findOne({ name: nextStep });
    if (!roleDoc) return { nextStep: null, nextApproverId: null };

    const approver = await User.findOne({ roleId: roleDoc._id });
    return { nextStep, nextApproverId: approver ? approver._id : null };
  }

  return { nextStep: null, nextApproverId: null };
}

export const showApplyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const currentYear = new Date().getFullYear();

    const [leaveTypes, employees, leaveBalance, employee] = await Promise.all([
      LeaveType.find({ isActive: true }),
      User.find({ _id: { $ne: userId } }).populate("employeeData", "fullName"),
      LeaveBalance.findOne({ userId, year: currentYear }),
      Employee.findOne({ userId }).select("jenis_kelamin"),
    ]);

    res.render("leave/create", {
      title: "Pengajuan Cuti",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
      mode: "CREATE",
      leave: null,
      employee,
    });
  } catch (error) {
    res.status(500).render("error", { title: "show apply leave error", message: error.message });
  }
};
export const applyLeave = async (req, res) => {
  try {
    const { leaveTypeId, startDate, endDate, reason, handoverUserId } = req.body;
    const requester = req.session.user;
    const documentPath = req.file ? `/uploads/files/${req.file.filename}` : null;

    const leaveTypes = await LeaveType.find({});
    const employees = await Employee.find({});
    const currentYear = new Date(startDate || Date.now()).getFullYear();
    const balance = await LeaveBalance.findOne({ userId: requester._id, year: currentYear });

    const renderWithError = (errorMessage) => {
      return res.status(400).render("leave/create", {
        title: "Input Pengajuan Cuti",
        mode: "CREATE",
        error: errorMessage,
        leaveTypes,
        employees,
        leaveBalance: balance || { remaining: 0 },
        leave: { leaveTypeId, startDate, endDate, reason, handoverUserId, totalDays: 0 },
        employee: requester,
      });
    };

    const finalTotalDays = await calculateWorkDays(startDate, endDate);

    if (finalTotalDays === 0) {
      return renderWithError(
        "Pengajuan ditolak. Semua tanggal yang Anda pilih adalah hari libur atau cuti bersama."
      );
    }

    if (!balance || balance.remaining < finalTotalDays) {
      return renderWithError("Saldo cuti tidak mencukupi untuk durasi tersebut.");
    }

    const newLeave = await Leave.create({
      userId: requester._id,
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

      if (requester.role === "PEGAWAI") {
        const manager = await getManagerByBidang(requester._id);
        nextStep = manager.step;
        nextApproverId = manager.approverId;
      } else {
        const workflow = await getNextApprover(requester.role, null);
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

      balance.used += Number(finalTotalDays);
      balance.remaining -= Number(finalTotalDays);
      await balance.save();
    }

    return res.redirect("/leave/me");
  } catch (error) {
    console.error("Error pada applyLeave:", error);
    return res.status(500).render("leave/apply-form", {
      title: "Input Pengajuan Cuti",
      mode: "CREATE",
      error: "Internal server error. Silahkan coba beberapa saat lagi.",
      leaveTypes: [],
      employees: [],
      leaveBalance: { remaining: 0 },
      leave: null,
      employee: null,
    });
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

    res.render("leave/history", {
      title: "Riwayat Cuti",
      leaves,
      holidays,
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
      .populate({
        path: "userId",
        populate: [
          {
            path: "employeeData",
            select: "fullName",
            populate: {
              path: "careerData",
              select: "unitId",
              populate: {
                path: "unitId",
                select: "name",
              },
            },
          },
          {
            path: "leaveBalanceData",
          },
        ],
      })
      .populate({
        path: "handoverUserId",
        populate: {
          path: "employeeData",
          select: "fullName",
        },
      });

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

    const [leave, leaveTypes, employees, leaveBalance] = await Promise.all([
      Leave.findById(req.params.id).populate("leaveTypeId"),
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

    await LeaveApproval.deleteMany({ leaveId: leave._id });

    let currentStep = "";
    let approverId = null;

    if (handoverUserId) {
      currentStep = "HANDOVER";
      approverId = handoverUserId;
    } else {
      let nextStep;
      let nextApproverId;

      if (requester.role === "PEGAWAI") {
        const manager = await getManagerByBidang(requester._id);

        nextStep = manager.step;
        nextApproverId = manager.approverId;
      } else {
        const workflow = await getNextApprover(requester.role, null);

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

    res.redirect("/leave/me");
  } catch (error) {
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
      req.flash("error", "Pembatalan gagal. Pengajuan tidak ditemukan atau sudah diproses.");

      return res.redirect("/leave/me");
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

    req.flash("success", "Pengajuan cuti berhasil dibatalkan.");

    return res.redirect("/leave/me");
  } catch (error) {
    console.error(error);

    req.flash("error", "Terjadi kesalahan sistem saat membatalkan pengajuan cuti.");

    return res.redirect("/leave/me");
  }
};

export const requestCancelApprovedLeave = async (req, res) => {
  try {
    const { reason } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.redirect("/?error=SESSION_EXPIRED");
    }

    const leave = await Leave.findOne({
      _id: req.params.id,
      userId: sessionUser._id,
      status: "APPROVED",
    });

    if (!leave) {
      return res.status(404).render("error", {
        title: "Error Pembatalan",
        message: "Data cuti tidak ditemukan atau tidak valid untuk dibatalkan.",
      });
    }

    leave.status = "CANCELLATION_PENDING";
    await leave.save();

    await LeaveCancellation.create({
      leaveId: leave._id,
      requestedBy: sessionUser._id,
      cancelReason: reason || "Mengajukan pembatalan cuti.",
      status: "PENDING",
    });

    const userRole = (sessionUser.role || "").toString().trim().toUpperCase();

    let targetStep = null;
    let targetApproverId = null;

    if (userRole === "PEGAWAI") {
      const manager = await getManagerByBidang(sessionUser._id);

      if (!manager || !manager.approverId) {
        return res.status(500).render("error", {
          title: "Workflow Error",
          message: "Manager bidang belum dikonfigurasi.",
        });
      }

      targetStep = manager.step;
      targetApproverId = manager.approverId;
    } else if (
      ["MANAGER_ADMINISTRASI", "MANAGER_KEUANGAN", "MANAGER_HAJI_UMRAH"].includes(userRole)
    ) {
      targetStep = "WAKIL_DIREKTUR";
    } else if (userRole === "WAKIL_DIREKTUR") {
      targetStep = "DIREKTUR_UTAMA";
    } else if (userRole === "DIREKTUR_UTAMA") {
      targetStep = null;
    }

    if (!targetApproverId && targetStep) {
      const roleDoc = await Role.findOne({
        name: targetStep,
      });

      if (!roleDoc) {
        return res.status(500).render("error", {
          title: "Error Sistem Workflow",
          message: `Role ${targetStep} tidak ditemukan.`,
        });
      }

      const approver = await User.findOne({
        roleId: roleDoc._id,
      });

      if (!approver) {
        return res.status(500).render("error", {
          title: "Error Sistem Workflow",
          message: `User untuk role ${targetStep} belum tersedia.`,
        });
      }

      targetApproverId = approver._id;
    }

    if (!targetStep || !targetApproverId) {
      leave.status = "CANCELLED";
      await leave.save();

      await LeaveCancellation.findOneAndUpdate(
        {
          leaveId: leave._id,
          status: "PENDING",
        },
        {
          status: "APPROVED",
        }
      );

      const currentYear = new Date(leave.startDate).getFullYear();

      const balance = await LeaveBalance.findOne({
        userId: sessionUser._id,
        year: currentYear,
      });

      if (balance) {
        balance.used -= Number(leave.totalDays);
        balance.remaining += Number(leave.totalDays);
        await balance.save();
      }

      return res.redirect("/leave/me");
    }

    await LeaveApproval.create({
      leaveId: leave._id,
      step: targetStep,
      approverId: targetApproverId,
      status: "PENDING",
      note: reason || "Mengajukan pembatalan cuti.",
    });

    return res.redirect("/leave/me");
  } catch (error) {
    console.error("Error pada requestCancelApprovedLeave:", error);

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

    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id,
      step: "HANDOVER",
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", { title: "Error", message: "Data tidak ditemukan." });
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

    // =========================================================================
    // PERBAIKAN ALUR DELEGASI: PENENTUAN APPROVER BERIKUTNYA SETELAH HANDOVER
    // =========================================================================

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
      console.log(`[DELEGASI APPROVED] Berkas Pegawai diteruskan ke Step: ${nextStep}`);
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

    res.redirect("/leave/my-delegations");
  } catch (error) {
    console.error("Error pada approveDelegation:", error);
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

    res.render("leave/approvals", { title: "Persetujuan Cuti Pegawai", approvals, employee });
  } catch (error) {
    res.status(500).render("error", { title: "show approval error", message: error.message });
  }
};

export const approveLeave = async (req, res) => {
  try {
    const { note } = req.body;
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).render("error", {
        title: "Error",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    }

    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id,
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", {
        title: "approve leave",
        message: "Data persetujuan tidak ditemukan atau sudah diproses.",
      });
    }

    approval.status = "APPROVED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    const leave = await Leave.findById(approval.leaveId).populate({
      path: "userId",
      populate: {
        path: "roleId",
      },
    });

    const requester = leave.userId;

    const requesterRoleName = requester.roleId?.name?.toString().trim().toUpperCase() || "";

    console.log(
      `DEBUG APPROVE LEAVE - ${requester.username} (${requesterRoleName}) step=${approval.step}`
    );

    // ==========================
    // WORKFLOW PEMBATALAN CUTI
    // ==========================
    if (leave.status === "CANCELLATION_PENDING") {
      leave.status = "CANCELLED";
      await leave.save();

      await LeaveCancellation.findOneAndUpdate(
        {
          leaveId: leave._id,
          status: "PENDING",
        },
        {
          status: "APPROVED",
        }
      );

      const currentYear = new Date(leave.startDate).getFullYear();

      const balance = await LeaveBalance.findOne({
        userId: requester._id,
        year: currentYear,
      });

      if (balance) {
        balance.used -= Number(leave.totalDays);
        balance.remaining += Number(leave.totalDays);
        await balance.save();
      }

      return res.redirect("/leave/manage-requests");
    }

    // ==========================
    // WORKFLOW CUTI NORMAL
    // ==========================

    let nextStep;
    let nextApproverId;

    nextStep = null;
    nextApproverId = null;

    const role = requesterRoleName;

    // =========================
    // PEGAWAI FLOW
    // =========================
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
    }

    // =========================
    // MANAGER FLOW
    // =========================
    else if (role.startsWith("MANAGER")) {
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
    }

    // =========================
    // WAKIL DIREKTUR FLOW
    // =========================
    else if (role === "WAKIL_DIREKTUR") {
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

      console.log(`DEBUG WORKFLOW - Next Step: ${nextStep}`);
    } else {
      leave.status = "APPROVED";
      await leave.save();

      const currentYear = new Date(leave.startDate).getFullYear();

      const balance = await LeaveBalance.findOne({
        userId: requester._id,
        year: currentYear,
      });

      if (balance) {
        balance.used += Number(leave.totalDays);
        balance.remaining -= Number(leave.totalDays);
        await balance.save();
      }
    }

    return res.redirect("/leave/manage-requests");
  } catch (error) {
    console.error("Error pada approveLeave:", error);

    return res.status(500).render("error", {
      title: "approve leave",
      message: error.message,
    });
  }
};
export const rejectLeave = async (req, res) => {
  try {
    const { note } = req.body;

    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.status(401).render("error", {
        title: "Error",
        message: "Sesi Anda telah berakhir. Silakan login kembali.",
      });
    }

    const approval = await LeaveApproval.findOne({
      _id: req.params.id,
      approverId: sessionUser._id,
      status: "PENDING",
    });

    if (!approval) {
      return res.status(404).render("error", {
        title: "Reject Leave",
        message: "Data persetujuan tidak ditemukan atau sudah diproses.",
      });
    }

    approval.status = "REJECTED";
    approval.note = note || "";
    approval.actionDate = new Date();
    await approval.save();

    await Leave.findByIdAndUpdate(approval.leaveId, { status: "REJECTED" });

    console.log(
      `DEBUG REJECT LEAVE - Pengajuan Cuti ID: ${approval.leaveId} berhasil DITOLAK oleh ${sessionUser.username} pada tahap ${approval.step}`
    );

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

    const activeApprovals = await LeaveApproval.find({
      approverId: sessionUser._id,
      status: "PENDING",
    });

    const historyApprovals = await LeaveApproval.find({
      approverId: sessionUser._id,
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
        populate: {
          path: "employeeData",
          select: "fullName",
        },
      })
      .sort({ createdAt: -1 });

    const historyLeaves = await Leave.find({
      _id: { $in: historyLeaveIds },
    })
      .populate("leaveTypeId", "name")
      .populate({
        path: "userId",
        populate: {
          path: "employeeData",
          select: "fullName",
        },
      })
      .sort({ createdAt: -1 });

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
