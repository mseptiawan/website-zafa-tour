import Attendance from "../models/Attendance.js";

const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * GEOCODING (OPENSTREETMAP)
 */
const getAddress = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );

    const data = await res.json();

    return data.display_name || "Lokasi tidak diketahui";
  } catch (err) {
    return "Lokasi tidak diketahui";
  }
};

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // meter
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
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
    if (!user)
      return res.status(401).json({
        success: false,
        message: "Session invalid",
      });

    const { start, end } = getTodayRange();

    /**
     * LOCK: pakai createdAt (lebih aman + konsisten dengan timestamps)
     */
    const already = await Attendance.findOne({
      userId: user._id,
      createdAt: { $gte: start, $lte: end },
    });

    if (already) {
      return res.json({
        success: false,
        message: "Sudah absen hari ini",
      });
    }

    const now = new Date();
    const status = now.getHours() > 8 ? "TELAT" : "HADIR";

    const type = req.body.type;

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);

    /**
     * FIX: jangan pakai (!lat || !lng) karena 0 bisa dianggap false
     */
    if (isNaN(lat) || isNaN(lng)) {
      return res.json({
        success: false,
        message: "Lokasi tidak ditemukan (GPS belum siap)",
      });
    }

    /**
     * OFFICE LOCATION
     */
    const OFFICE_LAT = -2.930177;
    const OFFICE_LNG = 104.763741;

    const distance = haversineDistance(OFFICE_LAT, OFFICE_LNG, lat, lng);

    /**
     * VALIDASI KANTOR
     */
    if (type === "KANTOR" && distance > 500) {
      return res.json({
        success: false,
        message: "Anda terlalu jauh dari kantor (max 500m)",
      });
    }

    /**
     * LABEL LOGIC (TIDAK DIUBAH SIGNIFIKAN)
     */
    let locationLabel = "";

    if (type === "KANTOR") {
      locationLabel = distance <= 500 ? "Absen di Kantor Zafa Tour" : "Diluar radius kantor";
    } else {
      // LUAR KANTOR → geocoding tetap sama
      locationLabel = await getAddress(lat, lng);
    }

    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;

    /**
     * SAVE
     */
    await Attendance.create({
      userId: user._id,
      checkIn: now,
      status,
      type,

      photo,

      location: {
        lat,
        lng,
        address: locationLabel,
      },

      deviceInfo: {
        userAgent: req.headers["user-agent"],
        platform: "WEB",
      },
    });

    return res.json({
      success: true,
      message: "Absen berhasil",
    });
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
      createdAt: { $gte: start, $lte: end },
    });

    if (!attendance) {
      return res.redirect("/attendance");
    }

    if (attendance.checkOut) {
      return res.redirect("/attendance/history");
    }

    const now = new Date();

    attendance.checkOut = now;

    // ✔ hitung durasi kerja
    attendance.workDuration = (now - attendance.checkIn) / (1000 * 60); // menit

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
