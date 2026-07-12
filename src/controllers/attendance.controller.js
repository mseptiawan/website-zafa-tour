import AppError from "../utils/AppError.js";
import Employee from "../models/employee/Employee.model.js";
import {
  getTodayAttendance,
  processCheckIn,
  processCheckOut,
  getAttendanceHistory,
  updateCompanyConfig,
  checkTodayAbsenceStatus,
} from "../services/attendance.service.js";

const getEmployeeIdFromUser = async (userId, userRole = "") => {
  const ADMIN_ROLES = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_ADMINISTRASI", "HRD", "ADMIN"];
  const employee = await Employee.findOne({ userId }).select("_id");

  if (!employee) {
    if (ADMIN_ROLES.includes(userRole)) {
      return null;
    }
    throw new AppError("Profil pegawai tidak ditemukan untuk akun ini.", 404);
  }
  return employee._id;
};

export const renderAttendancePage = async (req, res, next) => {
  try {
    const user = req.user;
    const employeeId = await getEmployeeIdFromUser(user._id, user.role);

    if (!employeeId) {
      return res.render("attendance/create", {
        title: "Absensi",
        attendance: null,
        already: false,
        hasCheckedOut: false,
        absenceStatus: null,
        error: "Akun administrator tidak ditautkan ke profil pegawai.",
      });
    }

    const absenceStatus = await checkTodayAbsenceStatus(employeeId, user._id);
    const attendance = await getTodayAttendance(employeeId);

    res.render("attendance/create", {
      title: "Absensi",
      attendance,
      already: !!attendance,
      hasCheckedOut: !!attendance?.checkOut,
      absenceStatus,
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

    const employeeId = await getEmployeeIdFromUser(user._id, user.role);
    if (!employeeId)
      throw new AppError("Hanya akun dengan profil pegawai yang dapat melakukan absensi.", 403);

    await processCheckIn(employeeId, req.body, req.file, user._id);

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

    const employeeId = await getEmployeeIdFromUser(user._id, user.role);
    if (!employeeId)
      throw new AppError("Hanya akun dengan profil pegawai yang dapat melakukan absensi.", 403);

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

    const { listAttendance, analytics, isAdmin, activeView, tabCounters, filters } =
      await getAttendanceHistory(user, req.query);

    const isPersonalView = activeView === "personal";

    res.render("attendance/history", {
      title: "Riwayat Kehadiran",
      listAttendance,
      analytics,
      isAdmin,
      isPersonalView,
      activeView,
      tabCounters,
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
