import Employee from "../models/employee/Employee.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import EmployeeSalary from "../models/employee/EmployeeSalary.model.js";

export const getPayrollData = async () => {
  const employees = await Employee.find().populate("positionId").populate({
    path: "salaryDetail",
    model: "EmployeeSalary",
  });

  const salaries = await EmployeeSalary.find();

  console.log("=== EMPLOYEE ===");
  employees.forEach((e) => {
    console.log({
      id: e._id.toString(),
      name: e.fullName,
    });
  });

  console.log("=== SALARY ===");
  salaries.forEach((s) => {
    console.log({
      employeeId: s.employeeId.toString(),
      basicSalary: s.basicSalary,
    });
  });

  const components = await SalaryComponent.find({
    isActive: true,
  });

  return {
    employees: employees.map((emp) => emp.toObject({ virtuals: true })),
    components,
  };
};

export const savePayrollRecord = async (data) => {
  return await Payroll.findOneAndUpdate(
    { employeeId: data.employeeId, periodMonth: data.periodMonth },
    data,
    { upsert: true, new: true }
  );
};
