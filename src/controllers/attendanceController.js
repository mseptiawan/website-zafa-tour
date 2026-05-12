import Attendance from "../models/Attendance.js";

/**
 * HELPER: RANGE HARI INI
 */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * AMBIL HALAMAN ABSENSI
 */
export const index = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/");

    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start, $lte: end },
    });

    const already = !!attendance;
    const hasCheckedOut = !!attendance?.checkOut;

    return res.render("attendance/create", {
      title: "Absensi",
      attendance,
      already,
      hasCheckedOut,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).send("Error absensi");
  }
};

/**
 * CHECK IN
 */
export const checkIn = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Session tidak valid",
      });
    }

    const { start, end } = getTodayRange();

    const already = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start, $lte: end },
    });

    if (already) {
      return res.json({
        success: false,
        message: "Sudah absen hari ini",
      });
    }

    const now = new Date();
    const status = now.getHours() > 8 ? "TELAT" : "HADIR";

    let location = null;

    if (req.body.type === "DINAS_LUAR") {
      location = {
        lat: req.body.lat,
        lng: req.body.lng,
      };
    }

    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;

    await Attendance.create({
      userId: user._id,
      checkIn: now,
      status,
      type: req.body.type,
      note: req.body.note,
      photo,
      location,
    });

    return res.json({ success: true });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * CHECK OUT
 */
export const checkOut = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/");

    const { start, end } = getTodayRange();

    const attendance = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start, $lte: end },
    });

    if (!attendance) {
      return res.redirect("/attendance");
    }

    if (attendance.checkOut) {
      return res.redirect("/attendance/history");
    }

    attendance.checkOut = new Date();
    await attendance.save();

    return res.redirect("/attendance/history");
  } catch (err) {
    console.log(err);
    return res.status(500).send("error checkout");
  }
};

/**
 * HISTORY
 */
export const history = async (req, res) => {
  try {
    const user = req.session.user;

    const data = await Attendance.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    res.render("attendance/history", {
      data,
      title: "Riwayat Absensi",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error history");
  }
};

/**
 * DETAIL
 */
export const detail = async (req, res) => {
  try {
    const data = await Attendance.findById(req.params.id).populate("userId");

    if (!data) {
      return res.status(404).send("Data tidak ditemukan");
    }

    res.render("attendance/detail", {
      data,
      title: "Detail Absensi",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error detail");
  }
};

/**
 * ALL ATTENDANCE (ADMIN)
 */
export const allAttendance = async (req, res) => {
  try {
    const data = await Attendance.find().populate("userId").sort({ createdAt: -1 });

    res.render("attendance/index", {
      data,
      title: "Data Absensi Karyawan",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error ambil data absensi");
  }
};
