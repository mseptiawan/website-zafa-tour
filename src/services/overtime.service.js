import { Overtime } from "../models/Overtime.model.js";
export const createOvertimeService = async ({ user, body, file }) => {
  const start = new Date(`${body.date}T${body.startTime}`);
  const end = new Date(`${body.date}T${body.endTime}`);

  const totalHours = (end - start) / (1000 * 60 * 60);

  return await Overtime.create({
    userId: user._id,

    employeeName: user.fullName,

    date: body.date,

    startTime: body.startTime,

    endTime: body.endTime,

    totalHours,

    workDescription: body.workDescription.trim(),

    result: body.result?.trim() || "",

    location: body.location,

    proofFile: file ? file.filename : null,

    status: "SUBMITTED",

    approvalHistory: [
      {
        action: "SUBMITTED",
        by: user._id,
      },
    ],
  });
};
