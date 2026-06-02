import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

export const createOvertimeService = async ({ user, body, file }) => {
  const start = new Date(`${body.date}T${body.startTime}`);
  const end = new Date(`${body.date}T${body.endTime}`);

  const totalHours = (end - start) / (1000 * 60 * 60);

  const period = getPayrollPeriod(body.date);

  return await Overtime.create({
    userId: user._id,
    employeeName: user.fullName,

    date: new Date(body.date),

    startTime: body.startTime,
    endTime: body.endTime,

    totalHours,

    workDescription: body.workDescription.trim(),
    result: body.result?.trim() || "",

    location: body.location,

    proofFile: file ? file.filename : null,

    status: "SUBMITTED",

    payrollPeriod: {
      id: period.id,
      label: period.label,
      start: period.start,
      end: period.end,
    },

    payrollStatus: "PENDING",

    overtimeRateSnapshot: body.overtimeRate || 0,
    multiplierSnapshot: body.multiplier || 1.5,

    approvalHistory: [
      {
        action: "SUBMITTED",
        by: user._id,
        role: user.role,
      },
    ],
  });
};
