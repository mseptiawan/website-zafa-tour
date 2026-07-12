import Leave from "../models/leave/Leave.model.js";
import Permit from "../models/Permit.model.js";
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

export const checkTodayAbsenceStatus = async (employeeId, userId) => {
  const { start, end } = getTodayRange();

  const [permit, leave] = await Promise.all([
    Permit.findOne({
      employeeId,
      date: { $gte: start, $lte: end },
      status: "APPROVED",
    }).lean(),
    Leave.findOne({
      userId,
      startDate: { $lte: end },
      endDate: { $gte: start },
      status: "APPROVED",
    }).lean(),
  ]);

  if (permit) {
    return { type: "IZIN", detail: `IZIN (${permit.type})` };
  }
  if (leave) {
    return { type: "CUTI", detail: `CUTI (${leave.totalDays} Hari)` };
  }

  return null;
};

export const getTodayAttendance = async (employeeId) => {
  const { start, end } = getTodayRange();
  return Attendance.findOne({
    employeeId,
    checkIn: { $gte: start, $lte: end },
  });
};

export const processCheckIn = async (employeeId, body, file, userId) => {
  const absenceStatus = await checkTodayAbsenceStatus(employeeId, userId);
  if (absenceStatus) {
    throw new AppError(
      `Anda tidak dapat melakukan check-in karena hari ini berstatus ${absenceStatus.type}.`,
      400
    );
  }

  const { start, end } = getTodayRange();

  const already = await Attendance.findOne({
    employeeId,
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
    employeeId,
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

export const processCheckOut = async (employeeId, body, file) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const attendance = await Attendance.findOne({
    employeeId,
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
  const { startDate, endDate, view = "all" } = query;

  const ADMIN_ROLES = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_ADMINISTRASI", "HRD", "ADMIN"];
  const isAdmin = ADMIN_ROLES.includes(sessionUser.role);

  const activeView = isAdmin ? view : "personal";

  let start;
  let end;

  if (startDate && endDate) {
    start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
  } else {
    start = new Date();
    start.setHours(0, 0, 0, 0);
    end = new Date();
    end.setHours(23, 59, 59, 999);
  }

  let targetEmployeeId = null;
  let targetUserId = sessionUser._id;

  const currentEmp = await Employee.findOne({ userId: sessionUser._id }).select("_id userId");
  if (currentEmp) {
    targetEmployeeId = currentEmp._id;
  }

  const isFilteringPersonal = activeView === "personal" || !isAdmin;

  const attendanceMatch = {
    $or: [
      { checkIn: { $gte: start, $lte: end } },
      { status: "ALPHA", createdAt: { $gte: start, $lte: end } },
    ],
    ...(isFilteringPersonal ? { employeeId: targetEmployeeId } : {}),
  };

  const permitMatch = {
    date: { $gte: start, $lte: end },
    status: "APPROVED",
    ...(isFilteringPersonal ? { employeeId: targetEmployeeId } : {}),
  };

  const leaveMatch = {
    startDate: { $lte: end },
    endDate: { $gte: start },
    status: "APPROVED",
    ...(isFilteringPersonal ? { userId: targetUserId } : {}),
  };

  let rawAttendance = [];
  let rawPermits = [];
  let rawLeaves = [];

  try {
    [rawAttendance, rawPermits, rawLeaves] = await Promise.all([
      Attendance.find(attendanceMatch)
        .populate({
          path: "employeeId",
          select: "fullName",
          populate: { path: "userId", select: "username" },
        })
        .lean(),
      Permit.find(permitMatch).populate("employeeId", "fullName").lean(),
      Leave.find(leaveMatch).populate({ path: "userId", select: "username" }).lean(),
    ]);
  } catch (dbError) {
    console.error("⚠️ DETEKSI DATA KOTOR/ERROR DI DATABASE:", dbError.message);
  }

  const formattedPermits = rawPermits
    .filter(
      (permit) =>
        permit.employeeId &&
        mongoose.Types.ObjectId.isValid(permit.employeeId._id || permit.employeeId)
    )
    .map((permit) => ({
      _id: permit._id,
      employeeId: permit.employeeId,
      fullName: permit.employeeId?.fullName || "-",
      checkIn: permit.date,
      checkOut: null,
      status: "IZIN",
      displayStatus: `IZIN (${permit.type})`,
      note: permit.reason,
      isAdditionalData: true,
    }));

  let userToEmployeeMap = {};
  if (isAdmin) {
    const allEmployees = await Employee.find().select("userId fullName").lean();
    allEmployees.forEach((emp) => {
      if (emp.userId) {
        userToEmployeeMap[emp.userId.toString()] = emp.fullName;
      }
    });
  }

  const formattedLeaves = rawLeaves.map((leave) => {
    const isOwnLeave =
      leave.userId?._id?.toString() === targetUserId?.toString() ||
      leave.userId?.toString() === targetUserId?.toString();
    const fullName = isOwnLeave
      ? sessionUser.username
      : userToEmployeeMap[leave.userId?._id?.toString() || leave.userId?.toString()] || "-";

    return {
      _id: leave._id,
      userId: leave.userId,
      fullName: fullName,
      checkIn: leave.startDate,
      endDate: leave.endDate,
      checkOut: null,
      status: "CUTI",
      displayStatus: `CUTI (${leave.totalDays} Hari)`,
      note: leave.reason,
      isAdditionalData: true,
    };
  });

  let baseAttendance = rawAttendance
    .filter((doc) => doc.employeeId && typeof doc.employeeId === "object" && doc.employeeId._id)
    .map((obj) => ({
      ...obj,
      fullName: obj.employeeId?.fullName || "-",
      displayStatus: obj.status,
    }));

  const allTabRecords = [...baseAttendance, ...formattedPermits, ...formattedLeaves];

  const alphaTabRecords = allTabRecords.filter((item) => item.status === "ALPHA");

  let missingAttendanceData = [];
  if (isAdmin) {
    const attendedInPeriod = baseAttendance
      .map((b) => b.employeeId?._id?.toString())
      .filter(Boolean);
    const permittedEmpIds = formattedPermits
      .map((p) => p.employeeId?._id?.toString() || p.employeeId?.toString())
      .filter(Boolean);

    const missingEmployees = await Employee.find({
      _id: { $nin: [...attendedInPeriod, ...permittedEmpIds] },
    })
      .populate("userId", "username")
      .lean();

    missingAttendanceData = missingEmployees.map((emp) => ({
      _id: `missing-${emp._id}`,
      employeeId: emp,
      fullName: emp.fullName || "-",
      checkIn: null,
      checkOut: null,
      createdAt: start,
      status: "BELUM ABSEN",
      displayStatus: "BELUM ABSEN",
      lateDuration: 0,
      checkInPhoto: null,
      isMissing: true,
    }));
  }

  const personalTabRecords = allTabRecords.filter(
    (item) =>
      item.employeeId?._id?.toString() === targetEmployeeId?.toString() ||
      item.userId?._id?.toString() === targetUserId?.toString() ||
      item.userId === targetUserId?.toString()
  );

  const tabCounters = {
    all: isAdmin ? allTabRecords.length : 0,
    missing: isAdmin ? missingAttendanceData.length : 0,
    alpha: isAdmin ? alphaTabRecords.length : 0,
    personal: isAdmin ? personalTabRecords.length : allTabRecords.length,
  };

  let listAttendance = [];
  if (activeView === "all") {
    listAttendance = allTabRecords;
  } else if (activeView === "missing") {
    listAttendance = missingAttendanceData;
  } else if (activeView === "alpha") {
    listAttendance = alphaTabRecords;
  } else if (activeView === "personal") {
    listAttendance = isAdmin ? personalTabRecords : allTabRecords;
  }

  listAttendance.sort((a, b) => {
    const dateA = a.checkIn ? new Date(a.checkIn) : new Date(a.createdAt || 0);
    const dateB = b.checkIn ? new Date(b.checkIn) : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  const analytics = {
    totalHadir: 0,
    totalLateDays: 0,
    totalLateMinutes: 0,
    totalIzinCuti: 0,
    totalAlpha: 0,
  };

  listAttendance.forEach((row) => {
    if (row.status === "HADIR" || row.status === "TELAT") {
      analytics.totalHadir += 1;
    }
    if (row.lateDuration > 0 || row.status === "TELAT") {
      analytics.totalLateDays += 1;
      analytics.totalLateMinutes += parseInt(row.lateDuration || 0, 10);
    }
    if (row.status === "IZIN" || row.status === "CUTI") {
      analytics.totalIzinCuti += 1;
    }
    if (row.status === "ALPHA") {
      analytics.totalAlpha += 1;
    }
  });

  return {
    listAttendance,
    analytics,
    isAdmin,
    activeView,
    tabCounters,
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

export const getAttendanceSummary = async (employeeId, date = new Date()) => {
  const period = getPayrollPeriod(date);

  const totalDaysPresent = await Attendance.countDocuments({
    employeeId: employeeId,
    checkIn: {
      $gte: period.start,
      $lte: period.end,
    },
    status: { $in: ["HADIR", "TELAT"] },
  });

  return {
    period,
    totalDaysPresent,
  };
};
