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

  return aggregated.map((item) => ({
    userId: item._id,
    totalHours: Number(item.totalHours.toFixed(2)),
    totalPay: Number(item.totalPay.toFixed(2)),
    period,
  }));
};
