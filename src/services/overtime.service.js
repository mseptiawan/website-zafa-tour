import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import EmployeeFinancial from "../models/employee/EmployeeFinancial.js";

export const createOvertimeService = async ({ user, body, file }) => {
  const rawDate = new Date(body.date);
  const workDate = new Date(Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate()));

  const start = new Date(`${body.date}T${body.startTime}:00Z`);
  const end = new Date(`${body.date}T${body.endTime}:00Z`);

  const totalHours = (end - start) / (1000 * 60 * 60);

  const period = getPayrollPeriod(workDate);

  if (!period?.id) {
    throw new Error("Payroll period invalid");
  }

  const financial = await EmployeeFinancial.findOne({
    userId: user._id,
  });

  if (!financial) {
    throw new Error("Employee financial data not found");
  }

  if (!financial.overtimeRate || financial.overtimeRate <= 0) {
    throw new Error("Overtime rate not configured");
  }

  return await Overtime.create({
    userId: user._id,
    employeeName: user.fullName,

    date: workDate,
    startTime: body.startTime,
    endTime: body.endTime,

    totalHours: Number(totalHours.toFixed(2)),

    workDescription: body.workDescription.trim(),
    result: body.result?.trim() || "",

    location: body.location,

    proofFile: file ? file.filename : null,

    status: "SUBMITTED",

    payrollPeriodId: period.id,
    payrollStatus: "PENDING",

    overtimeRateSnapshot: financial.overtimeRate,
    multiplierSnapshot: 1.5,

    approvalHistory: [
      {
        action: "SUBMITTED",
        by: user._id,
        role: user.role,
        at: new Date(),
      },
    ],
  });
};
