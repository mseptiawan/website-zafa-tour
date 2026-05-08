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

    // HITUNG TOTAL JAM
    const start = new Date(`${date}T${startTime}`);

    const end = new Date(`${date}T${endTime}`);

    const diffMs = end - start;

    const totalHours = diffMs / (1000 * 60 * 60);

    await Overtime.create({
      userId: req.session.user.id,

      date,

      startTime,

      endTime,

      totalHours,

      workDescription,

      result,

      proofFile: req.file ? req.file.filename : null,
    });

    res.redirect("/overtime/my");
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
    const overtimes = await Overtime.find({
      userId: req.session.user.id,
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
    const overtimes = await Overtime.find().populate("userId").sort({
      createdAt: -1,
    });

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

    overtime.status = "Pending HR";

    await overtime.save();

    res.redirect("/overtime/approval");
  } catch (err) {
    console.log(err);

    res.send(err.message);
  }
};

// ==========================
// APPROVE HR
// ==========================
export const approveHROvertime = async (req, res) => {
  try {
    const overtime = await Overtime.findById(req.params.id);

    overtime.approvedByHR = true;

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
