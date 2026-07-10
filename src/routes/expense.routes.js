import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createExpenseSchema } from "../validations/expense.schema.js";

import {
  renderCreateExpenseForm,
  storeExpense,
  getMyExpenses,
  showExpense,
  getExpenseApprovalPage,
  approveExpense,
  rejectExpense,
  getExpenseFinancePage,
  payExpense,
} from "../controllers/expense.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_MANAGEMENT_ROLES = [
  "MANAGER_ADMINISTRASI",
  "WAKIL_DIREKTUR",
  "MANAGER_KEUANGAN",
  "MANAGER_HAJI_UMRAH",
];

router.get("/new", renderCreateExpenseForm);
router.post("/", uploadFile.single("proofFile"), validate(createExpenseSchema), storeExpense);
router.get("/me", getMyExpenses);
router.get("/detail/:id", showExpense);

router.get("/approval/manager", roleMiddleware(ALLOWED_MANAGEMENT_ROLES), getExpenseApprovalPage);

router.post(
  "/:id/approve",
  roleMiddleware(ALLOWED_MANAGEMENT_ROLES),
  uploadFile.single("proofFile"),
  approveExpense
);

router.post("/:id/reject", roleMiddleware(ALLOWED_MANAGEMENT_ROLES), rejectExpense);

router.get("/finance", roleMiddleware(["MANAGER_KEUANGAN"]), getExpenseFinancePage);

router.post(
  "/:id/pay",
  roleMiddleware(["MANAGER_KEUANGAN"]),
  uploadFile.single("transferProof"),
  payExpense
);

export default router;
