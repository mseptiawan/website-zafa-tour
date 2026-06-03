import mongoose from "mongoose";
import dotenv from "dotenv";
import holidaysSeeder from "./src/database/seeders/holidays.seeder.js"; // Sesuaikan path ke file seeder Anda

dotenv.config();

const run = async () => {
  try {
    console.log("⏳ Menghubungkan ke MongoDB...");
    // Sesuaikan URI dengan variable environment di .env Anda
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("✅ Database Terkoneksi.");

    console.log("🚀 Memulai proses seeding kalender libur...");
    await holidaysSeeder();
    console.log("🎉 Seeding selesai dengan sukses!");

    // Putuskan koneksi setelah selesai agar proses Node.js berhenti
    await mongoose.disconnect();
    console.log("🔌 Koneksi database diputuskan.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat menjalankan seeder:", error);
    process.exit(1);
  }
};

run();
