import mongoose from "mongoose";
import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";

const MONGO_URI = "mongodb://localhost:27017/hris_zafa_tour";

const seedSalaries = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Database connected successfully for salary seeding...");

    const employees = await Employee.find({});
    if (!employees.length) {
      console.log("Tidak ada employee ditemukan. Seeding dibatalkan.");
      return;
    }

    await EmployeeSalary.deleteMany({});
    console.log("Data gaji lama dibersihkan.");

    const data = employees.map((employee) => ({
      employeeId: employee._id,
      basicSalary: 9000000,
      effectiveDate: new Date("2026-01-01"),
    }));

    await EmployeeSalary.insertMany(data);
    console.log(`Salary Seeder COMPLETE! Berhasil menambahkan ${data.length} data gaji.`);
  } catch (err) {
    console.error("Error Seeding Salary:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
};

seedSalaries();
