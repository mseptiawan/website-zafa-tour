import mongoose from "mongoose";
import dotenv from "dotenv";
import announcementSeeder from "./database/seeders/announcement.seeder.js";

dotenv.config();

const runSeeder = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI tidak ditemukan di file .env");
    }

    console.log("Menyambungkan ke MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("MongoDB Terhubung.");

    console.log("Menjalankan seeder...");
    await announcementSeeder();

    console.log("Proses seeding selesai dengan sukses!");
    process.exit(0);
  } catch (error) {
    console.error("Proses seeding gagal:", error);
    process.exit(1);
  }
};

runSeeder();
