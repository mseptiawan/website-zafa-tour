import dotenv from "dotenv";
import mongoose from "mongoose";

import roleSeeder from "./role.seeder.js";
import bidangSeeder from "./bidang.seeder.js";
import unitSeeder from "./unit.seeder.js";
import positionSeeder from "./position.seeder.js";
// import leaveTypeSeeder from "./leaveTypeSeeder.js";
import salaryComponentSeeder from "./salaryComponent.seeder.js";

// user & employee
import userSeeder from "./user.seeder.js";
import employeeSeeder from "./employee.seeder.js";
import leaveBalanceSeeder from "./leaveBalance.seeder.js";
import employeeSalarySeeder from "./employeeSalary.seeder.js";

// leave
import holidaySeeder from "./holidays.seeder.js";
import leaveSeeder from "./leave.seeder.js";

// aktivitas & transaksi
// import attendanceSeeder from "./attendanceSeeder.js";
import assignmentSeeder from "./assignment.seeder.js";
import announcementSeeder from "./announcement.seeder.js";
import salesVisitSeeder from "./salesVisit.seeder.js";
import businessTripSeeder from "./businessTrip.seeder.js";
import overtimeSeeder from "./overtime.seeder.js";
import expenseSeeder from "./expenseSeeder.js";

// KPI
import kpiTemplateSeeder from "./kpiTemplate.seeder.js";
import kpiTemplateDetailSeeder from "./kpiTemplateDetail.seeder.js";
import unitKpiMappingSeeder from "./unitKpiMapping.seeder.js";

dotenv.config();

const seeders = [
  // 1. DATA MASTER INDEPENDEN
  roleSeeder,
  bidangSeeder,
  unitSeeder,
  positionSeeder,
  // leaveTypeSeeder,
  salaryComponentSeeder,

  // 2. USER & EMPLOYEE (Butuh data master)
  userSeeder,
  employeeSeeder,
  leaveBalanceSeeder,
  employeeSalarySeeder,

  // 3. LEAVE (Butuh holiday & tipe cuti)
  holidaySeeder,
  leaveSeeder,

  // 4. AKTIVITAS, ABSENSI & TRANSAKSI (Butuh user/employee)
  // attendanceSeeder,
  assignmentSeeder,
  announcementSeeder,
  salesVisitSeeder,
  businessTripSeeder,
  overtimeSeeder,
  expenseSeeder,

  // 5. KPI
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
