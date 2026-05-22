import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  formExpense,
  createExpense,
  myExpenses,
  allExpenses,
  approvalManagerExpense,
  approveManagerExpense,
  financeExpensePage,
  payExpense,
} from "../controllers/expenseController.js";

const router = express.Router();

router.get("/expense/create", authMiddleware, formExpense);
router.post("/expense/create", authMiddleware, uploadFile.single("proofFile"), createExpense);

router.get("/expense/my", authMiddleware, myExpenses);
router.get(
  "/expense/all",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  allExpenses
);

router.get(
  "/expense/approval/manager",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  approvalManagerExpense
);

router.post(
  "/expense/:id/approve/manager",
  authMiddleware,
  roleMiddleware(["MANAGER"]),
  approveManagerExpense
);

router.get("/expense/finance", authMiddleware, roleMiddleware("KEUANGAN"), financeExpensePage);
router.post(
  "/expense/:id/pay",
  authMiddleware,
  roleMiddleware("KEUANGAN"),
  uploadFile.single("transferProof"),
  payExpense
);

export default router;
