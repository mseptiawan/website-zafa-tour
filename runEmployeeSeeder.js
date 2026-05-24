import mongoose from "mongoose";
import dotenv from "dotenv";
import employeeSeeder from "./src/database/seeders/employee.seeder.js";

dotenv.config();

const runSeeder = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database connected successfully.");

    console.log("Starting employee seeding...");
    await employeeSeeder();

    await mongoose.disconnect();
    console.log("Database disconnected. Seeding complete!");
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

runSeeder();