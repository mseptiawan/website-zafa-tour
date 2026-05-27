import cron from "node-cron";
import User from "./models/basic/User.js";
import Attendance from "./models/Attendance.js";
import LeaveRequest from "./models/LeaveRequest.js";

cron.schedule("59 23 * * *", async () => {
  console.log("Menjalankan pengecekan absensi otomatis...");

  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const employees = await User.find({ role: "KARYAWAN" });

    for (const employee of employees) {
      const hasAttendance = await Attendance.findOne({
        userId: employee._id,
        checkIn: { $gte: start, $lte: end },
      });

      if (!hasAttendance) {
        const leave = await LeaveRequest.findOne({
          userId: employee._id,
          status: "APPROVED",
          startDate: { $lte: end },
          endDate: { $gte: start },
        });

        let finalStatus = "ALPHA";

        if (leave) {
          finalStatus = leave.type;
        }

        await Attendance.create({
          userId: employee._id,
          status: finalStatus,
          note: leave ? `Otomatis sistem: ${leave.reason}` : "Tanpa keterangan (Alpha)",
          type: "KANTOR",
          checkIn: null,
          checkOut: null,
        });

        console.log(`User ${employee.username} diset -> ${finalStatus}`);
      }
    }
    console.log("Pengecekan absensi harian selesai.");
  } catch (error) {
    console.error("Gagal menjalankan cron job absensi:", error);
  }
});
