import express from "express";

import authRoutes from "./auth.routes.js";
import leaveRoutes from "./leave.routes.js";
import overtimeRoutes from "./overtime.routes.js";
import attendanceRoutes from "./attendance.routes.js";
import kpiRoutes from "./kpi.routes.js";
import tripRoutes from "./trip.routes.js";
import salesRoutes from "./sales.routes.js";
import assignmentRoutes from "./assignment.routes.js";
import announcementRoutes from "./announcement.routes.js";
import expenseCategoryRoutes from "./expenseCategory.routes.js";

import expenseRoutes from "./expense.routes.js";
import dailylog from "./dailylog.route.js";
import finance from "./finance.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import approvalRoutes from "./approval.routes.js";
import organizationRoutes from "./organization.routes.js";
import webEmployeeRoutes from "./web/employee.routes.js";
import apiEmployeeRoutes from "./api/employee.routes.js";
import loanRoutes from "./loan.routes.js";
import notificationRoutes from "./notification.routes.js";
import componentPageRoutes from "./componentPage.routes.js";
import salaryComponentRoutes from "./salaryComponent.routes.js";
import payrollPageRoutes from "./payrollPage.routes.js";
import payrollRoutes from "./payroll.routes.js";

const router = express.Router();

router.use("/", authRoutes);
router.use("/", dashboardRoutes);
router.use("/", leaveRoutes);
router.use("/", overtimeRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/employee", webEmployeeRoutes);
router.use("/api/employee", apiEmployeeRoutes);
router.use("/", organizationRoutes);
router.use("/", kpiRoutes);
router.use("/trip", tripRoutes);
router.use("/daily-log", dailylog);
router.use("/approvals", approvalRoutes);
router.use("/finance", finance);
router.use("/sales", salesRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/announcement", announcementRoutes);
router.use("/expense-categories", expenseCategoryRoutes);
router.use("/", expenseRoutes);
router.use("/loans", loanRoutes);
router.use("/components", componentPageRoutes);
router.use("/api/components", salaryComponentRoutes);
router.use("/payroll", payrollPageRoutes);
router.use("/api/payroll", payrollRoutes);
router.use("/api", notificationRoutes);

export default router;
