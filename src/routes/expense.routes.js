import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createExpenseSchema } from "../validations/expense.schema.js";

import {
  create,
  store,
  my,
  show,
  approvalPage,
  approveClaim,
  rejectClaim,
  financePage,
  payClaim,
} from "../controllers/expense.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_MANAGEMENT_ROLES = [
  "MANAGER_ADMINISTRASI",
  "WAKIL_DIREKTUR",
  "MANAGER_KEUANGAN",
  "MANAGER_HAJI_UMRAH",
];

router.get("/create", create);
router.post("/create", uploadFile.single("proofFile"), validate(createExpenseSchema), store);
router.get("/my", my);
router.get("/detail/:id", show);

router.get("/approval/manager", roleMiddleware(ALLOWED_MANAGEMENT_ROLES), approvalPage);

router.post(
  "/:id/approve",
  roleMiddleware(ALLOWED_MANAGEMENT_ROLES),
  uploadFile.single("proofFile"),
  approveClaim
);

router.post("/:id/reject", roleMiddleware(ALLOWED_MANAGEMENT_ROLES), rejectClaim);

router.get("/finance", roleMiddleware(["MANAGER_KEUANGAN"]), financePage);

router.post(
  "/:id/pay",
  roleMiddleware(["MANAGER_KEUANGAN"]),
  uploadFile.single("transferProof"),
  payClaim
);

export default router;
