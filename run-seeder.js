import mongoose from "mongoose";
import dotenv from "dotenv";
import seedOvertimeComponet from "./src/database/seeders/overtime.seeder.js";

dotenv.config();

const run = async () => {
  try {
    console.log("⏳ Menghubungkan ke MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
    console.log("✅ Database Terkoneksi.");

    console.log("🚀 Memulai proses seeding data lembur (overtime)...");
    // Jalankan fungsi seeder yang di-import
    await seedOvertimeComponet();
    console.log("🎉 Seeding lembur selesai dengan sukses!");

    await mongoose.disconnect();
    console.log("🔌 Koneksi database diputuskan dengan aman.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Terjadi kesalahan saat menjalankan seeder:", error);
    process.exit(1);
  }
};

run();
