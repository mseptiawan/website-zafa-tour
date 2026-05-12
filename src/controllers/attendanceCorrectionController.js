import AttendanceCorrection from "../models/AttendanceCorrection.js";

/**
 * FORM PAGE
 */
export const formCorrection = (req, res) => {
  res.render("attendance/correction-form", {
    title: "Koreksi Absensi",
  });
};

/**
 * SUBMIT REQUEST
 */
export const submitCorrection = async (req, res) => {
  try {
    const user = req.session.user;

    const { startDate, startTime, endTime, reasonType, reason } = req.body;

    await AttendanceCorrection.create({
      userId: user._id,
      startDate,
      startTime,
      endTime,
      reasonType,
      reason,
    });

    return res.redirect("/attendance/correction/history");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error submit koreksi");
  }
};
/**
 * HISTORY USER
 */
export const myCorrections = async (req, res) => {
  try {
    const user = req.session.user;

    const data = await AttendanceCorrection.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    res.render("attendance/correction-history", {
      title: "Riwayat Koreksi",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error history");
  }
};

/**
 * ADMIN LIST
 */
export const allCorrections = async (req, res) => {
  try {
    const data = await AttendanceCorrection.find().populate("userId").sort({ createdAt: -1 });

    res.render("attendance/approval-correction", {
      title: "Approval Koreksi Absensi",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error admin koreksi");
  }
};

/**
 * APPROVE / REJECT
 */
export const updateStatus = async (req, res) => {
  try {
    const { id, status } = req.params;

    const admin = req.session.user;

    // 🔒 VALIDASI ROLE
    if (!admin || admin.role !== "HR") {
      return res.status(403).send("Akses ditolak");
    }

    await AttendanceCorrection.findByIdAndUpdate(id, {
      status,
      reviewedBy: admin._id,
    });

    res.redirect("/attendance/approval-correction");
  } catch (err) {
    console.log(err);
    res.status(500).send("Error update status");
  }
};
