import express from "express";
import {
  getPayrollReport,
  downloadPayrollPdfReport,
  downloadSingleSlipPdf,
  downloadPayrollExcelReport,
} from "../controllers/report/payroll.report.controller.js";

import {
  renderAttendanceReportPage,
  downloadAttendanceExcelReport,
  downloadAttendancePdfReport,
} from "../controllers/report/attendance.report.controller.js";

import {
  getEmployeeReport,
  downloadEmployeePdfReport,
  downloadEmployeeExcelReport,
} from "../controllers/report/employee.report.controller.js";

import {
  getOvertimeReport,
  downloadOvertimeExcelReport,
  downloadOvertimePdfReport,
} from "../controllers/report/overtime.report.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/attendance", renderAttendanceReportPage);
router.get("/attendance/download-pdf", downloadAttendancePdfReport);
router.get("/attendance/download-excel", downloadAttendanceExcelReport);

router.get("/employees", getEmployeeReport);
router.get("/employees/download-pdf", downloadEmployeePdfReport);
router.get("/employees/download-excel", downloadEmployeeExcelReport);

router.get("/overtime", getOvertimeReport);
router.get("/overtime/download-pdf", downloadOvertimePdfReport);
router.get("/overtime/download-excel", downloadOvertimeExcelReport);

router.get("/payroll", getPayrollReport);
router.get("/payroll/download-pdf", downloadPayrollPdfReport);
router.get("/payroll/download-excel", downloadPayrollExcelReport);

router.get("/payroll/download-pdf/:id", downloadSingleSlipPdf);

export default router;
