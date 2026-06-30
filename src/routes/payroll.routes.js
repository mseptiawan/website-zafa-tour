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
import roleMiddleware from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Role dengan hak otorisasi manajemen payroll perusahaan
const PAYROLL_MANAGEMENT_ROLES = ["DIREKTUR_UTAMA", "WAKIL_DIREKTUR", "HR"];

// Semua rute di bawah ini wajib memiliki sesi login aktif
router.use(authMiddleware);

// --- Hak Akses Manajemen Keuangan & HR ---
router.get("/manage", roleMiddleware(...PAYROLL_MANAGEMENT_ROLES), renderPayrollPage);
router.post("/save", roleMiddleware(...PAYROLL_MANAGEMENT_ROLES), saveEmployeeAllowances);
router.get("/calculate/:employeeId", roleMiddleware(...PAYROLL_MANAGEMENT_ROLES), calculatePayroll);
router.post("/close-book", roleMiddleware(...PAYROLL_MANAGEMENT_ROLES), closePayrollForEmployees);
router.get(
  "/attendance-summary/:employeeId",
  roleMiddleware(...PAYROLL_MANAGEMENT_ROLES),
  getEmployeeAttendanceSummary
);

// --- Hak Akses Karyawan Mandiri ---
router.get("/my-slip", renderMySlipPage);

export default router;
