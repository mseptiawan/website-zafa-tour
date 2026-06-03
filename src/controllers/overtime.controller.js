import { Overtime } from "../models/Overtime.model.js";
import { createOvertimeService } from "../services/overtime.service.js";
import { getOvertimeSummary } from "../services/overtimeSummary.service.js";
import Bidang from "../models/basic/Bidang.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import Employee from "../models/employee/Employee.model.js";
import EmployeeFinancial from "../models/employee/EmployeeFinancial.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

export const showApplyOvertime = (req, res) => {
  const today = new Date();

  const backLimit = new Date();
  backLimit.setDate(today.getDate() - 7);

  const period = getPayrollPeriod(today);

  const minAllowed = new Date(Math.max(backLimit.getTime(), period.start.getTime()));

  const formatDate = (d) => d.toISOString().split("T")[0];
  console.log("DATE LIMIT:", {
    min: formatDate(minAllowed),
    max: formatDate(today),
  });
  return res.render("overtime/new", {
    title: "Catat Lembur",
    errors: {},
    old: {},

    dateLimit: {
      min: formatDate(minAllowed),
      max: formatDate(today),
    },
  });
};

export const applyOvertime = async (req, res) => {
  try {
    if (req.validationErrors) {
      return res.render("overtime/new", {
        title: "Catat Lembur",
        errors: req.validationErrors,
        old: req.body,
      });
    }

    await createOvertimeService({
      user: req.session.user,
      body: req.body,
      file: req.file,
    });

    return res.redirect("/overtime/my");
  } catch (err) {
    console.log(err);

    return res.render("overtime/new", {
      title: "Catat Lembur",
      errors: {
        general: err.message,
      },
      old: req.body,
    });
  }
};

