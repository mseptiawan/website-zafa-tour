import Overtime from "../models/Overtime.js";

export const getOvertimeReportData = async (query) => {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    sort = "desc",
    startDate,
    endDate,
  } = query;

  const filter = {};

  // SEARCH NAMA
  if (search) {
    filter.employeeName = { $regex: search, $options: "i" };
  }

  // STATUS FILTER
  if (status) {
    filter.status = status;
  }

  // DATE FILTER
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const sortOption = sort === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const data = await Overtime.find(filter).sort({ date: sortOption }).skip(skip).limit(limit);

  const total = await Overtime.countDocuments(filter);

  const summary = await Overtime.aggregate([
    { $match: filter },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalHours: { $sum: "$totalHours" },
      },
    },
  ]);

  const summaryFormatted = {
    totalData: total,
    approved: summary.find((s) => s._id === "Approved")?.count || 0,
    rejected: summary.find((s) => s._id === "Rejected")?.count || 0,
    pending: summary.find((s) => s._id === "Pending Manager")?.count || 0,
    totalHours: summary.reduce((acc, s) => acc + (s.totalHours || 0), 0),
  };

  return {
    data,
    summary: summaryFormatted,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};
