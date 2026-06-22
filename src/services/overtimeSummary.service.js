import mongoose from "mongoose";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import { Overtime } from "../models/Overtime.model.js";

export const getOvertimeSummary = async (employeeId, date = new Date()) => {
  try {
    const currentPeriodStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      console.log(` ID Karyawan tidak valid: ${employeeId}`);
      return { totalHours: 0, totalPay: 0 };
    }
    const empObjectId = new mongoose.Types.ObjectId(employeeId);

    const records = await Overtime.find({
      employeeId: empObjectId,
      status: "APPROVED",
      payrollPeriodId: currentPeriodStr,
    });

    console.log(
      `Ditemukan ${records.length} data lembur APPROVED untuk periode ${currentPeriodStr}`
    );

    const totalHours = records.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    const totalPay = records.reduce((sum, r) => {
      const rate = r.overtimeRateSnapshot || 0;
      const multiplier = r.multiplierSnapshot || 1.5;

      return sum + (r.totalHours || 0) * rate * multiplier;
    }, 0);

    return {
      totalHours,
      totalPay,
    };
  } catch (error) {
    console.error("Error di getOvertimeSummary Service:", error);
    return { totalHours: 0, totalPay: 0 };
  }
};
