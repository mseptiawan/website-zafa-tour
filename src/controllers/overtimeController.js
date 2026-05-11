import Overtime from "../models/Overtime.js";
// ==========================
// FORM APPLY
// ==========================
export const showApplyOvertime = (req, res) => {
  res.render("overtime/apply", {
    title: "Ajukan Lembur",
  });
};

// ==========================
// SUBMIT OVERTIME
// ==========================
export const applyOvertime = async (req, res) => {
  try {
    const { date, startTime, endTime, workDescription, result } = req.body;

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      return res.send("Jam selesai harus lebih besar dari jam mulai");
    }

    const diffMs = end - start;
    const totalHours = diffMs / (1000 * 60 * 60);

    const user = req.session.user;

    const isManager = user.role === "MANAGER";

    await Overtime.create({
      userId: user._id,
      employeeName: user.fullName,
      date,
      startTime,
      endTime,
      totalHours,
      workDescription,
      result,
      proofFile: req.file ? req.file.filename : null,

      // ⬇️ penting: status logic
      status: isManager ? "Approved" : "Pending Manager",
      approvedByManager: isManager ? true : false,
    });

    return res.redirect("/overtime/my");
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};

// ==========================
// MY OVERTIME
// ==========================
export const myOvertime = async (req, res) => {
  try {
    console.log("SESSION USER:", req.session.user._id);

    const overtimes = await Overtime.find({
      userId: req.session.user._id,
    }).sort({
      createdAt: -1,
    });

    res.render("overtime/my-overtime", {
      title: "Riwayat Lembur",
      overtimes,
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};

// ==========================
// APPROVAL PAGE
// ==========================

export const approvalOvertimePage = async (req, res) => {
  try {
    const user = req.session.user;

    const overtimes = await Overtime.find({
      status: "Pending Manager",
      userId: { $ne: user._id },
    })
      .populate("userId")
      .sort({ createdAt: -1 });

    res.render("overtime/approval", {
      title: "Approval Lembur",
      overtimes,
    });
  } catch (err) {
    console.log(err);
    res.send(err.message);
  }
};
// ==========================
// APPROVE MANAGER
// ==========================
export const approveManagerOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    overtime.approvedByManager = true;
    overtime.status = "Approved";
    await overtime.save();

    res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// REJECT
// ==========================
export const rejectOvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    overtime.status = "Rejected";

    await overtime.save();

    res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};
export const approvalOvertimeHistory = async (req, res) => {
  const overtimes = await Overtime.find({
    status: { $in: ["Approved", "Rejected"] },
  }).sort({ createdAt: -1 });

  res.render("overtime/approval-history", {
    title: "Riwayat Approval Lembur",
    overtimes,
  });
};
