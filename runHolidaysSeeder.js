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

    await mongoose.connect(mongoUri);

    // Eksekusi seeder asli
    await holidaysSeeder();

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    process.exit(1);
  }
};

run();
