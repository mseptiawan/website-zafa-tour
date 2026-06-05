import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedAttendanceBulanLalu = async () => {
  try {
    // 1. Filter hanya 3 target utama untuk demo sidang
    const targetUsernames = ["fajarjaniko", "abdulaziz", "ongkidwi"];

    // Cari data user berdasarkan username target
    const users = await User.find({
      username: { $in: targetUsernames.map((name) => new RegExp(name, "i")) },
    });

    if (!users.length) {
      console.log(
        "❌ Tidak ada user target (fajarjaniko, abdulaziz, ongkidwi) yang ditemukan di database."
      );
      return;
    }

    console.log(`👥 Memulai injeksi data absensi khusus untuk ${users.length} pegawai target.`);

    // 2. Bersihkan data absensi lama HANYA milik 3 orang ini agar tidak merusak data pegawai lain
    await Attendance.deleteMany({
      userId: { $in: users.map((u) => u._id) },
    });

    const absensiData = [];

    // Rentang tanggal siklus payroll: 27 Mei 2026 s/d 26 Juni 2026
    const startDate = new Date(Date.UTC(2026, 4, 27));
    const endDate = new Date(Date.UTC(2026, 5, 26));

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();

      // Skip Sabtu & Minggu
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (const user of users) {
          const rand = getRandomInt(1, 100);

          let status = "HADIR";
          let note = "";
          let checkInTime = null;
          let checkOutTime = null;
          let workDuration = 0;
          let lateDuration = 0;

          // Naikkan probabilitas hadir menjadi 90% khusus demo agar rekap absennya terlihat bagus
          if (rand <= 90) {
            status = "HADIR";

            const checkInOffset = getRandomInt(-15, 20);

            checkInTime = new Date(currentDate);
            checkInTime.setUTCHours(1, checkInOffset, 0, 0); // Jam 08:00 WIB (UTC+7)

            if (checkInOffset > 0) {
              lateDuration = checkInOffset;
              note = `Terlambat masuk ${lateDuration} menit`;
            } else {
              note = "Hadir tepat waktu";
            }

            const checkOutOffset = getRandomInt(0, 30);

            checkOutTime = new Date(currentDate);
            checkOutTime.setUTCHours(10, checkOutOffset, 0, 0); // Jam 17:00 WIB (UTC+7)

            workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          } else if (rand <= 95) {
            status = "IZIN";
            note = "Izin keperluan keluarga mendesak";
          } else {
            status = "SAKIT";
            note = "Sakit dengan surat dokter";
          }

          absensiData.push({
            userId: user._id,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            workDuration,
            lateDuration,
            status,
            type: "KANTOR",
            note,
          });
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Masukkan data hasil generate ke MongoDB
    await Attendance.insertMany(absensiData);

    console.log(
      `✅ [SUCCESS] Seeding absensi rampung! ${absensiData.length} baris riwayat absensi berhasil disuntikkan untuk Fajar, Aziz, dan Ongki.`
    );
  } catch (error) {
    console.error("❌ Gagal seeding data kombinasi attendance:", error);
  }
};

export default seedAttendanceBulanLalu;
