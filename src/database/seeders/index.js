import mongoose from "mongoose";

import roleSeeder from "./roleSeeder.js";
import bidangSeeder from "./bidangSeeder.js";
import unitSeeder from "./unitSeeder.js";
import userSeeder from "./userSeeder.js";
import positionSeeder from "./positionSeeder.js";
import employeeSeeder from "./employeeSeeder.js";
import kpiTemplateSeeder from "./kpiTemplateSeeder.js";
import kpiTemplateDetailSeeder from "./kpiTemplateDetailSeeder.js";
import unitKpiMappingSeeder from "./unitKpiMappingSeeder.js";

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Seeder started...");

    // 🧠 urutan WAJIB benar (dependency order)
    await roleSeeder();
    await bidangSeeder();
    await unitSeeder();
    await positionSeeder();
    await userSeeder();
    await employeeSeeder();
    await kpiTemplateSeeder();
    await kpiTemplateDetailSeeder();
    await unitKpiMappingSeeder();
    console.log("All seeders success");

    process.exit();
  } catch (error) {
    console.log("Seeder error:", error);
    process.exit(1);
  }
};

runSeeder();
