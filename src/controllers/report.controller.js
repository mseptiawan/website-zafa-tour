import Payroll from "../models/payroll/Payroll.model.js";
import { Overtime } from "../models/Overtime.model.js";
import Employee from "../models/employee/Employee.model.js";
import { attendanceHistory } from "./attendance.controller.js";

// === IMPOR SERVICES PUPPETEER ===
import {
  generateEmployeePdf,
  generateOvertimePdf,
  generatePayrollPdf,
  generateAttendancePdf,
  getExecutiveReportSummary,
} from "../services/report.service.js";

/**
 * Controller Laporan Absensi (Existing)
 */
export const renderAttendanceReportPage = async (req, res, next) => {
  try {
    const startDate = req.query.startDate || "2026-05-27";
    const endDate = req.query.endDate || "2026-06-26";

    const mockReq = {
      user: req.user,
      session: { user: req.user },
      query: { startDate, endDate, view: "all" },
    };

    const mockRes = {
      render: (viewPath, data) => {
        return res.render("report/attendance", {
          title: "Laporan Absensi Karyawan",
          listAttendance: data.listAttendance,
          analytics: data.analytics,
          filters: { startDate, endDate },
          user: req.user,
        });
      },
      status: function () {
        return this;
      },
      json: function (obj) {
        return res.json(obj);
      },
    };

    const mockNext = (err) => {
      if (err) console.error("Log internal next attendance:", err);
    };
    await attendanceHistory(mockReq, mockRes, mockNext);
  } catch (error) {
    console.error("Gagal merender laporan absensi:", error);
    return res.status(500).send("Terjadi masalah saat memuat laporan absensi.");
  }
};

/**
 * Controller Laporan Pegawai (UI Dashboard)
 */
export const getEmployeeReport = async (req, res) => {
  try {
    const employees = await Employee.find({});
    res.render("report/employee", {
      title: "Laporan Data Pegawai",
      employees,
    });
  } catch (error) {
    res.status(500).send("Eror menarik laporan pegawai");
  }
};

/**
 * ACTION: UNDUH PDF DATA PEGAWAI
 */
export const downloadEmployeePdfReport = async (req, res) => {
  try {
    const employees = await Employee.find({});

    const pdfBuffer = await generateEmployeePdf(employees);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=Laporan_Data_Karyawan_ZafaTour.pdf");
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Gagal mengekspor PDF melalui ReportController:", error);
    return res.status(500).send("Gagal mengunduh laporan PDF data karyawan.");
  }
};

/**
 * Controller Laporan Aktivitas Lembur (UI Dashboard)
 */
export const getOvertimeReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    filter.date = { $gte: start, $lte: end };
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
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Eror Laporan Lembur:", error);
    res.status(500).send("Gagal memuat laporan aktivitas lembur");
  }
};

/**
 * ACTION: UNDUH PDF REKAP LEMBUR
 */
export const downloadOvertimePdfReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = {};

    const start = startDate
      ? new Date(startDate)
      : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    filter.date = { $gte: start, $lte: end };
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

    const filters = {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };

    const pdfBuffer = await generateOvertimePdf(listOvertime, analytics, filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Lembur_${filters.startDate}_to_${filters.endDate}.pdf`
    );
    return res.end(pdfBuffer);
  } catch (error) {
    console.error("Gagal mengekspor PDF Rekap Lembur:", error);
    return res.status(500).send("Terjadi kesalahan saat memproses dokumen PDF.");
  }
};

/**
 * Controller Laporan Penggajian (Existing)
 */
export const getPayrollReport = async (req, res) => {
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
    });
  } catch (error) {
    console.error("Eror Laporan Payroll:", error);
    res.status(500).send("Gagal memuat laporan penggajian");
  }
};

/**
 * ACTION: UNDUH PDF LAPORAN PAYROLL / PENGGAJIAN
 */
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
    console.error("❌ Gagal mengekspor PDF Rekap Payroll:", error);
    return res.status(500).send("Terjadi kesalahan internal saat memproses dokumen PDF Payroll.");
  }
};
/**
 * ACTION: UNDUH PDF REKAPITULASI ABSENSI
 */
export const downloadAttendancePdfReport = async (req, res, next) => {
  try {
    const startDate = req.query.startDate || "2026-05-27";
    const endDate = req.query.endDate || "2026-06-26";

    const mockReq = {
      user: req.user,
      session: { user: req.user },
      query: {
        startDate,
        endDate,
        view: "all",
      },
    };

    const mockRes = {
      render: async (viewPath, data) => {
        try {
          const filters = { startDate, endDate };

          const pdfBuffer = await generateAttendancePdf(
            data.listAttendance,
            data.analytics,
            filters
          );

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader(
            "Content-Disposition",
            `attachment; filename=Rekap_Absensi_Pegawai_${startDate}_to_${endDate}.pdf`
          );
          return res.end(pdfBuffer);
        } catch (pdfErr) {
          console.error("❌ Gagal merender berkas PDF internal:", pdfErr);
          return res.status(500).send("Gagal mengolah dokumen PDF.");
        }
      },
      status: function () {
        return this;
      },
      json: function (obj) {
        return res.json(obj);
      },
    };

    const mockNext = (err) => {
      if (err) console.error("⚠️ Log internal next download attendance PDF:", err);
    };

    await attendanceHistory(mockReq, mockRes, mockNext);
  } catch (error) {
    console.error("❌ Gagal memproses unduhan PDF absensi:", error);
    return res.status(500).send("Terjadi masalah saat mencetak laporan absensi.");
  }
};
/**
 * VIEW: DASHBOARD RINGKASAN REKAPITULASI (MOBILE-FRIENDLY)
 */
export const renderMobileReportDashboard = async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const startDate =
      req.query.startDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = req.query.endDate || now.toISOString().split("T")[0];
    const periodMonth = req.query.periodMonth || currentMonthStr;

    // Panggil layer Service untuk mengambil data summary
    const summary = await getExecutiveReportSummary({ startDate, endDate, periodMonth });

    return res.render("management/report-overview", {
      title: "Lap. Lengkap",
      filters: { startDate, endDate, periodMonth },
      summary: summary,
    });
  } catch (error) {
    console.error("Error pada Mobile Report Dashboard:", error);
    return res.status(500).send("Gagal memuat dashboard laporan.");
  }
};

/**
 * VIEW: ANALITIK DETAIL (DESKTOP)
 */
export const renderAnalyticsReport = async (req, res) => {
  try {
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const startDate =
      req.query.startDate ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const endDate = req.query.endDate || now.toISOString().split("T")[0];
    const periodMonth = req.query.periodMonth || currentMonthStr;

    // Panggil fungsi service yang sama demi konsistensi data
    const summary = await getExecutiveReportSummary({ startDate, endDate, periodMonth });

    return res.render("management/analytics", {
      title: "Lap. Lengkap",
      filters: { startDate, endDate, periodMonth },
      summary: summary,
    });
  } catch (error) {
    console.error("Error pada Analytics Report:", error);
    return res.status(500).send("Gagal memuat laporan lengkap.");
  }
};
