import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createOvertimeSchema } from "../validations/overtime.schema.js";
import {
  create,
  store,
  my,
  getPayrollOvertimeSummary,
  approvalOvertimePage,
  approveManagerOvertime,
  getOvertimeDetail,
  rejectOvertime,
} from "../controllers/overtime.controller.js";

const router = express.Router();

const APPROVAL_ROLES = [
  "DIREKTUR_UTAMA",
  "WAKIL_DIREKTUR",
  "MANAGER_ADMINISTRASI",
  "MANAGER_KEUANGAN",
  "MANAGER_HAJI_UMRAH",
];

// Semua rute wajib login terlebih dahulu
router.use(authMiddleware);

// Rute khusus Karyawan (Pengajuan & Riwayat Mandiri)
router.get("/new", create);
router.post("/", uploadFile.single("proofFile"), validate(createOvertimeSchema), store);
router.get("/my", my);

// Rute Manajemen & Persetujuan (Approval)
router.get("/approval", roleMiddleware(...APPROVAL_ROLES), approvalOvertimePage);
router.post("/approval/:id/manager", roleMiddleware(...APPROVAL_ROLES), approveManagerOvertime);
router.post("/approval/:id/reject", roleMiddleware(...APPROVAL_ROLES), rejectOvertime);

// Rute Detail & Integrasi Payroll
router.get("/detail/:id", getOvertimeDetail);
router.get("/summary/:employeeId", getPayrollOvertimeSummary);

export default router;
