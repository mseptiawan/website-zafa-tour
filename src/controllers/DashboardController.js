import moment from "moment";
import Attendance from "../models/Attendance.js";
import DailyLog from "../models/DailyLog.js";
import BusinessTrip from "../models/BusinessTrip.js";
import Overtime from "../models/Overtime.js";
import Kpi from "../models/kpi/Kpi.js";
import Holiday from "../models/calender/Holiday.model.js";

export const index = async (req, res, next) => {
  try {
    const user = req.session.user;
    if (!user) {
      return res.redirect("/?error=SESSION_EXPIRED");
    }

    const userId = user._id;
    const currentYear = new Date().getFullYear();
    const tanggalHariIni = moment().format("YYYY-MM-DD");

    // Range waktu hari ini untuk check absensi
    const startToday = new Date();
    startToday.setHours(0, 0, 0, 0);
    const endToday = new Date();
    endToday.setHours(23, 59, 59, 999);

    /*
    |--------------------------------------------------------------------------
    | PARALLEL QUERIES (PROMISE.ALL)
    |--------------------------------------------------------------------------
    */
    const [
      attendanceToday,
      monthlyAttendance,
      dailyLogsToday,
      myActiveTrips,
      myLastKpi,
      nextHoliday,
      pendingOvertimeApprovals,
      pendingTripApprovals,
    ] = await Promise.all([
      // 1. Absensi hari ini
      Attendance.findOne({ userId, checkIn: { $gte: startToday, $lte: endToday } }),

      // 2. Rekap absensi bulan ini
      Attendance.find({
        userId,
        createdAt: {
          $gte: new Date(currentYear, new Date().getMonth(), 1),
          $lte: endToday,
        },
      }),

      // 3. Daily Log hari ini
      DailyLog.find({ userId, tanggal: tanggalHariIni }).sort({ createdAt: 1 }),

      // 4. Perjalanan Dinas Saya (Ambil 3 terakhir)
      BusinessTrip.find({ userId }).sort({ createdAt: -1 }).limit(3),

      Kpi.findOne({ employeeId: user.employeeData?._id || userId }).sort({ periode: -1 }),

      Holiday.findOne({
        date: { $gte: startToday },
        $or: [{ year: currentYear }, { isRecurring: true }],
      }).sort({ date: 1 }),

      user.role === "MANAGER_ADMINISTRASI"
        ? Overtime.find({ status: "Pending Manager", userId: { $ne: userId } })
            .populate("userId")
            .sort({ createdAt: -1 })
            .limit(5)
        : [],

      ["MANAGER_ADMINISTRASI", "WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(user.role)
        ? BusinessTrip.find({ status: "PENDING_APPROVAL" }) // Sesuai logika getApprovalTripsService(user.role)
            .populate("userId")
            .sort({ createdAt: -1 })
            .limit(5)
        : [],
    ]);

    const hadirCount = monthlyAttendance.filter((a) => a.status === "HADIR").length;
    const telatCount = monthlyAttendance.filter((a) => a.status === "TELAT").length;
    const alpaCount = monthlyAttendance.filter((a) => a.status === "ALPA").length;

    return res.render("dashboard/main", {
      title: "Dashboard Zafa Tour",
      user,

      attendance: attendanceToday,
      already: !!attendanceToday,
      hasCheckedOut: !!attendanceToday?.checkOut,
      rekapAbsen: {
        hadir: hadirCount,
        telat: telatCount,
        alpa: alpaCount,
      },

      // Log & Trip & KPI
      initialLogs: dailyLogsToday,
      myTrips: myActiveTrips,
      kpiTerakhir: myLastKpi,
      nextHoliday,

      // Pengganti Fitur Cuti -> Antrean Verifikasi Kerja Tim (Untuk Atasan/HR)
      pendingOvertimeApprovals,
      pendingTripApprovals,
    });
  } catch (error) {
    console.error("Error Dashboard Controller:", error);
    return next(error);
  }
};
