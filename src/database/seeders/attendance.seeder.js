import mongoose from "mongoose";
import Attendance from "../../models/Attendance.model.js";
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

const seedAttendanceSpesifik = async () => {
  try {
    const targetUsername = "duwihartati";
    console.log(`🔍 Mencari user dengan username: ${targetUsername}...`);

    const user = await User.findOne({ username: targetUsername });
    if (!user) {
      console.log(
        `[ERROR] User dengan username "${targetUsername}" tidak ditemukan di database. Seeding dibatalkan.`
      );
      return;
    }

    const employee = await Employee.findOne({ userId: user._id });
    if (!employee) {
      console.log(
        `[ERROR] Profil Employee untuk user "${targetUsername}" tidak ditemukan. Seeding dibatalkan.`
      );
      return;
    }

    const objectIdEmployee = employee._id;
    console.log(
      `👥 Memulai injeksi data absensi khusus EMPLOYEE: ${employee.fullName} (ID: ${objectIdEmployee})`
    );

    const deleteStart = new Date(Date.UTC(2026, 5, 10));
    const deleteEnd = new Date(Date.UTC(2026, 6, 9, 23, 59, 59));

    await Attendance.deleteMany({
      employeeId: objectIdEmployee,
      checkIn: { $gte: deleteStart, $lte: deleteEnd },
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

    if (availableWorkDays.length < 15) {
      console.log(
        `[WARNING] Hari kerja yang tersedia (${availableWorkDays.length} hari) kurang dari target 15 kehadiran.`
      );
      return;
    }

    shuffleArray(availableWorkDays);
    const kehadiranDays = availableWorkDays.slice(0, 15);
    const absenDays = availableWorkDays.slice(15);

    const absensiData = [];

    for (const date of kehadiranDays) {
      let status = "HADIR";
      let note = "";
      let lateDuration = 0;

      const checkInOffset = getRandomInt(-15, 20);
      const checkInTime = new Date(date);
      checkInTime.setUTCHours(1, checkInOffset, 0, 0);

      if (checkInOffset > 15) {
        status = "TELAT";
        lateDuration = checkInOffset - 15;
        note = `Terlambat masuk ${lateDuration} menit.`;
      } else if (checkInOffset > 0 && checkInOffset <= 15) {
        note = "Hadir dalam masa toleransi (Grace Period).";
      } else {
        note = "Hadir tepat waktu.";
      }

      const checkOutOffset = getRandomInt(0, 15);
      const checkOutTime = new Date(date);
      checkOutTime.setUTCHours(10, checkOutOffset, 0, 0);

      const workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));

      absensiData.push({
        employeeId: objectIdEmployee,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workDuration,
        lateDuration,
        status,
        type: "KANTOR",
        note,
      });
    }

    for (const date of absenDays) {
      const randAbsen = getRandomInt(1, 2);
      const status = randAbsen === 1 ? "IZIN" : "SAKIT";
      const note =
        status === "IZIN"
          ? "Izin keperluan keluarga mendesak."
          : "Sakit dengan keterangan surat dokter.";

      absensiData.push({
        employeeId: objectIdEmployee,
        checkIn: null,
        checkOut: null,
        workDuration: 0,
        lateDuration: 0,
        status,
        type: "KANTOR",
        note,
        createdAt: date,
      });
    }

    if (absensiData.length > 0) {
      absensiData.sort((a, b) => (a.checkIn || a.createdAt) - (b.checkIn || b.createdAt));

      await Attendance.insertMany(absensiData);

      const totalHadir = absensiData.filter(
        (d) => d.status === "HADIR" || d.status === "TELAT"
      ).length;
      console.log(
        `[SUCCESS] Seeding selesai! Berhasil menyuntikkan ${absensiData.length} data absensi untuk "${targetUsername}". Total Kehadiran: ${totalHadir} kali.`
      );
    }
  } catch (error) {
    console.error("Gagal seeding data attendance spesifik:", error);
  }
};

export default seedAttendanceSpesifik;
