import Employee from "../models/employee/Employee.model.js";
import SalaryComponent from "../models/payroll/SalaryComponent.model.js";
import Payroll from "../models/payroll/Payroll.model.js";
import EmployeeAllowance from "../models/payroll/EmployeeAllowance.model.js";
import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

/**
 * Mengambil data master seluruh karyawan, komponen gaji, dan tunjangan tersimpan.
 */
export const getPayrollData = async () => {
  const employees = await Employee.find()
    .populate({
      path: "careerData",
      populate: {
        path: "positionId",
        model: "Position",
      },
    })
    .lean();

  const components = await SalaryComponent.find({ isActive: true }).lean();
  const savedAllowances = await EmployeeAllowance.find().populate("componentId").lean();

  return { employees, components, savedAllowances };
};

/**
 * Menyimpan atau memperbarui rekam jejak lembar payroll per periode bulan.
 */
export const savePayrollRecord = async (data) => {
  return await Payroll.findOneAndUpdate(
    { employeeId: data.employeeId, periodMonth: data.periodMonth },
    data,
    { upsert: true, new: true }
  );
};

/**
 * Menghitung akumulasi lembur karyawan berdasarkan rentang waktu penutupan buku.
 */
export const calculateOvertimePayroll = async ({ userId, date }) => {
  const period = getPayrollPeriod(date);
  const records = await Overtime.find({
    userId,
    status: "APPROVED",
    date: {
      $gte: period.start,
      $lte: period.end,
    },
  }).lean();

  const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);
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

/**
 * Menjalankan fungsi agregasi data lembur masal terhitung per periode bulan.
 */
export const runPayrollAggregation = async (date = new Date()) => {
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

/**
 * Membangun draf komponen penerimaan (Earning) dan pemotongan (Deduction) payroll karyawan.
 */
export const buildPayroll = async ({ employeeId, date, overtime }) => {
  const employee = await Employee.findById(employeeId).lean();
  const allowances = await EmployeeAllowance.find({ employeeId }).populate("componentId").lean();

  // Mengambil nominal basicSalary dari sub-dokumen financialData terpadu
  const basicSalary = employee?.financialData?.basicSalary || 0;

  const earning = allowances
    .filter((a) => a.componentId?.category === "EARNING")
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const deduction = allowances
    .filter((a) => a.componentId?.category === "DEDUCTION")
    .reduce((sum, a) => sum + (a.amount || 0), 0);

  const overtimePay = overtime?.totalPay || 0;
  const totalEarnings = basicSalary + earning + overtimePay;
  const totalDeductions = deduction;

  return {
    employeeId,
    periodMonth: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
    basicSalary,
    overtime: {
      hours: overtime?.totalHours || 0,
      amount: overtimePay,
    },
    allowances: allowances
      .filter((a) => a.componentId?.category === "EARNING")
      .map((a) => ({
        name: a.componentId?.name,
        amount: a.amount,
      })),
    deductions: allowances
      .filter((a) => a.componentId?.category === "DEDUCTION")
      .map((a) => ({
        name: a.componentId?.name,
        amount: a.amount,
      })),
    totalEarnings,
    totalDeductions,
    netTakeHomePay: totalEarnings - totalDeductions,
    status: "DRAFT",
  };
};
