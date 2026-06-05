import express from "express";
import {
  renderPayrollPage,
  saveEmployeeAllowances,
  getEmployeeAttendanceSummary,
  calculateEmployeePayroll,
} from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderPayrollPage);
router.post("/save", saveEmployeeAllowances);
router.get("/attendance-summary/:employeeId", getEmployeeAttendanceSummary);
router.get("/calculate/:employeeId", calculateEmployeePayroll);

export default router;
