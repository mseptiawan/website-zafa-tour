import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/employee/Employee.model.js";
import CompanySetting from "../models/CompanySetting.model.js";
import User from "../models/basic/User.model.js";
import AppError from "../utils/AppError.js";
import { uploadAndCompressToR2 } from "../utils/r2Service.js";
// ─── Helpers ────────────────────────────────────────────────────────────────

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

// ─── Service Functions ───────────────────────────────────────────────────────

/**
 * Ambil data absensi hari ini milik user.
 * @param {string} userId
 * @returns {Object|null} attendance document
 */
export const getTodayAttendance = async (userId) => {
  const { start, end } = getTodayRange();
  return Attendance.findOne({
    userId,
    checkIn: { $gte: start, $lte: end },
  });
};

/**
 * Proses check-in user.
 * @param {string} userId
 * @param {Object} body   – { lat, lng, accuracy, note }
 * @param {Object|null} file – multer file object
 * @returns {Object} attendance document baru
 */
export const processCheckIn = async (userId, body, file) => {
  const { start, end } = getTodayRange();

  const already = await Attendance.findOne({
    userId,
    checkIn: { $gte: start, $lte: end },
  });
  if (already) throw new AppError("Anda sudah melakukan check-in hari ini.", 400);

  const lat = parseFloat(body.lat);
  const lng = parseFloat(body.lng);
  if (isNaN(lat) || isNaN(lng)) throw new AppError("Koordinat lokasi tidak valid.", 400);

  let company = await CompanySetting.findOne();
  if (!company) company = await CompanySetting.create({});

  const distance = haversineDistance(company.lat, company.lng, lat, lng);
  const type = distance <= company.radiusMeter ? "KANTOR" : "LUAR KANTOR";
  const locationLabel = type === "KANTOR" ? `Absen di ${company.name}` : await getAddress(lat, lng);

  const photoUrl = file ? await uploadAndCompressToR2(file, "checkin") : null;

  const now = new Date();

  const [hour, minute] = company.entryTimeLimit.split(":").map(Number);

  const timeLimit = new Date();
  timeLimit.setHours(hour, minute, 0, 0);

  const graceLimit = new Date(timeLimit.getTime() + (company.gracePeriodMinutes || 0) * 60000);

  let status = "HADIR";
  let lateDuration = 0;

  if (now > graceLimit) {
    status = "TELAT";
    lateDuration = Math.ceil((now - graceLimit) / 60000);
  }
  return Attendance.create({
    userId,
    checkIn: now,
    status,
    lateDuration,
    type,
    note: body.note || "",
    checkInPhoto: photoUrl,
    location: {
      lat,
      lng,
      address: locationLabel,
      accuracy: body.accuracy || 0,
    },
    deviceInfo: {
      userAgent: body._userAgent || "",
      platform: "WEB",
    },
  });
};

/**
 * Proses check-out user.
 * @param {string} userId
 * @param {Object} body   – { lat, lng }
 * @param {Object|null} file – multer file object
 * @returns {Object} attendance document yang diperbarui
 */
export const processCheckOut = async (userId, body, file) => {
  const { start, end } = getTodayRange();

  const attendance = await Attendance.findOne({
    userId,
    checkIn: { $gte: start, $lte: end },
  });
  if (!attendance) throw new AppError("Anda belum memiliki record check-in hari ini.", 400);
  if (attendance.checkOut) throw new AppError("Anda telah melakukan check-out hari ini.", 400);

  const lat = parseFloat(body.lat);
  const lng = parseFloat(body.lng);
  const now = new Date();

  const photoUrl = file ? await uploadAndCompressToR2(file, "checkout") : null;

  attendance.checkOut = now;
  attendance.checkOutPhoto = photoUrl;
  attendance.workDuration = Math.ceil((now - attendance.checkIn) / (1000 * 60));

  if (!isNaN(lat) && !isNaN(lng)) {
    attendance.checkOutLocation = {
      lat,
      lng,
      address: await getAddress(lat, lng),
    };
  }

  await attendance.save();
  return attendance;
};
/**
 * Ambil riwayat absensi.
 * @param {Object} sessionUser – data user dari req.session.user
 * @param {Object} query       – { startDate, endDate, view }
 * @returns {{ listAttendance, analytics, isAdmin, isPersonalView, filters }}
 */

/**
 * Ambil riwayat absensi dengan Sistem Otomatis Cut-off Perusahaan (Tanggal 27 - 26)
 * @param {Object} sessionUser – data user dari req.session.user
 * @param {Object} query       – { startDate, endDate, view }
 * @returns {{ listAttendance, analytics, isAdmin, isPersonalView, filters }}
 */
