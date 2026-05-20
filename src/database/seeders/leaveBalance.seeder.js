import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User.js"; // Sesuaikan arah ke model User lo
import LeaveBalance from "../../models/leave/LeaveBalance.model.js"; // Sesuaikan arah ke model LeaveBalance lo

// Load file .env agar bisa membaca MONGO_URI
dotenv.config();

const seedLeaveBalances = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI tidak ditemukan di file .env");
    }

    // 1. Koneksi ke Database
    console.log("🔌 Menghubungkan ke database untuk proses seeding...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database berhasil terhubung.");

    const TARGET_YEAR = 2026;
    const DEFAULT_QUOTA = 12;

    // 2. Ambil semua user
    const users = await User.find({});
    console.log(`[SEEDER] Memulai pengecekan saldo cuti untuk ${users.length} user...`);

    let createdCount = 0;
    let skippedCount = 0;

    // 3. Proses looping data saldo
    for (const user of users) {
      const existingBalance = await LeaveBalance.findOne({
        userId: user._id,
        year: TARGET_YEAR,
      });

      if (!existingBalance) {
        await LeaveBalance.create({
          userId: user._id,
          year: TARGET_YEAR,
          totalQuota: DEFAULT_QUOTA,
          remaining: DEFAULT_QUOTA,
          // field 'used' otomatis 0 berdasarkan schema default
        });
        createdCount++;
      } else {
        skippedCount++;
      }
    }

    console.log(`==================================================`);
    console.log(`   ✓ SEEDING SALDO CUTI TAHUN ${TARGET_YEAR} SELESAI`);
    console.log(`   ✓ Berhasil dibuat baru : ${createdCount} user`);
    console.log(`   🛈 Dilewati (Sudah ada)  : ${skippedCount} user`);
    console.log(`==================================================`);

    // 4. Putuskan koneksi dengan aman
    await mongoose.disconnect();
    console.log("👋 Koneksi database ditutup dengan aman.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Proses seeding gagal total:", error.message);
    process.exit(1);
  }
};

// Eksekusi fungsi seeder langsung saat file ini dipanggil oleh node
seedLeaveBalances();
