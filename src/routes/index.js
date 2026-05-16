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
import expenseRoutes from "./expense.routes.js";
import finance from "./finance.routes.js";
const router = express.Router();

router.use("/", authRoutes);
router.use("/", leaveRoutes);
router.use("/", overtimeRoutes);
router.use("/", attendanceRoutes);
router.use("/", kpiRoutes);
router.use("/trip", tripRoutes);
router.use("/finance", finance);
router.use("/sales", salesRoutes);
router.use("/assignment", assignmentRoutes);
router.use("/announcement", announcementRoutes);
router.use("/", expenseRoutes);

export default router;
