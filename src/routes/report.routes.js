import express from "express";
import {
  renderAttendanceReportPage,
  getEmployeeReport,
  downloadEmployeePdfReport,
  getOvertimeReport,
  downloadOvertimePdfReport,
  getPayrollReport,
  downloadPayrollPdfReport,
  downloadAttendancePdfReport,
  renderMobileReportDashboard,
  downloadSingleSlipPdf,
} from "../controllers/report.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/overview", renderMobileReportDashboard);
router.get("/attendance", renderAttendanceReportPage);
router.get("/attendance/download-pdf", downloadAttendancePdfReport);
router.get("/employees", getEmployeeReport);
router.get("/employees/download-pdf", downloadEmployeePdfReport);

router.get("/overtime", getOvertimeReport);
router.get("/overtime/download-pdf", downloadOvertimePdfReport);

router.get("/payroll", getPayrollReport);
router.get("/payroll/download-pdf", downloadPayrollPdfReport);

router.get("/payroll/download-pdf/:id", downloadSingleSlipPdf);

export default router;
