import Employee from "../../models/employee/Employee.model.js";
import EmployeeSalary from "../../models/employee/EmployeeSalary.model.js";

const employeeSalarySeeder = async () => {
  const employees = await Employee.find({});
  if (!employees.length) {
    console.log("Tidak ada employee ditemukan. Seeding gaji dibatalkan.");
    return;
  }

  await EmployeeSalary.deleteMany({});

  const data = employees.map((employee) => ({
    employeeId: employee._id,
    basicSalary: 9000000,
    effectiveDate: new Date("2026-01-01"),
  }));

  await EmployeeSalary.insertMany(data);
  console.log("Employee Salary seeded");
};

export default employeeSalarySeeder;
