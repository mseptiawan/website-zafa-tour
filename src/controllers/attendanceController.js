import Attendance from "../models/Attendance.js";

/**
 * AMBIL HALAMAN ABSENSI
 */
export const index = async (req, res) => {
  try {
    const user = req.session.user; // konsisten pakai session

    if (!user) {
      return res.redirect("/");
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const already = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start },
    });

    return res.render("attendance/create", {
      title: "Absensi",
      already: already || null,
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

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    // cek sudah absen hari ini
    const already = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start },
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

    // ✅ hanya DINAS_LUAR simpan lokasi
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const att = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: today },
    });

    if (att) {
      att.checkOut = new Date();
      await att.save();
    }

    res.redirect("/attendance/history");
  } catch (err) {
    console.log(err);
    res.status(500).send("error checkout");
  }
};

/**
 * HISTORY
 */
export const history = async (req, res) => {
  const user = req.session.user;

  const data = await Attendance.find({
    userId: user._id,
  }).sort({ createdAt: -1 });

  res.render("attendance/history", {
    data,
    title: "Riwayat Absensi",
  });
};
export const detail = async (req, res) => {
  const data = await Attendance.findById(req.params.id).populate("userId");

  if (!data) {
    return res.status(404).send("Data tidak ditemukan");
  }

  res.render("attendance/detail", {
    data,
    title: "Detail Absensi",
  });
};
export const allAttendance = async (req, res) => {
  try {
    const data = await Attendance.find()
      .populate("userId")
      .sort({ createdAt: -1 });

    res.render("attendance/index", {
      data,
      title: "Data Absensi Karyawan",
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error ambil data absensi");
  }
};
