import Leave from "../models/Leave.js";
import User from "../models/User.js";

// ==========================
// FORM AJUKAN CUTI
// ==========================
export const showApplyLeave = (req, res) => {
  res.render("leave/apply", {
    title: "Ajukan Cuti",
  });
};

// ==========================
// SUBMIT CUTI
// ==========================
export const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    // VALIDASI TANGGAL
    if (new Date(startDate) > new Date(endDate)) {
      return res.send("Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
    }

    // HITUNG TOTAL HARI
    const diff = new Date(endDate) - new Date(startDate);

    const totalDays = diff / (1000 * 60 * 60 * 24) + 1;

    await Leave.create({
      userId: req.session.user._id,

      type,
      startDate,
      endDate,

      totalDays,

      reason,

      file: req.file ? req.file.filename : null,
    });

    res.redirect("/leave/my");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// RIWAYAT CUTI KARYAWAN
// ==========================
export const myLeave = async (req, res) => {
  try {
    const leaves = await Leave.find({
      userId: req.session.user.id,
    }).sort({
      createdAt: -1,
    });

    // SUMMARY
    const summary = {
      total: leaves.length,

      pending: leaves.filter((l) => l.status === "Pending Manager" || l.status === "Pending HR")
        .length,

      used: leaves
        .filter((l) => l.status === "Approved")
        .reduce((total, l) => total + l.totalDays, 0),

      remaining: 12,
    };

    // SISA CUTI
    summary.remaining = summary.remaining - summary.used;

    res.render("leave/my-leave", {
      title: "Riwayat Cuti",

      leaves,
      summary,
    });
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// DETAIL CUTI
// ==========================
export const detailLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate({
      path: "userId",
      select: "fullName employeeId email",
    });

    if (!leave) {
      return res.send("Data cuti tidak ditemukan");
    }

    res.render("leave/detail", {
      title: "Detail Cuti",

      leave,
    });
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// HALAMAN APPROVAL CUTI
// ==========================
export const approvalPage = async (req, res) => {
  try {
    const leaves = await Leave.find()

      .populate({
        path: "userId",
        select: "fullName employeeId email",
      })

      .sort({
        createdAt: -1,
      });

    res.render("leave/approval", {
      title: "Permintaan Cuti",

      leaves,
    });
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// APPROVE MANAGER
// ==========================
// ==========================
// APPROVE MANAGER
// ==========================
export const approveManager = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.send("Data cuti tidak ditemukan");
    }

    // hanya bisa approve jika masih pending manager
    if (leave.status !== "Pending Manager") {
      return res.send("Cuti sudah diproses");
    }

    leave.approvedByManager = true;

    // lanjut ke HR
    leave.status = "Pending HR";

    await leave.save();

    res.redirect("/leave/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
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

    // HR hanya bisa approve
    // jika manager sudah approve
    if (leave.status !== "Pending HR") {
      return res.send("Menunggu approval manager");
    }

    leave.approvedByHR = true;

    leave.status = "Approved";

    await leave.save();

    res.redirect("/leave/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
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

    // kalau sudah approved
    // tidak bisa reject lagi
    if (leave.status === "Approved") {
      return res.send("Cuti sudah disetujui");
    }

    // reset approval
    leave.approvedByManager = false;

    leave.approvedByHR = false;

    leave.status = "Rejected";

    await leave.save();

    res.redirect("/leave/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};
