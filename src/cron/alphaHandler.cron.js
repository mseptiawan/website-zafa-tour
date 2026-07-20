import cron from "node-cron";
import Employee from "../models/employee/Employee.model.js";
import Attendance from "../models/Attendance.model.js";
import Permit from "../models/Permit.model.js";
import Leave from "../models/leave/Leave.model.js";

/**
 * Fungsi utama untuk memeriksa dan menyuntikkan status ALPHA bagi karyawan mangkir
 */
export const checkAndInjectAlphaStatus = async () => {
  console.log("🕒 [CRON] Memulai pemindaian otomatis status ketidakhadiran (ALPHA)...");

  try {
    // 1. Tentukan batas waktu hari ini (00:00:00 s.d 23:59:59) sesuai waktu lokal server
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

  
    const allEmployees = await Employee.find({}).select("_id userId fullName").lean();

    const [attendedRecords, permittedRecords, leaveRecords] = await Promise.all([
      Attendance.find({ checkIn: { $gte: startOfToday, $lte: endOfToday } })
        .select("employeeId")
        .lean(),
      Permit.find({ date: { $gte: startOfToday, $lte: endOfToday }, status: "APPROVED" })
        .select("employeeId")
        .lean(),
      Leave.find({
        startDate: { $lte: endOfToday },
        endDate: { $gte: startOfToday },
        status: "APPROVED",
      })
        .select("userId")
        .lean(),
    ]);

    // 4. Petakan ke bentuk Set string ID agar proses pencarian (lookup) cepat
    const attendedEmpIds = new Set(
      attendedRecords.map((r) => r.employeeId?.toString()).filter(Boolean)
    );
    const permittedEmpIds = new Set(
      permittedRecords.map((r) => r.employeeId?.toString()).filter(Boolean)
    );
    const leaveUserIds = new Set(leaveRecords.map((r) => r.userId?.toString()).filter(Boolean));

    const alphaDocuments = [];

    // 5. Filter karyawan yang tidak masuk dalam daftar hadir, izin, atau cuti
    for (const emp of allEmployees) {
      const empIdStr = emp._id.toString();
      const userIdStr = emp.userId?.toString();

      const hasAttended = attendedEmpIds.has(empIdStr);
      const hasPermit = permittedEmpIds.has(empIdStr);
      const hasLeave = userIdStr ? leaveUserIds.has(userIdStr) : false;

      // Jika tidak melakukan aktivitas apapun hari ini, maka dinyatakan ALPHA
      if (!hasAttended && !hasPermit && !hasLeave) {
        alphaDocuments.push({
          employeeId: emp._id,
          checkIn: null,
          checkOut: null,
          workDuration: 0,
          lateDuration: 0,
          status: "ALPHA",
          type: "KANTOR",
          note: "Sistem memproses otomatis: Tidak ada riwayat absensi atau ajuan berkas legal.",
          createdAt: startOfToday, // Dikunci pada awal hari berjalan
        });
      }
    }

    // 6. Bulk Insert ke database jika ada data mangkir
    if (alphaDocuments.length > 0) {
      await Attendance.insertMany(alphaDocuments);
      console.log(
        `✅ [CRON SUCCESS] Berhasil mencatat ${alphaDocuments.length} karyawan ALPHA harian.`
      );
    } else {
      console.log("ℹ️ [CRON] Pemindaian selesai. Semua staf patuh, nihil record ALPHA.");
    }
  } catch (error) {
    console.error(
      "❌ [CRON ERROR] Gagal mengeksekusi otomatisasi pencatatan ALPHA:",
      error.message
    );
  }
};

/**
 * Inisialisasi Penjadwalan Cron Job
 */
const initAlphaCronJob = () => {
  // Berjalan otomatis tepat pada jam 15:48 hari ini
  cron.schedule("9 00 * * *", async () => {
    console.log("🚀 [TESTING CRON] Trigger otomatis jam 15:48 aktif!");
    await checkAndInjectAlphaStatus();
  });
  console.log("🤖 [CRON-SERVICE] Mode testing aktif, menunggu eksekusi jam 15:48...");
};

export default initAlphaCronJob;
