import express from "express";
import {
  renderPayrollPage,
  saveEmployeeAllowances,
  getEmployeeAttendanceSummary,
  calculateEmployeePayroll,
  closePayrollForSpecificEmployees,
} from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderPayrollPage);
router.get("/finance", renderPayrollPage);
router.post("/save", saveEmployeeAllowances);
router.get("/attendance-summary/:employeeId", getEmployeeAttendanceSummary);
router.get("/calculate/:employeeId", calculateEmployeePayroll);
router.post("/close-book", closePayrollForSpecificEmployees);
router.get("/my-slip", renderPayrollPage);
export default router;
