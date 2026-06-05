import express from "express";
import {
  renderAttendanceReportPage,
  getEmployeeReport,
  getOvertimeReport,
  getPayrollReport,
} from "../controllers/report.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/attendance", renderAttendanceReportPage);
router.get("/employees", getEmployeeReport);
router.get("/overtime", getOvertimeReport);
router.get("/payroll", getPayrollReport);
export default router;
