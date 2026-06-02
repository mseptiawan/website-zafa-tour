import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import { Overtime } from "../models/Overtime.model.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

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

  const employeeId = user.employeeId;

  if (!employeeId) {
    throw new Error("Employee ID tidak ditemukan di session");
  }

  const career = await EmployeeCareer.findOne({
    employee_id: employeeId,
  }).populate({
    path: "bidangId",
    populate: {
      path: "managerRoleId",
    },
  });

  if (!career?.bidangId?.managerRoleId?.name) {
    throw new Error("Employee career/bidang/manager tidak ditemukan");
  }

  const requiredManagerRole = career.bidangId.managerRoleId.name;

  return await Overtime.create({
    userId: user._id,
    employeeId: user.employeeId,
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

    bidangId: career.bidangId._id,
    requiredManagerRole,

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
