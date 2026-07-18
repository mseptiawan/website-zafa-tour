import moment from "moment";
import Attendance from "../models/Attendance.model.js";
import DailyLog from "../models/DailyActivity.model.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import Holiday from "../models/calender/Holiday.model.js";
import Announcement from "../models/Announcement.model.js";

// Main Dashboard Renderer
export const renderDashboardPage = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.redirect("/?error=SESSION_EXPIRED");
    }

    // ─── 1. PILAH ID YANG BENAR Sesuai Koleksinya ───────────────────────────
    const userId = user._id; // Untuk Attendance, Trip, dll.
    const employeeId = user.employeeId; // Khusus untuk DailyActivity (menggunakan ID Employee)

    const currentYear = new Date().getFullYear();
    const tanggalHariIni = moment().format("YYYY-MM-DD");

    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const [
      attendanceToday,
      monthlyAttendance,
      dailyLogsToday, // <-- Variabel data yang dikirim ke EJS
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

      // ─── 2. PERBAIKAN QUERY: Gunakan employeeId, BUKAN userId ────────────────
      DailyLog.find({
        employeeId: employeeId, // Pastikan ini membidik ID Employee dari session
        activityDate: tanggalHariIni,
      })
        .populate("kpiTemplateId")
        .sort({ createdAt: 1 }),

      BusinessTrip.find({ userId }).sort({ createdAt: -1 }).limit(3),

      Holiday.findOne({
        date: { $gte: startToday },
        $or: [{ year: currentYear }, { isRecurring: true }],
      }).sort({ date: 1 }),

      Announcement.find({
        publishDate: { $lte: new Date() }, // Hanya ambil yang tanggal rilisnya sudah lewat/hari ini
      })
        .sort({ createdAt: -1 }) // Urutkan dari yang terbaru
        .limit(3), // Batasi 3 pengumuman teratas
    ]);

    // ─── 3. AMANKAN DATA BILA POPULATE KPI-NYA KOSONG ──────────────────────
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

      initialLogs: dailyLogsToday, // Mengirimkan hasil query yang sudah diperbaiki
      myTrips: myActiveTrips,
      nextHoliday,
      latestAnnouncements,
    });
  } catch (error) {
    console.error("Error Dashboard Controller:", error);
    return next(error);
  }
};

// API Endpoint Baru untuk Rekap Realtime (Dahtarkan ke Router Anda, contoh: router.get('/api/dashboard/attendance-summary', ...))
export const getMonthlyAttendanceSummary = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const userId = user._id;
    const currentYear = new Date().getFullYear();
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    const monthlyAttendance = await Attendance.find({
      userId,
      createdAt: {
        $gte: new Date(currentYear, new Date().getMonth(), 1),
        $lte: endToday,
      },
    });

    const hadirCount = monthlyAttendance.filter((a) => a.status === "HADIR").length;
    const telatCount = monthlyAttendance.filter((a) => a.status === "TELAT").length;
    const alpaCount = monthlyAttendance.filter((a) => a.status === "ALPA").length;

    return res.json({
      success: true,
      rekapAbsen: {
        hadir: hadirCount,
        telat: telatCount,
        alpa: alpaCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
