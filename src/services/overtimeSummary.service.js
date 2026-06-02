import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

export const getOvertimeSummary = async (userId, date = new Date()) => {
  const period = getPayrollPeriod(date);

  const records = await Overtime.find({
    userId,
    status: "APPROVED",
    date: { $gte: period.start, $lte: period.end },
  });

  const totalHours = records.reduce((sum, r) => sum + r.totalHours, 0);

  const overtimeRate = records[0]?.overtimeRateSnapshot || 0;
  const multiplier = records[0]?.multiplierSnapshot || 1.5;

  return {
    totalHours,
    totalPay: totalHours * overtimeRate * multiplier,
  };
};
