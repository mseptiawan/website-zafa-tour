import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

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
      },
    },
  ]);

  return aggregated;
};
