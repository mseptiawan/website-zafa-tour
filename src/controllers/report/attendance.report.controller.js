import { getAttendanceHistory } from "../../services/attendance.service.js";
import {
  generatePayrollPeriods,
  getPayrollPeriod,
  getPayrollPeriodById,
} from "../../utils/payrollPeriod.js";
import {
  generateAttendancePdf,
  generateAttendanceExcel,
} from "../../services/report/attendance.service.js";

const ADMIN_ROLES = ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA", "MANAGER_ADMINISTRASI", "HRD", "ADMIN"];

export const renderAttendanceReportPage = async (req, res, next) => {
  try {
    const availablePeriods = generatePayrollPeriods(6, 3);
    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = req.query.period || currentPeriodId;

    const periodObj = getPayrollPeriodById(selectedPeriod);
    const calculatedStartDate = periodObj.start.toISOString();
    const calculatedEndDate = periodObj.end.toISOString();

    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const viewMode = isAdmin ? req.query.view || "all" : "personal";

    const serviceQuery = {
      ...req.query,
      period: selectedPeriod,
      view: viewMode,
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
    };

    const data = await getAttendanceHistory(req.user, serviceQuery);
    const isPersonalView = data.activeView === "personal";

    return res.render("report/attendance", {
      title: isAdmin && !isPersonalView ? "Laporan Absensi Karyawan" : "Laporan Absensi Saya",
      listAttendance: data.listAttendance,
      analytics: data.analytics,
      filters: {
        period: selectedPeriod,
      },
      availablePeriods,
      user: req.user,
      isAdmin,
      isPersonalView,
    });
  } catch (error) {
    next(error);
  }
};

export const downloadAttendancePdfReport = async (req, res, next) => {
  try {
    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = req.query.period || currentPeriodId;

    const periodObj = getPayrollPeriodById(selectedPeriod);
    const startDate = periodObj.start.toISOString();
    const endDate = periodObj.end.toISOString();

    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const viewMode = isAdmin ? req.query.view || "all" : "personal";

    const serviceQuery = {
      ...req.query,
      period: selectedPeriod,
      startDate,
      endDate,
      view: viewMode,
    };

    const data = await getAttendanceHistory(req.user, serviceQuery);

    const filters = {
      startDate: startDate.split("T")[0],
      endDate: endDate.split("T")[0],
      period: selectedPeriod,
    };

    const pdfBuffer = await generateAttendancePdf(data.listAttendance, data.analytics, filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Rekap_Absensi_Pegawai_Siklus_${selectedPeriod}.pdf`
    );
    return res.end(pdfBuffer);
  } catch (error) {
    console.error(error);
    return res.status(500).send("Terjadi masalah saat mencetak laporan absensi.");
  }
};

export const downloadAttendanceExcelReport = async (req, res, next) => {
  try {
    const currentPeriodId = getPayrollPeriod(new Date()).id;
    const selectedPeriod = req.query.period || currentPeriodId;

    const periodObj = getPayrollPeriodById(selectedPeriod);
    const calculatedStartDate = periodObj.start.toISOString();
    const calculatedEndDate = periodObj.end.toISOString();

    const isAdminRole = ADMIN_ROLES.includes(req.user?.role);
    const viewMode = isAdminRole ? req.query.view || "all" : "personal";

    const serviceQuery = {
      ...req.query,
      period: selectedPeriod,
      view: viewMode,
      startDate: calculatedStartDate,
      endDate: calculatedEndDate,
    };

    const data = await getAttendanceHistory(req.user, serviceQuery);
    const isAdmin = data.isAdmin;
    const isPersonalView = data.activeView === "personal";

    const workbook = await generateAttendanceExcel(data, selectedPeriod);

    const fileName = isAdmin && !isPersonalView ? "Rekap_Global_Absensi" : "Log_Presensi_Harian";
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${fileName}_Siklus_${selectedPeriod}.xlsx`
    );

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    console.error(error);
    return res.status(500).send("Terjadi kendala sewaktu memproses unduhan Excel.");
  }
};
