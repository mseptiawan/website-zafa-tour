import Attendance from "../../models/Attendance.model.js";
import User from "../../models/basic/User.model.js";

const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const seedAttendanceMassal = async () => {
  try {
    // 1. KUNCI SKENARIO: Filter nama 3 orang target utama agar data mereka TIDAK IKUT DI-UPDATE/DIGANGGU
    const protectedUsernames = ["fajarjaniko", "abdulaziz", "ongkidwi"];

    // Ambil seluruh user di database KECUALI 3 orang target utama dan Direktur Utama
    const usersToSeed = await User.find({
      username: { $nin: protectedUsernames },
      role: { $ne: "DIREKTUR_UTAMA" },
    });

    if (!usersToSeed.length) {
      console.log("⚠️ Tidak ada pegawai tambahan yang perlu di-seed.");
      return;
    }

    console.log(
      `👥 Memulai injeksi data absensi pendukung untuk ${usersToSeed.length} pegawai (Aman dari data demo 3 orang utama).`
    );

    // 2. Bersihkan data absensi lama HANYA milik pegawai tambahan ini (Data Fajar, Aziz, Ongki aman tidak akan terhapus)
    await Attendance.deleteMany({
      userId: { $in: usersToSeed.map((u) => u._id) },
    });

    const absensiDataMassal = [];

    // Rentang tanggal siklus payroll: 27 Mei 2026 s/d 26 Juni 2026
    const startDate = new Date(Date.UTC(2026, 4, 27));
    const endDate = new Date(Date.UTC(2026, 5, 26));

    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getUTCDay();

      // Skip Sabtu & Minggu (Hanya Hari Kerja)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        for (const user of usersToSeed) {
          const rand = getRandomInt(1, 100);

          let status = "HADIR";
          let note = "";
          let checkInTime = null;
          let checkOutTime = null;
          let workDuration = 0;
          let lateDuration = 0;
          // Variasikan tipe lokasi biar grafik donat/bar rasio lokasi lu di dashboard laporan keliatan berwarna dan dinamis!
          let type = rand <= 80 ? "KANTOR" : "LUAR KANTOR";

          // Probabilitas 85% hadir/telat dinamis untuk pegawai luar
          if (rand <= 85) {
            const isLate = rand > 70; // Di atas 70 dianggap telat biar leaderboard rangkingnya bervariasi
            status = isLate ? "TELAT" : "HADIR";

            const checkInOffset = isLate ? getRandomInt(5, 30) : getRandomInt(-15, 0);

            checkInTime = new Date(currentDate);
            checkInTime.setUTCHours(1, checkInOffset, 0, 0); // Jam 08:00 WIB (UTC+7)

            if (isLate) {
              lateDuration = checkInOffset;
              note = `Terlambat masuk ${lateDuration} menit`;
            } else {
              note = "Hadir tepat waktu";
            }

            const checkOutOffset = getRandomInt(0, 30);
            checkOutTime = new Date(currentDate);
            checkOutTime.setUTCHours(10, checkOutOffset, 0, 0); // Jam 17:00 WIB (UTC+7)

            workDuration = Math.round((checkOutTime - checkInTime) / (1000 * 60));
          } else if (rand <= 93) {
            status = "IZIN";
            note = "Izin keperluan mendesak";
          } else {
            status = "SAKIT";
            note = "Sakit, surat dokter terlampir";
          }

          absensiDataMassal.push({
            userId: user._id,
            checkIn: checkInTime,
            checkOut: checkOutTime,
            workDuration,
            lateDuration,
            status,
            type,
            note,
          });
        }
      }

      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    // Masukkan data massal pegawai pelengkap ke MongoDB Compass
    if (absensiDataMassal.length > 0) {
      await Attendance.insertMany(absensiDataMassal);
      console.log(
        `✅ [MASS SEED SUCCESS] Berhasil menyuntikkan ${absensiDataMassal.length} baris data absensi pendukung!`
      );
    }
  } catch (error) {
    console.error("❌ Gagal melakukan seeding massal data attendance:", error);
  }
};

export default seedAttendanceMassal;
