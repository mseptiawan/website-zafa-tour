import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  formExpense,
  createExpense,
  rejectManagerExpense,
  myExpenses,
  allExpenses,
  approvalManagerExpense,
  approveManagerExpense,
  financeExpensePage,
  payExpense,
} from "../controllers/expense.controller.js";

const router = express.Router();

router.get("/expense/create", authMiddleware, formExpense);
router.post("/expense/create", authMiddleware, uploadFile.single("proofFile"), createExpense);

router.get("/expense/my", authMiddleware, myExpenses);
router.get(
  "/expense/all",
  authMiddleware,
  roleMiddleware(["WAKIL_DIREKTUR", "MANAGER_ADMINISTRASI", "DIREKTUR_UTAMA"]),
  allExpenses
);

router.get(
  "/expense/approval/manager",
  authMiddleware,
  roleMiddleware(["MANAGER_ADMINISTRASI"]),
  approvalManagerExpense
);

router.post(
  "/expense/:id/approve/manager",
  authMiddleware,
  roleMiddleware(["MANAGER_ADMINISTRASI"]),
  approveManagerExpense
);
router.post(
  "/expense/:id/reject/manager",
  authMiddleware,
  roleMiddleware(["MANAGER_ADMINISTRASI"]),
  rejectManagerExpense
);
router.get(
  "/expense/finance",
  authMiddleware,
  roleMiddleware("MANAGER_KEUANGAN"),
  financeExpensePage
);
router.post(
  "/expense/:id/pay",
  authMiddleware,
  roleMiddleware("MANAGER_KEUANGAN"),
  uploadFile.single("transferProof"),
  payExpense
);

export default router;
