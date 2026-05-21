import Employee from "../models/Employee.js";
import AttendanceCorrection from "../models/AttendanceCorrection.js";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
/**
 * RANGE HARI INI
 */
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

/**
 * GEOCODING
 */
const getAddress = async (lat, lng) => {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
    );
    const data = await res.json();

    return data.display_name || "Lokasi tidak diketahui";
  } catch {
    return "Lokasi tidak diketahui";
  }
};

/**
 * DISTANCE
 */
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const toRad = (v) => (v * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * HALAMAN ABSENSI USER
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

    res.render("attendance/create", {
      title: "Absensi",
      attendance,
      already: !!attendance,
      hasCheckedOut: !!attendance?.checkOut,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error absensi");
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

    if (isNaN(lat) || isNaN(lng)) {
      return res.json({
        success: false,
        message: "Lokasi tidak valid",
      });
    }

    const OFFICE_LAT = -2.930156;
    const OFFICE_LNG = 104.763686;
    const distance = haversineDistance(OFFICE_LAT, OFFICE_LNG, lat, lng);

    if (type === "KANTOR" && distance > 500) {
      return res.json({
        success: false,
        message: "Diluar radius kantor",
      });
    }

    let locationLabel =
      type === "KANTOR" ? "Absen di Kantor Zafa Tour" : await getAddress(lat, lng);

    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;

    await Attendance.create({
      userId: user._id,
      checkIn: now,
      status,
      type,
      note: req.body.note || "",
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
    res.status(500).json({
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

    if (!attendance) return res.redirect("/attendance");

    if (attendance.checkOut) return res.redirect("/attendance/history");

    const now = new Date();

    attendance.checkOut = now;
    attendance.workDuration = (now - attendance.checkIn) / (1000 * 60);

    await attendance.save();

    res.redirect("/attendance/history");
  } catch (err) {
    console.log(err);
    res.status(500).send("error checkout");
  }
};

/**
 * HISTORY USER
 */
export const history = async (req, res) => {
  try {
    const user = req.session.user;

    const data = await Attendance.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    res.render("attendance/history", {
      title: "Riwayat Absensi",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("error history");
  }
};

/**
 * ADMIN ALL ATTENDANCE
 */
export const allAttendance = async (req, res) => {
  try {
    const data = await Attendance.find().populate("userId").sort({ createdAt: -1 });

    res.render("attendance/index", {
      title: "Data Absensi Karyawan",
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error ambil data");
  }
};
export const getAttendanceDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Ambil User dan POPULATE employeeData agar fullName bisa diakses
    const users = await User.find().populate("employeeData");

    // 2. Ambil absensi hari ini
    const attendances = await Attendance.find({
      createdAt: { $gte: today, $lt: tomorrow },
    });

    // 3. Gabungkan data
    const dashboardData = users.map((user) => {
      const attendance = attendances.find((a) => a.userId.toString() === user._id.toString());

      return {
        // Ambil fullName dari employeeData, fallback ke username jika null
        name: user.employeeData ? user.employeeData.fullName : user.username,
        attendance: attendance || null,
        status: attendance ? attendance.status : "BELUM ABSEN",
      };
    });

    // 4. Sorting: BELUM ABSEN selalu di atas
    dashboardData.sort((a, b) => {
      if (a.status === "BELUM ABSEN" && b.status !== "BELUM ABSEN") return -1;
      if (a.status !== "BELUM ABSEN" && b.status === "BELUM ABSEN") return 1;
      return 0;
    });

    res.render("attendance/all", { title: "Dashboard Absensi HR", data: dashboardData });
  } catch (error) {
    console.error(error);
    res.status(500).send("Terjadi kesalahan server");
  }
};
/**
 * EDIT FORM (HR)
 */
// export const editForm = async (req, res) => {
//   const data = await Attendance.findById(req.params.id);

//   res.render("attendance/edit", {
//     title: "Edit Absensi",
//     data,
//   });
// };

/**
 * UPDATE (HR ONLY)
 */
// export const updateAttendance = async (req, res) => {
//   try {
//     const admin = req.session.user;

//     if (!admin || admin.role !== "HR") {
//       return res.status(403).send("Access denied");
//     }

//     const { checkIn, checkOut, status, type, note } = req.body;

//     await Attendance.findByIdAndUpdate(req.params.id, {
//       checkIn,
//       checkOut,
//       status,
//       type,
//       note,
//       editedBy: admin._id,
//       editedAt: new Date(),
//     });

//     res.redirect("/attendance/all");
//   } catch (err) {
//     console.log(err);
//     res.status(500).send("Error update");
//   }
// };

/**
 * MANUAL FORM HR
 */
// export const manualForm = async (req, res) => {
//   try {
//     const employees = await Employee.find().populate("userId").sort({ fullName: 1 });

//     res.render("attendance/manual", {
//       title: "Input Absensi Manual",
//       employees,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).send("Error load form manual");
//   }
// };

/**
 * CREATE MANUAL HR
 */
// export const createManual = async (req, res) => {
//   try {
//     const { userId, checkIn, checkOut, type, status, note } = req.body;

//     const inTime = new Date(checkIn);
//     const outTime = checkOut ? new Date(checkOut) : null;

//     let workDuration = 0;

//     if (outTime) {
//       workDuration = (outTime - inTime) / (1000 * 60);
//     }

//     await Attendance.create({
//       userId,
//       checkIn: inTime,
//       checkOut: outTime,
//       type,
//       status,
//       note,
//       workDuration,
//     });

//     res.redirect("/attendance/all");
//   } catch (err) {
//     console.log(err);
//     res.status(500).send("Error manual input");
//   }
// };

// export const getCorrectionDetail = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const data = await AttendanceCorrection.findById(id).populate("userId"); // pastikan field ini benar

//     if (!data) {
//       return res.status(404).send("Data tidak ditemukan");
//     }

//     return res.render("attendance/correction-detail", {
//       title: "Detail Koreksi Absensi",
//       data,
//     });
//   } catch (err) {
//     console.error("ERROR getCorrectionDetail:", err);

//     return res.status(500).send({
//       message: "Server error",
//       error: err.message,
//     });
//   }
// };
