import AppError from "../utils/AppError.js";
import Employee from "../models/employee/Employee.model.js";
import {
  getTodayAttendance,
  processCheckIn,
  processCheckOut,
  getAttendanceHistory,
  updateCompanyConfig,
} from "../services/attendance.service.js";

const getEmployeeIdFromUser = async (userId) => {
  const employee = await Employee.findOne({ userId }).select("_id");
  if (!employee) throw new AppError("Profil pegawai tidak ditemukan untuk akun ini.", 404);
  return employee._id;
};

export const renderAttendancePage = async (req, res, next) => {
  try {
    const user = req.user;
    const employeeId = await getEmployeeIdFromUser(user._id);
    const attendance = await getTodayAttendance(employeeId);

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
    const user = req.user;
    if (!user) throw new AppError("Sesi Anda telah berakhir, silahkan masuk kembali.", 401);

    req.body._userAgent = req.headers["user-agent"] || "";

    const employeeId = await getEmployeeIdFromUser(user._id);
    await processCheckIn(employeeId, req.body, req.file);

    res.status(201).json({
      success: true,
      message: "Check-in berhasil.",
    });
  } catch (err) {
    next(err);
  }
};

export const checkOut = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) throw new AppError("Sesi Anda telah berakhir.", 401);

    const employeeId = await getEmployeeIdFromUser(user._id);
    await processCheckOut(employeeId, req.body, req.file);

    res.status(200).json({
      success: true,
      message: "Check-out berhasil dilakukan, selamat beristirahat.",
    });
  } catch (err) {
    next(err);
  }
};

export const renderHistoryPage = async (req, res, next) => {
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
