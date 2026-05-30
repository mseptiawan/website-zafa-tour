import Employee from "../models/employee/Employee.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";

export const getPayrollData = async () => {
  const employees = await Employee.find()
    .populate({
      path: "careerData",
      populate: {
        path: "positionId",
        model: "Position",
      },
    })
    .populate({
      path: "salaryDetail",
      model: "EmployeeSalary",
    });

  const components = await SalaryComponent.find({ isActive: true });
  const savedAllowances = await EmployeeAllowance.find().populate("componentId");

  return { employees, components, savedAllowances };
};
export const savePayrollRecord = async (data) => {
  return await Payroll.findOneAndUpdate(
    { employeeId: data.employeeId, periodMonth: data.periodMonth },
    data,
    { upsert: true, new: true }
  );
};
