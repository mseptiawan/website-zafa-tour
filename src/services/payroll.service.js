import Employee from "../models/employee/Employee.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import Payroll from "../models/payroll/Payroll.model.js";

export const getPayrollData = async () => {
  const employees = await Employee.find().populate("positionId").populate({
    path: "salaryDetail",
    model: "EmployeeSalary",
  });
  const components = await SalaryComponent.find({ isActive: true });

  return { employees, components };
};

export const savePayrollRecord = async (data) => {
  return await Payroll.findOneAndUpdate(
    { employeeId: data.employeeId, periodMonth: data.periodMonth },
    data,
    { upsert: true, new: true }
  );
};
