import Attendance from "../models/Attendance.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

export const getAttendanceSummary = async (userId, date = new Date()) => {
  const period = getPayrollPeriod(date);

  const totalDaysPresent = await Attendance.countDocuments({
    userId: userId,
    checkIn: {
      $gte: period.start,
      $lte: period.end,
    },
    // Sesuaikan dengan enum di skema: Hitung hari jika pegawai HADIR atau TELAT
    status: { $in: ["HADIR", "TELAT"] },
  });

  return {
    period,
    totalDaysPresent,
  };
};
