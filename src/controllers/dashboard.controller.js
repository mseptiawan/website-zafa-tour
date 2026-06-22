import moment from "moment";
import Attendance from "../models/Attendance.model.js";
import DailyLog from "../models/DailyLog.model.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import Holiday from "../models/calender/Holiday.model.js";
import Announcement from "../models/Announcement.model.js";

export const index = async (req, res, next) => {
  try {
    console.log("debug");
    const user = req.session.user;
    if (!user) {
      return res.redirect("/?error=SESSION_EXPIRED");
    }

    const userId = user._id;
    const currentYear = new Date().getFullYear();
    const tanggalHariIni = moment().format("YYYY-MM-DD");

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const [
      attendanceToday,
      monthlyAttendance,
      dailyLogsToday,
      myActiveTrips,
      nextHoliday,
      latestAnnouncements,
    ] = await Promise.all([
      Attendance.findOne({ userId, checkIn: { $gte: startToday, $lte: endToday } }),

      Attendance.find({
        userId,
        createdAt: {
          $gte: new Date(currentYear, new Date().getMonth(), 1),
          $lte: endToday,
        },
      }),

      DailyLog.find({ userId, tanggal: tanggalHariIni }).sort({ createdAt: 1 }),

      BusinessTrip.find({ userId }).sort({ createdAt: -1 }).limit(3),

      Holiday.findOne({
        date: { $gte: startToday },
        $or: [{ year: currentYear }, { isRecurring: true }],
      }).sort({ date: 1 }),

      Announcement.find({ status: "PUBLISHED" }).sort({ createdAt: -1 }).limit(3),
    ]);

    const hadirCount = monthlyAttendance.filter((a) => a.status === "HADIR").length;
    const telatCount = monthlyAttendance.filter((a) => a.status === "TELAT").length;
    const alpaCount = monthlyAttendance.filter((a) => a.status === "ALPA").length;

    return res.render("dashboard/main", {
      title: "Dashboard",
      user,
      moment,

      attendance: attendanceToday,
      already: !!attendanceToday,
      hasCheckedOut: !!attendanceToday?.checkOut,
      checkInTimeStr:
        attendanceToday && attendanceToday.checkIn
          ? moment(attendanceToday.checkIn).format("HH:mm")
          : null,
      rekapAbsen: {
        hadir: hadirCount,
        telat: telatCount,
        alpa: alpaCount,
      },

      initialLogs: dailyLogsToday,
      myTrips: myActiveTrips,
      nextHoliday,
      latestAnnouncements,
    });
  } catch (error) {
    console.error("Error Dashboard Controller:", error);
    return next(error);
  }
};
