import mongoose from "mongoose";
import Attendance from "../../models/Attendance.model.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper untuk mengacak urutan array (Fisher-Yates Shuffle)
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const seedAttendanceSpesifik = async () => {
  try {
    const targetUserId = "6a477d30c4a00a8c27d142ea";
    const objectIdUser = new mongoose.Types.ObjectId(targetUserId);

    console.log(`👥 Memulai injeksi data absensi khusus USER ID: ${targetUserId}`);

    // 1. Bersihkan data lama pada rentang tanggal target agar tidak duplikat
    const deleteStart = new Date(Date.UTC(2026, 5, 10)); // 10 Juni 2026
    const deleteEnd = new Date(Date.UTC(2026, 6, 9, 23, 59, 59)); // 9 Juli 2026

    await Attendance.deleteMany({
      userId: objectIdUser,
      checkIn: { $gte: deleteStart, $lte: deleteEnd },
    });

    // 2. Kumpulkan semua hari kerja (Senin - Jumat) di rentang tersebut
    const startDate = new Date(Date.UTC(2026, 5, 10));
    const endDate = new Date(Date.UTC(2026, 6, 9));
    let currentDate = new Date(startDate);

    const availableWorkDays = [];

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Bukan Sabtu/Minggu
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

    // 3. Tentukan hari mana saja yang akan mendapatkan status HADIR/TELAT (Tepat 15 Hari)
    shuffleArray(availableWorkDays);
    const kehadiranDays = availableWorkDays.slice(0, 15);
    const absenDays = availableWorkDays.slice(15);

    const absensiData = [];

    // 4. Proses data untuk hari-hari yang terpilih HADIR (15 Hari)
    for (const date of kehadiranDays) {
      let status = "HADIR";
      let note = "";
      let lateDuration = 0;

      // Jam masuk standar 08:00 WIB = 01:00 UTC
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

      // Jam pulang standar 17:00 WIB = 10:00 UTC
      const checkOutOffset = getRandomInt(0, 15);
      const checkOutTime = new Date(date);
      checkOutTime.setUTCHours(10, checkOutOffset, 0, 0);

      const workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));

      absensiData.push({
        userId: objectIdUser,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workDuration,
        lateDuration,
        status,
        type: "KANTOR",
        note,
      });
    }

    // 5. Proses sisa hari kerja sebagai SAKIT / IZIN
    for (const date of absenDays) {
      const randAbsen = getRandomInt(1, 2);
      const status = randAbsen === 1 ? "IZIN" : "SAKIT";
      const note =
        status === "IZIN"
          ? "Izin keperluan keluarga mendesak."
          : "Sakit dengan keterangan surat dokter.";

      absensiData.push({
        userId: objectIdUser,
        checkIn: null, // Sesuai default model jika tidak masuk
        checkOut: null,
        workDuration: 0,
        lateDuration: 0,
        status,
        type: "KANTOR",
        note,
      });
    }

    // 6. Simpan ke database
    if (absensiData.length > 0) {
      // Urutkan data berdasarkan tanggal checkIn/Date agar rapi di DB
      absensiData.sort((a, b) => (a.checkIn || a.createdAt) - (b.checkIn || b.createdAt));

      await Attendance.insertMany(absensiData);

      const totalHadir = absensiData.filter(
        (d) => d.status === "HADIR" || d.status === "TELAT"
      ).length;
      console.log(
        `[SUCCESS] Seeding selesai! Berhasil menyuntikkan ${absensiData.length} data absensi. Total Kehadiran (HADIR/TELAT): ${totalHadir} kali.`
      );
    }
  } catch (error) {
    console.error("Gagal seeding data attendance spesifik:", error);
  }
};

export default seedAttendanceSpesifik;
