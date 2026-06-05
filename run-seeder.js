import mongoose from "mongoose";
import dotenv from "dotenv";
import completePayrollHistorySeeder from "./src/database/seeders/seedAttendanceMassal.js";

dotenv.config();
const MONGO_URI = process.env.MONGODB_URI;

async function startSeeding() {
  try {
    console.log("🔌 Menghubungkan ke MongoDB...");
    await mongoose.connect(MONGO_URI);
    await completePayrollHistorySeeder();
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    try {
      await mongoose.disconnect();
    } catch (e) {}
    process.exit(1);
  }
}
startSeeding();
