import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";

// Helper untuk menghasilkan angka acak di antara min dan max
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedAttendanceBulanLalu = async () => {
  try {
    console.log("=== MEMULAI SEEDING ABSENSI REALISTIS (27 Apr - 26 Mei 2026) ===");

    // 1. Target username
    const targetUsernames = [
      "abdulaziz",
      "basoherman",
      "meltisundari",
      "duwihartati",
      "ongkidwi",
      "fadhilah",
      "nurul",
    ];

    // 2. Ambil ID user dari database
    const users = await User.find({ username: { $in: targetUsernames } });

    if (users.length === 0) {
      console.log("❌ User tidak ditemukan. Pastikan userSeeder sudah dijalankan.");
      return;
    }

    const absensiData = [];

    // 3. Setup Tanggal (Format UTC)
    let currentDate = new Date(Date.UTC(2026, 3, 27));
    const endDate = new Date(Date.UTC(2026, 4, 26));

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();

      // Skip Sabtu & Minggu
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (const user of users) {
          // Buat probabilitas kehadiran acak (1 - 100)
          const rand = getRandomInt(1, 100);

          let status = "HADIR";
          let note = "";
          let checkInTime = null;
          let checkOutTime = null;
          let workDuration = 0;
          let lateDuration = 0;

          if (rand <= 85) {
            // 85% Peluang HADIR
            status = "HADIR";

            // Randomisasi Jam Masuk: 07:45 sampai 08:30 WIB (UTC: 00:45 - 01:30)
            const checkInOffset = getRandomInt(-15, 30); // -15 = lebih awal 15 mnt, +30 = telat 30 mnt
            checkInTime = new Date(currentDate);
            checkInTime.setUTCHours(1, checkInOffset, 0, 0);

            // Hitung keterlambatan (jika offset di atas 0 menit dari jam 08:00)
            if (checkInOffset > 0) {
              lateDuration = checkInOffset;
              note = `Terlambat masuk ${lateDuration} menit`;
            } else {
              note = "Hadir tepat waktu";
            }

            // Randomisasi Jam Pulang: 17:00 sampai 17:45 WIB (UTC: 10:00 - 10:45)
            const checkOutOffset = getRandomInt(0, 45);
            checkOutTime = new Date(currentDate);
            checkOutTime.setUTCHours(10, checkOutOffset, 0, 0);

            // Hitung total durasi kerja (dalam hitungan menit)
            workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          } else if (rand <= 90) {
            // 5% Peluang IZIN
            status = "IZIN";
            note = "Izin keperluan keluarga";
          } else if (rand <= 95) {
            // 5% Peluang SAKIT
            status = "SAKIT";
            note = "Sakit demam & flu";
          } else {
            // 5% Peluang ALPA
            status = "ALPHA";
            note = "Tanpa keterangan";
          }

          // Push data yang sudah dirandomisasi
          absensiData.push({
            userId: user._id,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            workDuration: workDuration,
            lateDuration: lateDuration,
            status: status,
            type: "KANTOR",
            note: note,
          });
        }
      }

      // Lanjut iterasi ke hari berikutnya
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 4. Eksekusi suntik massal ke database
    await Attendance.insertMany(absensiData);

    console.log(
      `✅ Berhasil menyuntikkan total ${absensiData.length} baris data absensi dinamis untuk ${users.length} pegawai!`
    );
    console.log("=== SEEDING ABSENSI SELESAI ===");
  } catch (error) {
    console.error("❌ Gagal seeding absensi:", error);
  }
};

export default seedAttendanceBulanLalu;
