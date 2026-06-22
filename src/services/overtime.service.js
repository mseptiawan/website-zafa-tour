import mongoose from "mongoose";
import Employee from "../models/employee/Employee.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import { Overtime } from "../models/Overtime.model.js";
import EmployeeFinancial from "../models/employee/EmployeeFinancial.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";

export const createOvertimeService = async ({ user, body, file }) => {
  const rawDate = new Date(body.date);
  const workDate = new Date(Date.UTC(rawDate.getFullYear(), rawDate.getMonth(), rawDate.getDate()));

  const start = new Date(`${body.date}T${body.startTime}:00Z`);
  let end = new Date(`${body.date}T${body.endTime}:00Z`);

  if (end < start) {
    end.setDate(end.getDate() + 1);
  }

  const totalHours = (end - start) / (1000 * 60 * 60);
  const period = getPayrollPeriod(workDate);

  if (!period?.id) {
    throw new Error("Payroll period invalid");
  }

  const employeeId = user.employeeId;
  if (!employeeId) {
    throw new Error("Employee ID tidak ditemukan di session");
  }

  let status = "SUBMITTED";
  let approvedBy = null;
  let approvedAt = null;
  let overtimeRateSnapshot = undefined;
  let multiplierSnapshot = undefined;
  let requiredManagerRole = null;
  let bidangId = null;
  let activeEmployeeId = employeeId;

  const historyAction = [];

  const isWadirOrManager =
    user.role === "WAKIL_DIREKTUR" || (user.role || "").startsWith("MANAGER_");

  if (isWadirOrManager) {
    status = "APPROVED";
    approvedBy = user._id;
    approvedAt = new Date();

    let financial = await EmployeeFinancial.findOne({
      employee_id: new mongoose.Types.ObjectId(employeeId),
    });

    if (!financial) {
      const fallbackEmployee = await Employee.findOne({ userId: user._id });

      if (fallbackEmployee) {
        activeEmployeeId = fallbackEmployee._id;
        financial = await EmployeeFinancial.findOne({
          employee_id: fallbackEmployee._id,
        });
      }
    }

    if (!financial) {
      console.warn(
        `[WARN] Data finansial tidak ditemukan untuk EmployeeID: ${employeeId} maupun UserID: ${user._id}. Menggunakan rate default 0.`
      );
      overtimeRateSnapshot = 0;
    } else {
      overtimeRateSnapshot = financial.overtimeRate || 0;
    }

    multiplierSnapshot = 1.5;

    const basicCareer = await EmployeeCareer.findOne({ employee_id: activeEmployeeId });

    bidangId = basicCareer?.bidangId || null;

    if (!bidangId) {
      console.warn(
        `[WARN] ${user.fullName} tidak punya bidang di Karir. Mencari bidang default dari database...`
      );

      const sampleBidang = await mongoose.model("Bidang").findOne({});

      if (sampleBidang) {
        bidangId = sampleBidang._id;
      } else {
        throw new Error(
          `Gagal memproses lembur. Tidak ada satu pun data Bidang yang ditemukan di database untuk dijadikan fallback.`
        );
      }
    }

    requiredManagerRole = user.role;

    historyAction.push(
      {
        action: "SUBMITTED",
        by: user._id,
        role: user.role,
        at: new Date(),
      },
      {
        action: "APPROVED",
        by: user._id,
        role: user.role,
        note: "Sistem otomatis menyetujui pengajuan dinas lembur tingkat Manajemen Utama / Wakil Direktur.",
        at: new Date(),
      }
    );
  } else {
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

    bidangId = career.bidangId._id;
    requiredManagerRole = career.bidangId.managerRoleId.name;

    historyAction.push({
      action: "SUBMITTED",
      by: user._id,
      role: user.role,
      at: new Date(),
    });
  }

  return await Overtime.create({
    userId: user._id,
    employeeId: activeEmployeeId,
    employeeName: user.fullName,
    date: workDate,
    startTime: body.startTime,
    endTime: body.endTime,
    totalHours: Number(totalHours.toFixed(2)),
    workDescription: body.workDescription.trim(),
    result: body.result?.trim() || "",
    location: body.location,
    proofFile: file ? file.filename : null,
    status,
    payrollPeriodId: period.id,
    payrollStatus: "PENDING",
    bidangId,
    requiredManagerRole,
    overtimeRateSnapshot,
    multiplierSnapshot,
    approvedBy,
    approvedAt,
    approvalHistory: historyAction,
  });
};
