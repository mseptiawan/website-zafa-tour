import Payroll from "../../models/payroll/Payroll.model.js";
import { Overtime } from "../../models/Overtime.model.js";
import Employee from "../../models/employee/Employee.model.js";
import { renderHistoryPage } from "../attendance.controller.js";
import { generatePayrollPeriods, getPayrollPeriod } from "../../utils/payrollPeriod.js";
import {
  generatePayrollPdf,
  generatePayrollExcel,
  generateSingleSlipPdf,
} from "../../services/report/payroll.service.js";

export const getPayrollReport = async (req, res) => {
  try {
    const { periodMonth } = req.query;

    const availablePeriods = generatePayrollPeriods(6, 3);

    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = periodMonth || currentPeriodId;

    const listPayroll = await Payroll.find({
      periodMonth: selectedPeriod,
      status: { $in: ["CLOSED", "PAID"] },
    })
      .populate("employeeId")
      .lean();

    let totalEarnings = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    listPayroll.forEach((p) => {
      totalEarnings += p.totalEarnings || 0;
      totalDeductions += p.totalDeductions || 0;
      totalNet += p.netTakeHomePay || 0;
    });

    res.render("report/payroll", {
      title: "Laporan Beban Penggajian",
      listPayroll,
      analytics: {
        totalEmployees: listPayroll.length,
        totalEarnings,
        totalDeductions,
        totalNet,
      },
      filters: { periodMonth: selectedPeriod },
      availablePeriods,
    });
  } catch (error) {
    console.error("Eror Laporan Payroll:", error);
    res.status(500).send("Gagal memuat laporan penggajian");
  }
};

export const downloadPayrollPdfReport = async (req, res) => {
  try {
    const { periodMonth } = req.query;

    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const selectedPeriod = periodMonth || defaultPeriod;

    const listPayroll = await Payroll.find({
      periodMonth: selectedPeriod,
      status: { $in: ["CLOSED", "PAID"] },
    })
      .populate("employeeId")
      .lean();

    let totalEarnings = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    listPayroll.forEach((p) => {
      totalEarnings += p.totalEarnings || 0;
      totalDeductions += p.totalDeductions || 0;
      totalNet += p.netTakeHomePay || 0;
    });

    const analytics = {
      totalEmployees: listPayroll.length,
      totalEarnings,
      totalDeductions,
      totalNet,
    };

    const pdfBuffer = await generatePayrollPdf(listPayroll, analytics, {
      periodMonth: selectedPeriod,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Payroll_Periode_${selectedPeriod}.pdf`
    );

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Gagal mengekspor PDF Rekap Payroll:", error);
    return res.status(500).send("Terjadi kesalahan internal saat memproses dokumen PDF Payroll.");
  }
};

export const downloadPayrollExcelReport = async (req, res) => {
  try {
    const { periodMonth } = req.query;
    const now = new Date();
    const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const selectedPeriod = periodMonth || defaultPeriod;

    const listPayroll = await Payroll.find({
      periodMonth: selectedPeriod,
      status: { $in: ["CLOSED", "PAID"] },
    })
      .populate("employeeId")
      .lean();

    const excelBuffer = await generatePayrollExcel(listPayroll);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Payroll_${selectedPeriod}.xlsx`
    );
    return res.end(excelBuffer);
  } catch (error) {
    console.error("Gagal mengekspor Excel Payroll:", error);
    return res.status(500).send("Gagal mengunduh laporan Excel Payroll.");
  }
};

export const downloadSingleSlipPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const payroll = await Payroll.findById(id).lean();
    if (!payroll) {
      return res.status(404).send("Data dokumen slip gaji tidak ditemukan.");
    }

    const employee = await Employee.findById(payroll.employeeId)
      .populate({
        path: "careerData",
        populate: [
          { path: "bidangId", model: "Bidang" },
          { path: "positionId", model: "Position" },
          { path: "unitId", model: "Unit" },
        ],
      })
      .lean({ virtuals: true });

    if (!employee) {
      return res.status(404).send("Profil karyawan pemilik dokumen tidak ditemukan.");
    }

    if (employee.careerData && employee.careerData.length > 0) {
      employee.careerData = employee.careerData[0];
    } else {
      employee.careerData = null;
    }

    const allowances = payroll.allowances || [];
    const deductions = payroll.deductions || [];

    const pdfBuffer = await generateSingleSlipPdf(payroll, employee, allowances, deductions);

    const safeFileName = `Slip_Gaji_${employee.fullName.replace(/\s+/g, "_")}_Periode_${payroll.periodMonth}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${safeFileName}`);

    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Gagal mengekspor PDF Slip Gaji Individu:", error);
    return res.status(500).send("Terjadi eror internal saat mencetak berkas PDF slip gaji.");
  }
};
