import mongoose from "mongoose";
import dotenv from "dotenv";
import holidaysSeeder from "./src/database/seeders/holidays.seeder.js"; // <-- Sesuaikan path ke file seeder asli lu

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI tidak ditemukan di file .env");
    }

    console.log("🔌 Menghubungkan ke database untuk seeder kalender...");
    await mongoose.connect(mongoUri);
    console.log("✅ Database berhasil terhubung.");

    // Eksekusi seeder asli
    await holidaysSeeder();

    console.log("👋 Memutuskan koneksi database...");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal menjalankan seeder secara individu:", error.message);
    process.exit(1);
  }
};

run();
