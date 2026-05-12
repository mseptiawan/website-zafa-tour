import Leave from "../models/Leave.js";
import LeaveType from "../models/LeaveType.js";
import Employee from "../models/Employee.js";
import LeaveBalance from "../models/LeaveBalance.js";

// ==========================
// FORM AJUKAN CUTI
// ==========================
export const showApplyLeave = async (req, res) => {
  try {
    const leaveTypes = await LeaveType.find({
      isActive: true,
    });

    res.render("leave/apply", {
      title: "Ajukan Cuti",
      leaveTypes,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// SUBMIT CUTI
// ==========================
export const applyLeave = async (req, res) => {
  try {
    const { typeId, startDate, endDate, reason } = req.body;

    const userId = req.session.user._id;

    // ==========================
    // USER
    // ==========================

    const roleName = req.session.user.role;
    // ==========================
    // VALIDASI LEAVE TYPE
    // ==========================
    const leaveType = await LeaveType.findById(typeId);

    if (!leaveType || !leaveType.isActive) {
      return res.send("Jenis cuti tidak valid");
    }

    // ==========================
    // VALIDASI TANGGAL
    // ==========================
    if (new Date(startDate) > new Date(endDate)) {
      return res.send("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
    }

    // ==========================
    // HITUNG TOTAL HARI
    // ==========================
    const diff = new Date(endDate) - new Date(startDate);

    const totalDays = diff / (1000 * 60 * 60 * 24) + 1;

    if (totalDays <= 0) {
      return res.send("Jumlah hari tidak valid");
    }

    const year = new Date(startDate).getFullYear();

    // ==========================
    // LEAVE BALANCE
    // ==========================
    let balance = await LeaveBalance.findOne({
      userId,
      year,
    });

    // auto init
    if (!balance) {
      balance = await LeaveBalance.create({
        userId,
        year,
        quota: 12,
        used: 0,
        remaining: 12,
      });
    }

    // validasi sisa cuti
    if (balance.remaining < totalDays) {
      return res.send("Sisa cuti tidak mencukupi");
    }

    // ==========================
    // EMPLOYEE
    // ==========================
    const employee = await Employee.findOne({
      userId,
    });

    if (!employee) {
      return res.send("Data employee tidak ditemukan");
    }

    // ==========================
    // FLOW APPROVAL
    // ==========================
    let initialStatus = "Pending Manager";

    // manager langsung ke HR
    if (roleName === "MANAGER") {
      initialStatus = "Pending HR";
    }

    // HR langsung ke pimpinan
    if (roleName === "HR") {
      initialStatus = "Pending Pimpinan";
    }

    // pimpinan auto approve
    if (roleName === "PIMPINAN") {
      initialStatus = "Approved";
    }

    // ==========================
    // CREATE LEAVE
    // ==========================
    const leave = await Leave.create({
      userId,

      employeeId: employee._id,

      type: typeId,

      startDate,
      endDate,

      totalDays,

      reason,

      status: initialStatus,

      file: req.file ? req.file.filename : null,

      approvedByManager: false,
      approvedByHR: false,
      approvedByPimpinan: false,
    });

    // ==========================
    // AUTO APPROVE PIMPINAN
    // ==========================
    if (initialStatus === "Approved") {
      balance.used += totalDays;

      balance.remaining = balance.quota - balance.used;

      await balance.save();

      leave.approvedByPimpinan = true;

      await leave.save();
    }

    res.redirect("/leave/my");
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// RIWAYAT CUTI
// ==========================
export const myLeave = async (req, res) => {
  try {
    const year = new Date().getFullYear();

    const balance = await LeaveBalance.findOne({
      userId: req.session.user._id,
      year,
    });

    const leaves = await Leave.find({
      userId: req.session.user._id,
    })
      .populate("type")
      .sort({ createdAt: -1 });

    const summary = {
      total: leaves.length,

      pending: leaves.filter((l) =>
        ["Pending Manager", "Pending HR", "Pending Pimpinan"].includes(l.status)
      ).length,

      used: leaves
        .filter((l) => l.status === "Approved")
        .reduce((total, l) => total + l.totalDays, 0),

      remaining: balance ? balance.remaining : 12,
    };

    res.render("leave/my-leave", {
      title: "Riwayat Cuti",
      leaves,
      summary,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// DETAIL CUTI
// ==========================
export const detailLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)

      .populate("type")

      .populate({
        path: "userId",
        select: "email roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      });

    if (!leave) {
      return res.send("Data cuti tidak ditemukan");
    }

    // ==========================
    // EMPLOYEE
    // ==========================
    const employee = await Employee.findOne({
      userId: leave.userId._id,
    });

    // ==========================
    // RENDER
    // ==========================
    res.render("leave/detail", {
      title: "Detail Cuti",

      leave,

      employee,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// APPROVE MANAGER
// ==========================
export const approveManager = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.send("Data cuti tidak ditemukan");
    }

    if (leave.status !== "Pending Manager") {
      return res.send("Cuti sudah diproses");
    }

    leave.approvedByManager = true;

    leave.status = "Pending HR";

    await leave.save();

    res.redirect("/leave/approval/manager");
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// APPROVE HR
// ==========================
export const approveHR = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.send("Data cuti tidak ditemukan");
    }

    // hanya pending HR
    if (leave.status !== "Pending HR") {
      return res.send("Status tidak valid");
    }

    // ==========================
    // APPROVE
    // ==========================
    leave.approvedByHR = true;

    leave.status = "Approved";

    await leave.save();

    // ==========================
    // UPDATE BALANCE
    // ==========================
    const year = new Date(leave.startDate).getFullYear();

    let balance = await LeaveBalance.findOne({
      userId: leave.userId,
      year,
    });

    // auto create balance
    if (!balance) {
      balance = await LeaveBalance.create({
        userId: leave.userId,

        year,

        quota: 12,

        used: 0,

        remaining: 12,
      });
    }

    // update used leave
    balance.used += leave.totalDays;

    balance.remaining = balance.quota - balance.used;

    await balance.save();

    // ==========================
    // REDIRECT
    // ==========================
    res.redirect("/leave/approval/hr");
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// APPROVE PIMPINAN
// ==========================
export const approvePimpinan = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.send("Data tidak ditemukan");
    }

    // hanya bisa approve pending pimpinan
    if (leave.status !== "Pending Pimpinan") {
      return res.send("Status tidak valid");
    }

    // approve
    leave.status = "Approved";

    leave.approvedByPimpinan = true;

    await leave.save();

    // ==========================
    // UPDATE BALANCE
    // ==========================
    const year = new Date(leave.startDate).getFullYear();

    let balance = await LeaveBalance.findOne({
      userId: leave.userId,
      year,
    });

    // auto create balance
    if (!balance) {
      balance = await LeaveBalance.create({
        userId: leave.userId,
        year,
        quota: 12,
        used: 0,
        remaining: 12,
      });
    }

    // update used leave
    balance.used += leave.totalDays;

    balance.remaining = balance.quota - balance.used;

    await balance.save();

    res.redirect("/leave/approval/pimpinan");
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// REJECT CUTI
// ==========================
export const rejectLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.send("Data cuti tidak ditemukan");
    }

    // tidak boleh reject jika sudah approved
    if (leave.status === "Approved") {
      return res.send("Cuti sudah disetujui");
    }

    // reset approval
    leave.approvedByManager = false;
    leave.approvedByHR = false;
    leave.approvedByPimpinan = false;

    // set rejected
    leave.status = "Rejected";

    await leave.save();

    // kembali ke halaman sebelumnya
    return res.redirect(req.get("Referrer") || "/dashboard");
  } catch (err) {
    console.log(err);

    return res.status(500).send(err.message);
  }
};
// ==========================
// MANAGER APPROVAL PAGE
// ==========================
export const managerApprovalPage = async (req, res) => {
  try {
    // ==========================
    // PENDING MANAGER
    // ==========================
    const leaves = await Leave.find({
      status: "Pending Manager",
    })

      .populate({
        path: "type",
        select: "name",
      })

      .populate({
        path: "userId",
        select: "roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      })

      .sort({
        createdAt: -1,
      });

    // ==========================
    // FILTER
    // hanya STAFF & KEUANGAN
    // ==========================
    const filteredLeaves = leaves.filter((leave) => {
      const roleName = leave.userId?.roleId?.name;

      return roleName === "Karyawan" || roleName === "Keuangan";
    });

    // ==========================
    // USER IDS
    // ==========================
    const userIds = filteredLeaves.map((leave) => leave.userId?._id);

    // ==========================
    // EMPLOYEE
    // ==========================
    const employees = await Employee.find({
      userId: {
        $in: userIds,
      },
    });

    // ==========================
    // EMPLOYEE MAP
    // ==========================
    const employeeMap = {};

    employees.forEach((emp) => {
      employeeMap[emp.userId.toString()] = emp;
    });

    // ==========================
    // ENRICH DATA
    // ==========================
    const enrichedLeaves = filteredLeaves.map((leave) => {
      const employee = employeeMap[leave.userId?._id?.toString()] || null;

      return {
        ...leave.toObject(),

        employee,
      };
    });

    // ==========================
    // RENDER
    // ==========================
    res.render("leave/approval-manager", {
      title: "Approval Manager",

      leaves: enrichedLeaves,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// HR APPROVAL PAGE
// ==========================
// ==========================
// HR APPROVAL PAGE
// ==========================
export const hrApprovalPage = async (req, res) => {
  try {
    // ==========================
    // HANYA PENDING HR
    // ==========================
    const leaves = await Leave.find({
      status: "Pending HR",
    })

      .populate({
        path: "type",
        select: "name",
      })

      .sort({
        createdAt: -1,
      });

    // ==========================
    // USER IDS
    // ==========================
    const userIds = leaves.map((leave) => leave.userId);

    // ==========================
    // EMPLOYEE
    // ==========================
    const employees = await Employee.find({
      userId: {
        $in: userIds,
      },
    });

    // ==========================
    // EMPLOYEE MAP
    // ==========================
    const employeeMap = {};

    employees.forEach((emp) => {
      employeeMap[emp.userId.toString()] = emp;
    });

    // ==========================
    // ENRICH DATA
    // ==========================
    const enrichedLeaves = leaves.map((leave) => {
      const employee = employeeMap[leave.userId?.toString()] || null;

      return {
        ...leave.toObject(),
        employee,
      };
    });

    // ==========================
    // RENDER
    // ==========================
    res.render("leave/approval-hr", {
      title: "Approval HR",

      leaves: enrichedLeaves,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

// ==========================
// PIMPINAN APPROVAL PAGE
// ==========================
export const pimpinanApprovalPage = async (req, res) => {
  try {
    // ==========================
    // HANYA PENDING PIMPINAN
    // ==========================
    const leaves = await Leave.find({
      status: "Pending Pimpinan",
    })

      .populate({
        path: "type",
        select: "name",
      })

      .sort({
        createdAt: -1,
      });

    // ==========================
    // USER IDS
    // ==========================
    const userIds = leaves.map((leave) => leave.userId);

    // ==========================
    // EMPLOYEE
    // ==========================
    const employees = await Employee.find({
      userId: {
        $in: userIds,
      },
    });

    // ==========================
    // EMPLOYEE MAP
    // ==========================
    const employeeMap = {};

    employees.forEach((emp) => {
      employeeMap[emp.userId.toString()] = emp;
    });

    // ==========================
    // ENRICH DATA
    // ==========================
    const enrichedLeaves = leaves.map((leave) => {
      const employee = employeeMap[leave.userId?.toString()] || null;

      return {
        ...leave.toObject(),
        employee,
      };
    });

    // ==========================
    // RENDER
    // ==========================
    res.render("leave/approval-pimpinan", {
      title: "Approval Pimpinan",

      leaves: enrichedLeaves,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};

export const allLeavePage = async (req, res) => {
  try {
    const leaves = await Leave.find()

      .populate({
        path: "type",
        select: "name",
      })

      .populate({
        path: "userId",
        select: "email roleId",
        populate: {
          path: "roleId",
          select: "name",
        },
      })

      .sort({
        createdAt: -1,
      });

    // ==========================
    // USER IDS
    // ==========================
    const userIds = leaves.map((leave) => leave.userId?._id);

    // ==========================
    // EMPLOYEE
    // ==========================
    const employees = await Employee.find({
      userId: {
        $in: userIds,
      },
    });

    // ==========================
    // EMPLOYEE MAP
    // ==========================
    const employeeMap = {};

    employees.forEach((emp) => {
      employeeMap[emp.userId.toString()] = emp;
    });

    // ==========================
    // ENRICH DATA
    // ==========================
    const enrichedLeaves = leaves.map((leave) => {
      const employee = employeeMap[leave.userId?._id?.toString()] || null;

      return {
        ...leave.toObject(),
        employee,
      };
    });

    res.render("leave/all-leave", {
      title: "Semua Pengajuan Cuti",
      leaves: enrichedLeaves,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send(err.message);
  }
};
