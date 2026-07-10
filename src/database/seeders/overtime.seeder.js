import mongoose from "mongoose";
import { Overtime } from "../../models/Overtime.model.js";
import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";

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
    const targetUsername = "duwihartati";
    console.log(`🔍 Mencari user dengan username untuk Overtime: ${targetUsername}...`);

    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      console.log(
        `[ERROR] User dengan username "${targetUsername}" tidak ditemukan. Seeding lembur dibatalkan.`
      );
      return;
    }

    const employee = await Employee.findOne({ userId: user._id }).populate("careerData");
    if (!employee) {
      console.log(
        `[ERROR] Profil Employee untuk user "${targetUsername}" tidak ditemukan. Seeding lembur dibatalkan.`
      );
      return;
    }

    const objectIdEmployee = employee._id;
    const bidangId = employee.careerData?.bidangId || new mongoose.Types.ObjectId();

    console.log(
      `⏳ Memulai injeksi data LEMBUR khusus EMPLOYEE: ${employee.fullName} (ID: ${objectIdEmployee})`
    );

    const deleteStart = new Date(Date.UTC(2026, 5, 10));
    const deleteEnd = new Date(Date.UTC(2026, 6, 9, 23, 59, 59));

    await Overtime.deleteMany({
      employeeId: objectIdEmployee,
      date: { $gte: deleteStart, $lte: deleteEnd },
    });

    const startDate = new Date(Date.UTC(2026, 5, 10));
    const endDate = new Date(Date.UTC(2026, 6, 9));
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
    const targetOvertimeCount = Math.min(5, availableWorkDays.length);
    const overtimeDays = availableWorkDays.slice(0, targetOvertimeCount);

    const overtimeData = [];

    const taskDescriptions = [
      "Optimasi query database core system dan penyesuaian index.",
      "Fix bug modul penggajian karyawan dan sinkronisasi UTC date.",
      "Deployment update sistem absensi sidik jari ke server staging.",
      "Penyusunan laporan rekapitulasi data keuangan kuartal kedua.",
      "Refactoring repositori middleware otentikasi role management.",
    ];

    for (let i = 0; i < overtimeDays.length; i++) {
      const date = overtimeDays[i];

      const totalHours = getRandomInt(2, 4);
      const startHour = 17;
      const endHour = startHour + totalHours;

      overtimeData.push({
        userId: user._id,
        employeeId: objectIdEmployee,
        employeeName: employee.fullName,
        date: date,
        startTime: `${startHour}:00`,
        endTime: `${endHour}:00`,
        totalHours: totalHours,
        workDescription: taskDescriptions[i % taskDescriptions.length],
        result: "Pekerjaan diselesaikan dengan baik dan siap di-review.",
        proofFile: "/uploads/overtime/default-proof.png",
        location: {
          type: "OFFICE",
          detail: "Ruang Kerja IT Lt. 2",
        },
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
            note: "Approved secara otomatis oleh sistem seeder.",
            at: new Date(date),
          },
        ],
        payrollPeriodId: "2026-07",
        payrollStatus: "PENDING",
        overtimeRateSnapshot: 25000,
        multiplierSnapshot: 1.5,
        bidangId: bidangId,
        requiredManagerRole: "HR",
      });
    }

    if (overtimeData.length > 0) {
      overtimeData.sort((a, b) => a.date - b.date);

      await Overtime.insertMany(overtimeData);

      console.log(
        `[SUCCESS] Seeding Overtime selesai! Berhasil menyuntikkan ${overtimeData.length} data lembur APPROVED untuk "${targetUsername}" pada periode 2026-07.`
      );
    }
  } catch (error) {
    console.error("Gagal seeding data overtime spesifik:", error);
  }
};

export default seedOvertimeSpesifik;
