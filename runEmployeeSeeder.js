import mongoose from "mongoose";
import dotenv from "dotenv";
import employeeSeeder from "./src/database/seeders/employee.seeder.js";

dotenv.config();

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await employeeSeeder();

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeeder();
