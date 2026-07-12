import Payroll from "../../models/payroll/Payroll.model.js";
import { Overtime } from "../../models/Overtime.model.js";
import Employee from "../../models/employee/Employee.model.js";
import { renderHistoryPage } from "../attendance.controller.js";
import { generatePayrollPeriods, getPayrollPeriod } from "../../utils/payrollPeriod.js";
import {
  generateOvertimePdf,
  generateOvertimeExcel,
} from "../../services/report/overtime.service.js";

export const getOvertimeReport = async (req, res) => {
  try {
    const { period } = req.query;
    let filter = {};

    const availablePeriods = generatePayrollPeriods(6, 3);

    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = period || currentPeriodId;

    filter.payrollPeriodId = selectedPeriod;

    const listOvertime = await Overtime.find(filter).lean();

    let totalApprovedHours = 0;
    let totalApprovedCount = 0;
    let estimatedCost = 0;

    listOvertime.forEach((ot) => {
      if (ot.status === "APPROVED") {
        totalApprovedCount++;
        totalApprovedHours += ot.totalHours || 0;
        estimatedCost +=
          (ot.totalHours || 0) * (ot.overtimeRateSnapshot || 0) * (ot.multiplierSnapshot || 1.5);
      }
    });

    res.render("report/overtime", {
      title: "Laporan Aktivitas Lembur",
      listOvertime,
      analytics: {
        totalHours: totalApprovedHours,
        totalCount: totalApprovedCount,
        estimatedCost: Math.round(estimatedCost),
      },
      filters: {
        period: selectedPeriod,
      },
      availablePeriods,
    });
  } catch (error) {
    console.error("Eror Laporan Lembur:", error);
    res.status(500).send("Gagal memuat laporan aktivitas lembur");
  }
};

export const downloadOvertimeExcelReport = async (req, res) => {
  try {
    const { period } = req.query;
    let filter = {};

    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = period || currentPeriodId;

    filter.payrollPeriodId = selectedPeriod;
    const listOvertime = await Overtime.find(filter).lean();

    const excelBuffer = await generateOvertimeExcel(listOvertime);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Lembur_Siklus_${selectedPeriod}.xlsx`
    );
    return res.end(excelBuffer);
  } catch (error) {
    console.error("Gagal mengekspor Excel Rekap Lembur:", error);
    return res.status(500).send("Terjadi kesalahan saat memproses dokumen Excel.");
  }
};

export const downloadOvertimePdfReport = async (req, res) => {
  try {
    const { period } = req.query;
    let filter = {};

    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = period || currentPeriodId;

    filter.payrollPeriodId = selectedPeriod;
    const listOvertime = await Overtime.find(filter).lean();

    let totalApprovedHours = 0;
    let totalApprovedCount = 0;
    let estimatedCost = 0;

    listOvertime.forEach((ot) => {
      if (ot.status === "APPROVED") {
        totalApprovedCount++;
        totalApprovedHours += ot.totalHours || 0;
        estimatedCost +=
          (ot.totalHours || 0) * (ot.overtimeRateSnapshot || 0) * (ot.multiplierSnapshot || 1.5);
      }
    });

    const analytics = {
      totalHours: totalApprovedHours,
      totalCount: totalApprovedCount,
      estimatedCost: Math.round(estimatedCost),
    };

    const pdfBuffer = await generateOvertimePdf(listOvertime, analytics, {
      period: selectedPeriod,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Lembur_Siklus_${selectedPeriod}.pdf`
    );
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Gagal mengekspor PDF Rekap Lembur:", error);
    return res.status(500).send("Terjadi kesalahan saat memproses dokumen PDF.");
  }
};
