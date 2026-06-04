import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";

const seedAttendanceBulanLalu = async () => {
  try {
    console.log("=== MEMULAI SEEDING ABSENSI (27 Apr - 26 Mei 2026) ===");

    // 1. Target username yang mau disuntik data absensinya
    const targetUsernames = [
      "abdulaziz",
      "basoherman",
      "meltisundari",
      "duwihartati",
      "ongkidwi",
      "fadhilah",
      "nurul",
    ];

    // 2. Ambil ID user mereka dari database
    const users = await User.find({ username: { $in: targetUsernames } });

    if (users.length === 0) {
      console.log("❌ User tidak ditemukan. Pastikan userSeeder sudah dijalankan.");
      return;
    }

    // Array penampung untuk di-insert massal
    const absensiData = [];

    // 3. Setup Tanggal (Format UTC).
    // Bulan 3 = April, Bulan 4 = Mei (karena hitungan bulan di JS dimulai dari 0)
    let currentDate = new Date(Date.UTC(2026, 3, 27));
    const endDate = new Date(Date.UTC(2026, 4, 26));

    while (currentDate <= endDate) {
      // Dapatkan info hari (0 = Minggu, 6 = Sabtu)
      const dayOfWeek = currentDate.getUTCDay();

      // Kita skip weekend agar logis seperti jadwal ngantor biasa
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        // Loop ke setiap user target di hari kerja tersebut
        for (const user of users) {
          // Set Check-In jam 08:00 WIB (Dalam UTC = 01:00)
          const checkInTime = new Date(currentDate);
          checkInTime.setUTCHours(1, 0, 0, 0);

          // Set Check-Out jam 17:00 WIB (Dalam UTC = 10:00)
          const checkOutTime = new Date(currentDate);
          checkOutTime.setUTCHours(10, 0, 0, 0);

          // Push data sesuai schema Attendance.model.js
          absensiData.push({
            userId: user._id,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            workDuration: 540, // 9 jam kerja = 540 menit
            lateDuration: 0,
            status: "HADIR", // Menggunakan enum yang valid di skema
            type: "KANTOR", // Menggunakan enum yang valid di skema
            note: "Hadir tepat waktu (Seeder Auto-Generate)",
          });
        }
      }

      // Lanjut iterasi ke hari berikutnya
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // 4. Eksekusi suntik massal ke database
    await Attendance.insertMany(absensiData);

    console.log(
      `✅ Berhasil menyuntikkan total ${absensiData.length} baris data absensi untuk ${users.length} pegawai!`
    );
    console.log("=== SEEDING ABSENSI SELESAI ===");
  } catch (error) {
    console.error("❌ Gagal seeding absensi:", error);
  }
};

export default seedAttendanceBulanLalu;
