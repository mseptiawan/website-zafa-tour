import dotenv from "dotenv";
import mongoose from "mongoose";

import roleSeeder from "./role.seeder.js";
import bidangSeeder from "./bidang.seeder.js";
import unitSeeder from "./unit.seeder.js";
import userSeeder from "./user.seeder.js";
import positionSeeder from "./position.seeder.js";
import employeeSeeder from "./employee.seeder.js";
// import leaveSeeder from "./inactiveleave.seeder.js";
import holidaySeeder from "./holidays.seeder.js";
import assignmentSeeder from "./assignment.seeder.js";
import announcementSeeder from "./announcement.seeder.js";
import salesVisitSeeder from "./salesVisit.seeder.js";
import businessTripSeeder from "./businessTrip.seeder.js";
import overtimeSeeder from "./overtime.seeder.js";

import kpiTemplateSeeder from "./kpiTemplate.seeder.js";
import kpiTemplateDetailSeeder from "./kpiTemplateDetail.seeder.js";
import unitKpiMappingSeeder from "./unitKpiMapping.seeder.js";

dotenv.config();

const seeders = [
  // master data
  roleSeeder,
  bidangSeeder,
  unitSeeder,
  positionSeeder,

  // user & employee
  userSeeder,
  employeeSeeder,

  // leave
  holidaySeeder,
  // leaveSeeder,

  // aktivitas
  assignmentSeeder,
  announcementSeeder,
  salesVisitSeeder,
  businessTripSeeder,
  overtimeSeeder,

  // KPI
  kpiTemplateSeeder,
  kpiTemplateDetailSeeder,
  unitKpiMappingSeeder,
];

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("Seeder started...");

    for (const seeder of seeders) {
      console.log(`Running ${seeder.name}...`);
      await seeder();
    }

    console.log("All seeders success");
    process.exit(0);
  } catch (error) {
    console.error("Seeder error:", error);
    process.exit(1);
  }
};

runSeeder();