export const myOvertime = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const totalData = await Overtime.countDocuments({ userId });

    const totalPages = Math.ceil(totalData / limit);

    const overtimes = await Overtime.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.render("overtime/my-overtime", {
      title: "Riwayat Lembur",
      overtimes,
      pagination: {
        page,
        totalPages,
        totalData,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const approvalOvertimePage = async (req, res) => {
  try {
    const user = req.session.user;

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { search, status, sort, tab = "active" } = req.query;

    const userRole = user.role;

    // BASE FILTER → HANYA DATA SESUAI ROLE MANAGER LOGIN
    const baseFilter = {
      userId: { $ne: user._id },
      requiredManagerRole: userRole, // ⬅️ INI KUNCI UTAMA
    };

    if (search) {
      baseFilter.employeeName = { $regex: search, $options: "i" };
    }

    const sortOption = sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    const activeFilter = {
      ...baseFilter,
      status: "SUBMITTED",
    };

    const historyFilter = {
      ...baseFilter,
      status: { $in: ["APPROVED", "REJECTED"] },
    };

    const [totalActive, totalHistory, activeOvertimes, historyOvertimes] = await Promise.all([
      Overtime.countDocuments(activeFilter),
      Overtime.countDocuments(historyFilter),

      Overtime.find(activeFilter)
        .populate("userId")
        .sort(sortOption)
        .skip(tab === "active" ? skip : 0)
        .limit(tab === "active" ? limit : 10),

      Overtime.find(historyFilter)
        .populate("userId")
        .sort(sortOption)
        .skip(tab === "history" ? skip : 0)
        .limit(tab === "history" ? limit : 10),
    ]);

    return res.render("overtime/approval", {
      title: "Pusat Approval Lembur",
      activeOvertimes,
      historyOvertimes,
      activeQuery: tab === "active" ? req.query : {},
      historyQuery: tab === "history" ? req.query : {},

      activePagination: {
        page: tab === "active" ? page : 1,
        totalPages: Math.ceil(totalActive / limit) || 1,
        totalData: totalActive,
        hasPrev: page > 1,
        hasNext: page < Math.ceil(totalActive / limit),
      },

      historyPagination: {
        page: tab === "history" ? page : 1,
        totalPages: Math.ceil(totalHistory / limit) || 1,
        totalData: totalHistory,
        hasPrev: page > 1,
        hasNext: page < Math.ceil(totalHistory / limit),
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};

export const approveManagerOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      return res.status(404).send("Data tidak ditemukan");
    }

    const { note } = req.body;
    const userRole = req.session.user.role;

    // validasi role approver
    if (userRole !== overtime.requiredManagerRole) {
      return res.status(403).send("Anda tidak berhak approve lembur ini");
    }

    // ambil financial pegawai
    const financial = await EmployeeFinancial.findOne({
      employee_id: overtime.employeeId,
    });

    if (!financial) {
      return res.status(400).send("Data financial pegawai tidak ditemukan");
    }

    // SNAPSHOT DI SINI (inti perubahan)
    overtime.overtimeRateSnapshot = financial.overtimeRate || 0;
    overtime.multiplierSnapshot = 1.5;

    // update status
    overtime.status = "APPROVED";
    overtime.payrollStatus = "PENDING";

    overtime.approvedBy = req.session.user._id;
    overtime.approvedAt = new Date();

    // history approval
    overtime.approvalHistory.push({
      action: "APPROVED",
      by: req.session.user._id,
      role: userRole,
      note: note?.trim() || null,
      at: new Date(),
    });

    await overtime.save();

    return res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};
export const rejectOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    if (!overtime) {
      return res.status(404).send("Data tidak ditemukan");
    }

    const { note } = req.body;

    const userRole = req.session.user.role;

    if (userRole !== overtime.requiredManagerRole) {
      return res.status(403).send("Anda tidak berhak reject lembur ini");
    }

    overtime.status = "REJECTED";
    overtime.payrollStatus = "LOCKED";

    overtime.approvedBy = req.session.user._id;
    overtime.approvedAt = new Date();

    overtime.approvalHistory.push({
      action: "REJECTED",
      by: req.session.user._id,
      role: userRole,
      note: note?.trim() || null,
      at: new Date(),
    });

    await overtime.save();

    return res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};
export const approvalOvertimeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { search, status, sort } = req.query;

    const filter = {
      userId: { $exists: true },
      status: { $in: ["APPROVED", "REJECTED"] },
    };

    if (search) {
      filter.employeeName = { $regex: search, $options: "i" };
    }

    if (status) {
      filter.status = status;
    }

    const sortOption = sort === "asc" ? { createdAt: 1 } : { createdAt: -1 };

    const totalData = await Overtime.countDocuments(filter);

    const overtimes = await Overtime.find(filter).sort(sortOption).skip(skip).limit(limit);

    return res.render("overtime/approval-history", {
      title: "Riwayat Approval Lembur",
      overtimes,
      query: req.query,
      pagination: {
        page,
        limit,
        totalData,
        totalPages: Math.ceil(totalData / limit),
        hasPrev: page > 1,
        hasNext: page < Math.ceil(totalData / limit),
      },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send(err.message);
  }
};
export const getOvertimeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Ambil data lembur dan populate user penilai di history
    const overtime = await Overtime.findById(id).populate("approvalHistory.by");

    if (!overtime) {
      return res.status(404).send("Data pengajuan lembur tidak ditemukan");
    }

    // 2. Ambil data profil Employee berdasarkan userId yang ada di dokumen lembur
    // Cara ini mengeksploitasi virtual careerData yang berada di dalam Employee model secara legal
    const employee = await Employee.findOne({ userId: overtime.userId }).populate({
      path: "careerData",
      populate: [{ path: "bidangId" }, { path: "unitId" }],
    });

    // Ambil data user dari session untuk evaluasi panel manajemen
    const user = req.session.user;

    return res.render("overtime/detail", {
      title: "Detail Aktivitas Lembur",
      overtime,
      employee, // Kita kirim object employee ke dalam view
      user,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send(err.message);
  }
};
export const getPayrollOvertimeSummary = async (req, res) => {
  try {
    console.log("=== CONTROLLER OVERTIME PAYROLL START ===");
    // Menangkap employeeId dari parameter URL route
    const { employeeId } = req.params;
    console.log("Target Employee ID:", employeeId);

    // Memanggil service dengan passing employeeId
    const result = await getOvertimeSummary(employeeId);
    console.log("SERVICE RESULT FINAL:", result);

    return res.status(200).json({
      success: true,
      totalHours: result?.totalHours || 0,
      totalPay: result?.totalPay || 0,
    });
  } catch (error) {
    console.error("❌ Error di getPayrollOvertimeSummary Controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
      totalHours: 0,
      totalPay: 0,
    });
  }
};
const canApproveOvertime = (userRole, requiredRole) => {
  return userRole === requiredRole;
};
