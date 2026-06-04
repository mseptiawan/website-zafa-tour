import express from "express";
import {
  renderPayrollPage,
  saveEmployeeAllowances,
  getEmployeeAttendanceSummary,
} from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderPayrollPage);

router.post("/save", saveEmployeeAllowances);
router.get("/attendance-summary/:employeeId", getEmployeeAttendanceSummary);
export default router;
