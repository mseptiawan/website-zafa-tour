import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.v2.js";
import { createExpenseSchema } from "../validations/expense.schema.js";

import {
  formExpense,
  createExpense,
  rejectManagerExpense,
  myExpenses,
  approvalManagerExpense,
  approveManagerExpense,
  financeExpensePage,
  payExpense,
} from "../controllers/expense.controller.js";

const router = express.Router();

// Definisikan daftar role yang berhak melakukan Approval Managerial agar kode lebih rapi (DRY)
const ALL_MANAGERS = [
  "MANAGER_ADMINISTRASI",
  "WAKIL_DIREKTUR",
  "MANAGER_KEUANGAN",
  "MANAGER_HAJI_UMRAH",
];

// ROUTE UNTUK PEGAWAI (UMUM)
router.get("/create", authMiddleware, formExpense);
router.post(
  "/expense/create",
  authMiddleware,
  uploadFile.single("proofFile"),
  validate(createExpenseSchema),
  createExpense
);
router.get("/my", authMiddleware, myExpenses);

// ROUTE APPROVAL MANAGER (Bisa diakses oleh Administrasi, Wakildi, Keuangan, & Haji Umrah)
router.get(
  "/approval/manager",
  authMiddleware,
  roleMiddleware(ALL_MANAGERS),
  approvalManagerExpense
);

router.post(
  "/:id/approve/manager",
  authMiddleware,
  roleMiddleware(ALL_MANAGERS),
  approveManagerExpense
);

router.post(
  "/:id/reject/manager",
  authMiddleware,
  roleMiddleware(ALL_MANAGERS),
  rejectManagerExpense
);

// ROUTE KHUSUS FINANCE / PENCAIRAN DANA
// (Tetap dikunci untuk MANAGER_KEUANGAN, atau bisa ditambah WAKIL_DIREKTUR jika berhak mencairkan)
router.get("/finance", authMiddleware, roleMiddleware(["MANAGER_KEUANGAN"]), financeExpensePage);

router.post(
  "/:id/pay",
  authMiddleware,
  roleMiddleware(["MANAGER_KEUANGAN"]),
  uploadFile.single("transferProof"),
  payExpense
);

export default router;
