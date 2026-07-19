import mongoose from "mongoose";
import { Overtime } from "../../models/Overtime.model.js";
import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";
import { getPayrollPeriod } from "../../utils/payrollPeriod.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const seedOvertimeSpesifik = async () => {
  try {
    // 1. Target Multi-User sesuai permintaan
    const targetUsernames = ["duwihartati", "abdulaziz", "basoherman", "fajarjaniko"];
    console.log(`🔍 Memulai seeding Overtime untuk user: ${targetUsernames.join(", ")}...`);

    // 2. Rentang waktu dinamis 2 bulan terakhir (Mei - Juli 2026)
    const startDate = new Date(Date.UTC(2026, 4, 27)); // 10 Mei 2026
    const endDate = new Date(Date.UTC(2026, 6, 28)); // 9 Juli 2026

    const taskDescriptions = [
      "Optimasi query database core system dan penyesuaian index.",
      "Fix bug modul penggajian karyawan dan sinkronisasi UTC date.",
      "Deployment update sistem absensi sidik jari ke server staging.",
      "Penyusunan laporan rekapitulasi data keuangan kuartal kedua.",
      "Refactoring repositori middleware otentikasi role management.",
      "Sinkronisasi API gateway dan pengecekan log error production.",
      "Pembersihan berkas log serta sinkronisasi cron-job otomatis.",
    ];

    for (const username of targetUsernames) {
      const user = await User.findOne({ username: username });
      if (!user) {
        console.log(`[WARN] User dengan username "${username}" tidak ditemukan. Skipping...`);
        continue;
      }

      const employee = await Employee.findOne({ userId: user._id }).populate("careerData");
      if (!employee) {
        console.log(`[WARN] Profil Employee untuk "${username}" tidak ditemukan. Skipping...`);
        continue;
      }

      const objectIdEmployee = employee._id;

      const activeCareer = Array.isArray(employee.careerData)
        ? employee.careerData[0]
        : employee.careerData;

      const bidangId = activeCareer?.bidangId || new mongoose.Types.ObjectId();

      await Overtime.deleteMany({
        employeeId: objectIdEmployee,
        date: { $gte: startDate, $lte: new Date(Date.UTC(2026, 6, 15)) },
      });

      let currentDate = new Date(startDate);
      const availableWorkDays = [];
      while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          availableWorkDays.push(new Date(currentDate));
        }
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
      }

      shuffleArray(availableWorkDays);
      const targetOvertimeCount = getRandomInt(6, 8);
      const overtimeDays = availableWorkDays.slice(
        0,
        Math.min(targetOvertimeCount, availableWorkDays.length)
      );

      const overtimeData = [];

      overtimeDays.forEach((date, i) => {
        const totalHours = getRandomInt(2, 4);
        const startHour = 17;
        const endHour = startHour + totalHours;

        const periodInfo = getPayrollPeriod(date);

        overtimeData.push({
          userId: user._id,
          employeeId: objectIdEmployee,
          employeeName: employee.fullName,
          date: date,
          startTime: `${startHour}:00`,
          endTime: `${endHour}:00`,
          totalHours: totalHours,
          workDescription: taskDescriptions[(i + username.length) % taskDescriptions.length],
          result: "Pekerjaan diselesaikan dengan baik dan siap di-review.",
          proofFile: "/uploads/overtime/default-proof.png",
          location: { type: "OFFICE", detail: "Ruang Kerja Internal Lt. 2" },
          status: "APPROVED",
          approvedBy: new mongoose.Types.ObjectId(),
          approvedAt: new Date(),
          approvalHistory: [
            {
              action: "SUBMITTED",
              by: user._id,
              role: "STAFF",
              note: "Mohon approval lembur pak.",
              at: new Date(date),
            },
            {
              action: "APPROVED",
              by: new mongoose.Types.ObjectId(),
              role: "HR",
              note: "Approved otomatis seeder.",
              at: new Date(date),
            },
          ],
          payrollPeriodId: periodInfo.id, // Berisi "2026-06" atau "2026-07" tergantung tanggalnya
          payrollStatus: "PENDING",
          overtimeRateSnapshot: 25000,
          multiplierSnapshot: 1.5,
          bidangId: bidangId,
          requiredManagerRole: "HR",
        });
      });

      if (overtimeData.length > 0) {
        overtimeData.sort((a, b) => a.date - b.date);
        await Overtime.insertMany(overtimeData);
        console.log(
          `[SUCCESS] Menyuntikkan ${overtimeData.length} data lembur APPROVED untuk "${username}".`
        );
      }
    }
    console.log("============== SEEDING MULTI-USER OVERTIME BERHASIL ============");
  } catch (error) {
    console.error("Gagal seeding data overtime spesifik:", error);
  }
};

export default seedOvertimeSpesifik;
