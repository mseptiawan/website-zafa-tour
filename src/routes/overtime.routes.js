import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";

import { createOvertimeSchema } from "../validations/overtime.schema.js";
import {
  showApplyOvertime,
  applyOvertime,
  myOvertime,
  getPayrollOvertimeSummary,
  approvalOvertimePage,
  approveManagerOvertime,
  getOvertimeDetail,
  rejectOvertime,
  approvalOvertimeHistory,
} from "../controllers/overtime.controller.js";

const router = express.Router();

const APPROVAL_ROLES = [
  "WAKIL_DIREKTUR",
  "MANAGER_ADMINISTRASI",
  "MANAGER_KEUANGAN",
  "MANAGER_HAJI_UMRAH",
  "DIREKTUR_UTAMA",
];

router.use(authMiddleware);

router.get("/new", showApplyOvertime);
router.post("/", uploadFile.single("proofFile"), validate(createOvertimeSchema), applyOvertime);

router.get("/my", myOvertime);

router.get(
  "/approval/history",

  roleMiddleware(APPROVAL_ROLES),
  approvalOvertimeHistory
);
router.get(
  "/approval",

  roleMiddleware(APPROVAL_ROLES),
  approvalOvertimePage
);

router.post("/approval/:id/manager", roleMiddleware(APPROVAL_ROLES), approveManagerOvertime);

router.post("/approval/:id/reject", roleMiddleware(APPROVAL_ROLES), rejectOvertime);
router.get("/summary/:userId", getPayrollOvertimeSummary);
router.get("/detail/:id", authMiddleware, getOvertimeDetail);

export default router;
