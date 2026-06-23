import mongoose from "mongoose";
import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedAttendanceCustom = async () => {
  try {
    // 1. Ambil 5 user target sesuai request kamu
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

    console.log(`👥 Memulai injeksi data absensi khusus untuk ${users.length} pegawai target.`);

    // 2. Bersihkan data lama khusus untuk user target ini agar tidak duplikat
    await Attendance.deleteMany({
      userId: { $in: users.map((u) => u._id) },
    });

    const absensiData = [];

    // 3. Set rentang waktu ketat: 1 Mei 2026 s.d. 22 Juni 2026 (23 Juni dikosongkan untuk tes)
    const startDate = new Date(Date.UTC(2026, 4, 1)); // 1 Mei 2026
    const endDate = new Date(Date.UTC(2026, 5, 22)); // 22 Juni 2026

    let currentDate = new Date(startDate);

    // 4. Jalankan looping menggunakan struktur lama kamu
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
            // Toleransi acak antara -15 menit (cepat) sampai +20 menit (telat)
            const checkInOffset = getRandomInt(-15, 20);

            checkInTime = new Date(currentDate);
            checkInTime.setUTCHours(1, checkInOffset, 0, 0);

            // Jika offset > 15 menit (melewati grace period 15 menit perusahaan), status jadi TELAT
            if (checkInOffset > 15) {
              status = "TELAT";
              lateDuration = checkInOffset - 15; // Menghitung menit keterlambatannya
              note = `Terlambat masuk ${lateDuration} menit (Melewati batas toleransi)`;
            } else if (checkInOffset > 0 && checkInOffset <= 15) {
              note = "Hadir dalam masa toleransi (Grace Period)";
            } else {
              note = "Hadir tepat waktu";
            }

            // --- LOGIKA LEMBUR ACAK ---
            const isLembur = getRandomInt(1, 100) <= 60; // 60% peluang lembur
            let checkOutHourUTC = 10; // Jam pulang standar 17:00 WIB = 10:00 UTC
            let checkOutOffset = getRandomInt(0, 30);

            if (isLembur) {
              // Jam pulang lembur acak antara 19:00 - 21:00 WIB (= 12:00 - 14:00 UTC)
              checkOutHourUTC = getRandomInt(12, 14);
              note += " & Menyelesaikan tugas lembur malam.";
            }

            checkOutTime = new Date(currentDate);
            checkOutTime.setUTCHours(checkOutHourUTC, checkOutOffset, 0, 0);

            // Kalkulasi total durasi menit kerja
            workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          } else if (rand <= 95) {
            status = "IZIN";
            note = "Izin keperluan keluarga mendesak";
          } else {
            status = "SAKIT";
            note = "Sakit dengan keterangan surat dokter";
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

      // Pindah ke hari berikutnya menggunakan UTC
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 5. Masukkan kumpulan data ke MongoDB
    await Attendance.insertMany(absensiData);

    console.log(
      `[SUCCESS] Seeding absensi rampung! ${absensiData.length} baris riwayat absensi (Mei - 22 Juni) berhasil disuntikkan untuk Fajar, Adinda, Aziz, Melti, dan Baso.`
    );
  } catch (error) {
    console.error("Gagal seeding data kombinasi attendance:", error);
  }
};

export default seedAttendanceCustom;
