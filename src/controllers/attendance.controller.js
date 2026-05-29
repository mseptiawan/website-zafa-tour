import AppError from "../utils/AppError.js";
import {
  getTodayAttendance,
  processCheckIn,
  processCheckOut,
  getAttendanceHistory,
  updateCompanyConfig,
} from "../services/attendance.service.js";

// ─── Page: Form Absensi ──────────────────────────────────────────────────────

export const index = async (req, res, next) => {
  try {
    const user = req.user;

    const attendance = await getTodayAttendance(user._id);

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

// ─── API: Check-In ───────────────────────────────────────────────────────────

export const checkIn = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AppError("Sesi Anda telah berakhir, silahkan masuk kembali.", 401);

    req.body._userAgent = req.headers["user-agent"] || "";

    await processCheckIn(user._id, req.body, req.file);

    res.status(201).json({
      success: true,
      message: "Check-in berhasil.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── API: Check-Out ──────────────────────────────────────────────────────────

export const checkOut = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AppError("Sesi Anda telah berakhir.", 401);

    await processCheckOut(user._id, req.body, req.file);

    res.status(200).json({
      success: true,
      message: "Check-out berhasil dilakukan, selamat beristirahat.",
    });
  } catch (err) {
    next(err);
  }
};

// ─── Page: Riwayat Absensi ───────────────────────────────────────────────────

export const attendanceHistory = async (req, res, next) => {
  try {
    const user = req.user;

    const { listAttendance, analytics, isAdmin, isPersonalView, filters } =
      await getAttendanceHistory(user, req.query);

    res.render("attendance/history", {
      title: "Riwayat Kehadiran",
      listAttendance,
      analytics,
      isAdmin,
      isPersonalView,
      filters,
    });
  } catch (err) {
    next(err);
  }
};

// ─── API: Perbarui Lokasi Kantor ─────────────────────────────────────────────

export const updateCompanyLocation = async (req, res, next) => {
  try {
    await updateCompanyConfig(req.body);

    res.json({
      success: true,
      message: "Konfigurasi parameter instansi berhasil diperbarui.",
    });
  } catch (err) {
    next(err);
  }
};
