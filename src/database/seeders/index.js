import dotenv from "dotenv";
import mongoose from "mongoose";

import salaryComponentSeeder from "./salaryComponent.seeder.js";

import completeLoanSeeder from "./completeLoan.seeder.js";
import completePayrollHistorySeeder from "./completePayrollHistory.seeder.js";
import attendanceSeeder from "./attendance.seeder.js";
import overtimeSeeder from "./overtime.seeder.js";
import expenseCategorySeeder from "./expenseCategory.seeder.js";
import holidaysSeeder from "./holidays.seeder.js";
import seedLeaveBalance from "./leaveBalance.seeder.js";
dotenv.config();

const seeders = [
  // attendanceSeeder,
  completeLoanSeeder,
  // salaryComponentSeeder,
  // overtimeSeeder,
  // holidaysSeeder,
  // seedLeaveBalance,

  // expenseCategorySeeder,
  // completePayrollHistorySeeder,
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
