import express from "express";
import {
  renderPayrollPage,
  saveEmployeeAllowances,
  getEmployeeAttendanceSummary,
  calculatePayroll,
  closePayrollForEmployees,
  renderMySlipPage,
} from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderPayrollPage);
router.post("/save", saveEmployeeAllowances);
router.get("/attendance-summary/:employeeId", getEmployeeAttendanceSummary);
router.get("/calculate/:employeeId", calculatePayroll);
router.post("/close-book", closePayrollForEmployees);
router.get("/my-slip", renderMySlipPage);

export default router;
