import Employee from "../models/employee/Employee.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
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
export const calculatePayroll = async ({ userId, date }) => {
  const period = getPayrollPeriod(date);

  const records = await Overtime.find({
    userId,
    status: "APPROVED",
    date: {
      $gte: period.start,
      $lte: period.end,
    },
  });

  const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

  // ambil rate dari system (idealnya dari Salary model nanti)
  const rate = records[0]?.overtimeRate || 0;
  const multiplier = 1.5;

  const totalPay = totalHours * rate * multiplier;

  return {
    periodId: period.id,
    period,
    totalHours,
    totalPay,
  };
};

export const runPayroll = async (date = new Date()) => {
  const period = getPayrollPeriod(date);

  const aggregated = await Overtime.aggregate([
    {
      $match: {
        status: "APPROVED",
        date: {
          $gte: period.start,
          $lte: period.end,
        },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalHours: { $sum: "$totalHours" },
        totalPay: {
          $sum: {
            $multiply: ["$totalHours", "$overtimeRateSnapshot", "$multiplierSnapshot"],
          },
        },
      },
    },
  ]);

  return {
    period,
    result: aggregated,
  };
};
