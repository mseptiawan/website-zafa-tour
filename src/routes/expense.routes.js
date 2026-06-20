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

router.get("/create", authMiddleware, formExpense);
router.post(
  "/expense/create",
  authMiddleware,
  uploadFile.single("proofFile"),
  validate(createExpenseSchema),
  createExpense
);

router.get("/my", authMiddleware, myExpenses);

router.get(
  "/approval/manager",
  authMiddleware,
  roleMiddleware(["MANAGER_ADMINISTRASI"]),
  approvalManagerExpense
);

router.post(
  "/:id/approve/manager",
  authMiddleware,
  roleMiddleware(["MANAGER_ADMINISTRASI"]),
  approveManagerExpense
);
router.post(
  "/:id/reject/manager",
  authMiddleware,
  roleMiddleware(["MANAGER_ADMINISTRASI"]),
  rejectManagerExpense
);
router.get("/finance", authMiddleware, roleMiddleware("MANAGER_KEUANGAN"), financeExpensePage);
router.post(
  "/:id/pay",
  authMiddleware,
  roleMiddleware("MANAGER_KEUANGAN"),
  uploadFile.single("transferProof"),
  payExpense
);

export default router;