export const getAttendanceHistory = async (sessionUser, query) => {
  const { startDate, endDate, view } = query;

  // Sesuaikan kecocokan role admin Anda di backend
  const ADMIN_ROLES = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_ADMINISTRASI", "HRD", "ADMIN"];
  const isAdmin = ADMIN_ROLES.includes(sessionUser.role);
  const isPersonalView = isAdmin && view === "personal";

  let start;
  let end;

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    const period = getPayrollPeriod();

    start = period.start;
    end = period.end;
  }

  // Query dasar MongoDB (Mencocokkan field checkIn dengan rentang waktu Date)
  const matchQuery = {
    checkIn: { $gte: start, $lte: end },
    ...(isAdmin && !isPersonalView ? {} : { userId: new mongoose.Types.ObjectId(sessionUser._id) }),
  };

  // Ambil list kehadiran utama dari database
  let listAttendance = await Attendance.find(matchQuery)
    .populate("userId", "username")
    .sort({ checkIn: -1 });

  listAttendance = listAttendance.map((doc) => doc.toObject());

  // Injeksi data User yang tidak melakukan absensi (BELUM ABSEN / MANGKIR)
  if (isAdmin && !isPersonalView) {
    const attendedInPeriod = await Attendance.find({
      checkIn: { $gte: start, $lte: end },
    }).distinct("userId");

    const missingUsers = await User.find({
      role: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] }, // Filter management agar tidak masuk daftar alpa
      _id: { $nin: attendedInPeriod },
    }).select("username");

    const missingAttendanceData = missingUsers.map((emp) => ({
      _id: `missing-${emp._id}`,
      userId: { _id: emp._id, username: emp.username },
      checkIn: null,
      checkOut: null,
      createdAt: start,
      status: "BELUM ABSEN",
      lateDuration: 0,
      checkInPhoto: null,
      isMissing: true,
    }));

    listAttendance = [...missingAttendanceData, ...listAttendance];
  }

  // Map Nama Karyawan dari Koleksi Employee ke Objek Output
  const employees = await Employee.find({}).select("userId fullName");
  const employeeMap = new Map();
  employees.forEach((emp) => {
    if (emp.userId) {
      employeeMap.set(emp.userId.toString(), emp.fullName);
    }
  });

  listAttendance = listAttendance.map((item) => {
    const userIdStr = item.userId?._id?.toString() || item.userId?.toString();
    const fullName = employeeMap.get(userIdStr) || item.userId?.username || "-";
    return { ...item, fullName };
  });

  // Perhitungan Agregasi untuk Analytics Summary Card di Atas
  const summary = await Attendance.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalLateMinutes: {
          $sum: { $convert: { input: "$lateDuration", to: "int", onError: 0, onNull: 0 } },
        },
        totalLateDays: {
          $sum: {
            $cond: [
              {
                $gt: [
                  { $convert: { input: "$lateDuration", to: "int", onError: 0, onNull: 0 } },
                  0,
                ],
              },
              1,
              0,
            ],
          },
        },
        totalHadir: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $ne: ["$status", "BELUM ABSEN"] },
                  { $ne: ["$status", "ALPHA"] },
                  { $ne: ["$status", ""] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
  ]);

  // Kembalikan objek data yang siap dibaca oleh berkas EJS Anda
  return {
    listAttendance,
    analytics: summary[0] || { totalLateMinutes: 0, totalLateDays: 0, totalHadir: 0 },
    isAdmin,
    isPersonalView,
    filters: {
      // Mengonversi kembali format objek Date ke string YYYY-MM-DD untuk isi value di form HTML input
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    },
  };
};
/**
 * Perbarui lokasi & konfigurasi kantor.
 * @param {Object} body – { lat, lng, radiusMeter, entryTimeLimit, name }
 * @returns {Object} config yang diperbarui
 */
export const updateCompanyConfig = async (body) => {
  const { lat, lng, radiusMeter, entryTimeLimit, name } = body;

  let config = await CompanySetting.findOne();
  if (!config) config = new CompanySetting();

  if (lat) config.lat = parseFloat(lat);
  if (lng) config.lng = parseFloat(lng);
  if (radiusMeter) config.radiusMeter = parseInt(radiusMeter);
  if (entryTimeLimit) config.entryTimeLimit = entryTimeLimit;
  if (name) config.name = name;

  await config.save();
  return config;
};
