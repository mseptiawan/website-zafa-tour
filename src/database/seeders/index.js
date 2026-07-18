import dotenv from "dotenv";
import mongoose from "mongoose";

import salaryComponentSeeder from "./salaryComponent.seeder.js";

import attendanceSeeder from "./attendance.seeder.js";
import overtimeSeeder from "./overtime.seeder.js";
import holidaysSeeder from "./holidays.seeder.js";
import leaveBalance from "./leaveBalance.seeder.js";
import kpiTemplate from "./kpiTemplate.seeder.js";
import kpiTemplateDetail from "./kpiTemplateDetail.seeder.js";
import unitKpiMap from "./unitKpiMapping.seeder.js";
import role from "./role.seeder.js";
import bidang from "./bidang.seeder.js";
import unit from "./unit.seeder.js";
import Employee from "../../models/employee/Employee.model.js";
import employee from "./employee.seeder.js";
import position from "./position.seeder.js";
import user from "./user.seeder.js";
import holiday from "./holidays.seeder.js";
import salaryComponent from "./salaryComponent.seeder.js";
import seedPermit from "./permit.seeder.js";
import seedPayroll from "./seedPayroll.js";
dotenv.config();

const seeders = [
  // role,
  // bidang,
  // position,
  // unit,
  // user,
  // employee,
  // holiday,
  // leaveBalance,
  kpiTemplate,
  kpiTemplateDetail,
  unitKpiMap,
  // attendanceSeeder,
  // salaryComponent,
  // overtimeSeeder,
  // seedPayroll,
  // seedPermit,
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
