import mongoose from "mongoose";
import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedAttendanceCustom = async () => {
  try {
    // 1. Ambil 5 user target
    const targetUsernames = [
      "fajarjaniko",
      "adindarismayani",
      "abdulaziz",
      "meltisundari",
      "basoherman",
    ];

    const users = await User.find({
      username: { $in: targetUsernames.map((name) => new RegExp(name, "i")) },
    });

    if (!users.length) {
      console.log("Tidak ada user target yang ditemukan di database.");
      return;
    }

    console.log(
      `👥 Memulai injeksi data absensi PERIODE JULI untuk ${users.length} pegawai target.`
    );

    // 2. Bersihkan data lama khusus untuk periode Juli agar tidak duplikat saat di-seed ulang
    // Rentang pembersihan: 28 Juni s.d 27 Juli 2026
    const deleteStart = new Date(Date.UTC(2026, 5, 28));
    const deleteEnd = new Date(Date.UTC(2026, 6, 27, 23, 59, 59));

    await Attendance.deleteMany({
      userId: { $in: users.map((u) => u._id) },
      checkIn: { $gte: deleteStart, $lte: deleteEnd },
    });

    const absensiData = [];

    // 3. Set rentang waktu ketat berdasarkan Siklus Payroll Juli: 28 Juni 2026 s.d. 27 Juli 2026
    const startDate = new Date(Date.UTC(2026, 5, 28)); // 28 Juni 2026 (Bulan di JS: 0=Jan, 5=Juni)
    const endDate = new Date(Date.UTC(2026, 6, 27)); // 27 Juli 2026 (Bulan di JS: 6=Juli)

    let currentDate = new Date(startDate);

    // 4. Jalankan looping per hari
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();

      // Hanya berjalan di hari kerja (Senin s.d. Jumat). Sabtu (6) dan Minggu (0) libur.
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (const user of users) {
          const rand = getRandomInt(1, 100);

          let status = "HADIR";
          let note = "";
          let checkInTime = null;
          let checkOutTime = null;
          let workDuration = 0;
          let lateDuration = 0;

          // 90% Peluang karyawan Masuk Kerja
          if (rand <= 90) {
            status = "HADIR";

            // Jam masuk kantor standar: 08:00 WIB setara dengan 01:00 UTC
            const checkInOffset = getRandomInt(-15, 20);

            checkInTime = new Date(currentDate);
            checkInTime.setUTCHours(1, checkInOffset, 0, 0);

            // Jika offset > 15 menit, status jadi TELAT
            if (checkInOffset > 15) {
              status = "TELAT";
              lateDuration = checkInOffset - 15;
              note = `Terlambat masuk ${lateDuration} menit.`;
            } else if (checkInOffset > 0 && checkInOffset <= 15) {
              note = "Hadir dalam masa toleransi (Grace Period).";
            } else {
              note = "Hadir tepat waktu.";
            }

            // Murni jam pulang standar kantor: 17:00 WIB = 10:00 UTC (Tanpa log lembur)
            const checkOutOffset = getRandomInt(0, 15); // variasi pulang tepat waktu
            checkOutTime = new Date(currentDate);
            checkOutTime.setUTCHours(10, checkOutOffset, 0, 0);

            // Kalkulasi total durasi menit kerja standar
            workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          } else if (rand <= 95) {
            status = "IZIN";
            note = "Izin keperluan keluarga mendesak.";
          } else {
            status = "SAKIT";
            note = "Sakit dengan keterangan surat dokter.";
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

      // Pindah ke hari berikutnya
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 5. Masukkan kumpulan data ke MongoDB
    if (absensiData.length > 0) {
      await Attendance.insertMany(absensiData);
      console.log(
        `[SUCCESS] Seeding absensi periode JULLI selesai! ${absensiData.length} baris riwayat absensi (28 Juni - 27 Juli) berhasil disuntikkan.`
      );
    }
  } catch (error) {
    console.error("Gagal seeding data attendance Juli:", error);
  }
};

export default seedAttendanceCustom;
