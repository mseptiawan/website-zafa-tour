import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";
import Employee from "../../models/employee/Employee.model.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedAttendanceBulanLalu = async () => {
  try {
    // Ambil semua employee
    const employees = await Employee.find({}).select("userId");

    if (!employees.length) {
      console.log("Tidak ada data employee.");
      return;
    }

    const userIds = employees.map((e) => e.userId).filter(Boolean);

    // Ambil user yang benar-benar ada
    const users = await User.find({
      _id: { $in: userIds },
    });

    if (!users.length) {
      console.log("Tidak ada user yang terhubung ke employee.");
      return;
    }

    console.log(`👥 Total pegawai ditemukan: ${users.length}`);

    // Hapus absensi lama milik seluruh pegawai
    await Attendance.deleteMany({
      userId: { $in: users.map((u) => u._id) },
    });

    const absensiData = [];

    const startDate = new Date(Date.UTC(2026, 4, 27)); // 27 Mei 2026
    const endDate = new Date(Date.UTC(2026, 5, 26)); // 26 Juni 2026

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

          if (rand <= 85) {
            status = "HADIR";

            const checkInOffset = getRandomInt(-15, 30);

            checkInTime = new Date(currentDate);
            checkInTime.setUTCHours(1, checkInOffset, 0, 0);

            if (checkInOffset > 0) {
              lateDuration = checkInOffset;
              note = `Terlambat masuk ${lateDuration} menit`;
            } else {
              note = "Hadir tepat waktu";
            }

            const checkOutOffset = getRandomInt(0, 45);

            checkOutTime = new Date(currentDate);
            checkOutTime.setUTCHours(10, checkOutOffset, 0, 0);

            workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          } else if (rand <= 90) {
            status = "IZIN";
            note = "Izin keperluan keluarga";
          } else if (rand <= 95) {
            status = "SAKIT";
            note = "Sakit demam & flu";
          } else {
            status = "ALPHA";
            note = "Tanpa keterangan";
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

    await Attendance.insertMany(absensiData);

    console.log(
      `✅ Attendance seeding selesai. ${absensiData.length} data berhasil dibuat untuk ${users.length} pegawai.`
    );
  } catch (error) {
    console.error("❌ Gagal seeding attendance:", error);
  }
};

export default seedAttendanceBulanLalu;
