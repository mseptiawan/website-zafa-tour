import Attendance from "../models/Attendance.js";
import CompanySetting from "../models/CompanySetting.js";
import AppError from "../utils/AppError.js";
import User from "../models/basic/User.js";
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

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

export const index = async (req, res, next) => {
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
    next(err);
  }
};

export const checkIn = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) throw new AppError("Sesi Anda telah berakhir, silahkan masuk kembali.", 401);

    const { start, end } = getTodayRange();
    const already = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start, $lte: end },
    });

    if (already) throw new AppError("Anda sudah melakukan check-in hari ini.", 400);

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    if (isNaN(lat) || isNaN(lng)) throw new AppError("Koordinat lokasi tidak valid.", 400);

    let company = await CompanySetting.findOne();
    if (!company) company = await CompanySetting.create({});

    const distance = haversineDistance(company.lat, company.lng, lat, lng);

    let type = "LUAR KANTOR";
    if (distance <= company.radiusMeter) {
      type = "KANTOR";
    }

    let locationLabel = type === "KANTOR" ? `Absen di ${company.name}` : await getAddress(lat, lng);

    const photo = req.file ? `/uploads/photos/${req.file.filename}` : null;

    const now = new Date();
    const [configHour, configMin] = company.entryTimeLimit.split(":").map(Number);
    const timeLimit = new Date();
    timeLimit.setHours(configHour, configMin, 0, 0);

    let status = "HADIR";
    let lateDuration = 0;

    if (now > timeLimit) {
      status = "TELAT";
      const diffMs = now - timeLimit;
      lateDuration = Math.ceil(diffMs / (1000 * 60));
    }

    await Attendance.create({
      userId: user._id,
      checkIn: now,
      status,
      lateDuration,
      type,
      note: req.body.note || "",
      checkInPhoto: photo,
      location: {
        lat,
        lng,
        address: locationLabel,
        accuracy: req.body.accuracy || 0,
      },
      deviceInfo: { userAgent: req.headers["user-agent"], platform: "WEB" },
    });

    res.status(201).json({
      success: true,
      message: `Check-in berhasil.`,
    });
  } catch (err) {
    next(err);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) throw new AppError("Sesi Anda telah berakhir.", 401);

    const { start, end } = getTodayRange();
    const attendance = await Attendance.findOne({
      userId: user._id,
      checkIn: { $gte: start, $lte: end },
    });

    if (!attendance) throw new AppError("Anda belum memiliki record check-in hari ini.", 400);
    if (attendance.checkOut) throw new AppError("Anda telah melakukan check-out hari ini.", 400);

    const lat = parseFloat(req.body.lat);
    const lng = parseFloat(req.body.lng);
    const currentPhoto = req.file ? `/uploads/photos/${req.file.filename}` : null;

    const now = new Date();
    attendance.checkOut = now;
    attendance.checkOutPhoto = currentPhoto;
    attendance.workDuration = Math.ceil((now - attendance.checkIn) / (1000 * 60));

    if (!isNaN(lat) && !isNaN(lng)) {
      attendance.checkOutLocation = {
        lat,
        lng,
        address: await getAddress(lat, lng),
      };
    }

    await attendance.save();

    return res.status(200).json({
      success: true,
      message: "Check-out berhasil dilakukan, selamat beristirahat.",
    });
  } catch (err) {
    next(err);
  }
};

export const attendanceHistory = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/");

    const { startDate, endDate, view } = req.query;
    const isAdmin = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_ADMINISTRASI"].includes(
      user.role
    );

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    const isPersonalView = isAdmin && view === "personal";
    const matchQuery = {
      checkIn: { $gte: start, $lte: end },
      ...(isAdmin && !isPersonalView ? {} : { userId: user._id }),
    };

    let listAttendance = await Attendance.find(matchQuery)
      .populate("userId", "username")
      .sort({ checkIn: -1 });

    listAttendance = listAttendance.map((doc) => doc.toObject());

    if (isAdmin && !isPersonalView) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const attendedToday = await Attendance.find({
        checkIn: { $gte: todayStart, $lte: todayEnd },
      }).distinct("userId");

      const adminRoles = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_ADMINISTRASI"];
      const missingUsers = await User.find({
        role: { $nin: adminRoles },
        _id: { $nin: attendedToday },
      }).select("username");

      const missingAttendanceData = missingUsers.map((emp) => ({
        _id: `missing-${emp._id}`, 
        userId: { username: emp.username },
        checkIn: null,
        checkOut: null,
        createdAt: new Date(), 
        status: "BELUM ABSEN",
        lateDuration: 0,
        checkInPhoto: null,
        isMissing: true, 
      }));

      listAttendance = [...missingAttendanceData, ...listAttendance];
    }

    const summary = await Attendance.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalLateMinutes: { $sum: "$lateDuration" },
          totalLateDays: { $sum: { $cond: [{ $eq: ["$status", "TELAT"] }, 1, 0] } },
          totalHadir: { $sum: { $cond: [{ $eq: ["$status", "HADIR"] }, 1, 0] } },
        },
      },
    ]);

    res.render("attendance/history", {
      title: "Riwayat Kehadiran",
      listAttendance,
      analytics: summary[0] || { totalLateMinutes: 0, totalLateDays: 0, totalHadir: 0 },
      isAdmin,
      isPersonalView,
      filters: {
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateCompanyLocation = async (req, res, next) => {
  try {
    const { lat, lng, radiusMeter, entryTimeLimit, name } = req.body;

    let config = await CompanySetting.findOne();
    if (!config) config = new CompanySetting();

    if (lat) config.lat = parseFloat(lat);
    if (lng) config.lng = parseFloat(lng);
    if (radiusMeter) config.radiusMeter = parseInt(radiusMeter);
    if (entryTimeLimit) config.entryTimeLimit = entryTimeLimit;
    if (name) config.name = name;

    await config.save();
    res.json({ success: true, message: "Konformasi parameter instansi berhasil diperbarui." });
  } catch (err) {
    next(err);
  }
};
