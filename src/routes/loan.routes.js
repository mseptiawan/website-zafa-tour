import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  newForm,
  create,
  myLoans,
  cancel,
  edit,
  update,
  getManageLoanPage,
  getDetail,
  approveLoan,
  rejectLoan,
  getFinanceCenterPage,
  disburseLoan,
} from "../controllers/loan.controller.js";

const router = express.Router();

// Proteksi Global: Sesi login aktif diwajibkan
router.use(authMiddleware);

// --- Akses Fitur Karyawan Mandiri ---
router.get("/new", newForm);
router.post("/", create);
router.get("/my", myLoans);
router.get("/detail/:id", getDetail);
router.get("/edit/:id", edit);
router.post("/update/:id", update);
router.post("/cancel/:id", cancel);

// --- Akses Manajemen Utama
router.get("/approval", roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"), getManageLoanPage);
router.post(
  "/approval/approve/:id",
  roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"),
  approveLoan
);
router.post("/approval/reject/:id", roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"), rejectLoan);

// --- Akses Finance & Kasir Perusahaan (Pencairan Dana) ---
router.get("/disbursement", roleMiddleware("MANAGER_KEUANGAN"), getFinanceCenterPage);
router.post(
  "/approval/disburse/:id",
  roleMiddleware("MANAGER_KEUANGAN"),
  uploadFile.single("paymentProof"),
  disburseLoan
);

export default router;
