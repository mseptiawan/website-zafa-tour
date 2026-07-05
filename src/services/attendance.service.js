import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import mongoose from "mongoose";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/employee/Employee.model.js";
import CompanySetting from "../models/CompanySetting.model.js";
import User from "../models/basic/User.model.js";
import AppError from "../utils/AppError.js";
import { uploadAndCompressToR2 } from "../utils/r2Service.js";

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

export const getTodayAttendance = async (userId) => {
  const { start, end } = getTodayRange();
  return Attendance.findOne({
    userId,
    checkIn: { $gte: start, $lte: end },
  });
};

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

  let matchedLocation = null;

  if (company.locations && company.locations.length > 0) {
    for (const loc of company.locations) {
      const distance = haversineDistance(loc.lat, loc.lng, lat, lng);
      if (distance <= loc.radiusMeter) {
        matchedLocation = loc;
        break;
      }
    }
  }

  const type = matchedLocation ? matchedLocation.locationName : "LUAR KANTOR";
  const locationLabel = matchedLocation
    ? `Absen di ${matchedLocation.locationName}`
    : await getAddress(lat, lng);

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

export const getAttendanceHistory = async (sessionUser, query) => {
  const { startDate, endDate, view } = query;

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

  const matchQuery = {
    checkIn: { $gte: start, $lte: end },
    ...(isAdmin && !isPersonalView ? {} : { userId: new mongoose.Types.ObjectId(sessionUser._id) }),
  };

  let listAttendance = await Attendance.find(matchQuery)
    .populate("userId", "username")
    .sort({ checkIn: -1 });

  listAttendance = listAttendance.map((doc) => doc.toObject());

  if (isAdmin && !isPersonalView) {
    const attendedInPeriod = await Attendance.find({
      checkIn: { $gte: start, $lte: end },
    }).distinct("userId");

    const missingUsers = await User.find({
      role: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] },
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

  return {
    listAttendance,
    analytics: summary[0] || { totalLateMinutes: 0, totalLateDays: 0, totalHadir: 0 },
    isAdmin,
    isPersonalView,
    filters: {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    },
  };
};

export const updateCompanyConfig = async (body) => {
  const { entryTimeLimit, gracePeriodMinutes, name, locations } = body;

  let config = await CompanySetting.findOne();
  if (!config) config = new CompanySetting();

  if (entryTimeLimit) config.entryTimeLimit = entryTimeLimit;
  if (gracePeriodMinutes !== undefined) config.gracePeriodMinutes = parseInt(gracePeriodMinutes);
  if (name) config.name = name;
  if (locations && Array.isArray(locations)) config.locations = locations;

  await config.save();
  return config;
};
