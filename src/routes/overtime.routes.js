import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createOvertimeSchema } from "../validations/overtime.schema.js";
import {
  renderCreateOvertimeForm,
  storeOvertime,
  getMyOvertime,
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

router.use(authMiddleware);

router.get("/new", renderCreateOvertimeForm);
router.post("/", uploadFile.single("proofFile"), validate(createOvertimeSchema), storeOvertime);
router.get("/my", getMyOvertime);

router.get("/approval", roleMiddleware(...APPROVAL_ROLES), approvalOvertimePage);
router.post("/approval/:id/manager", roleMiddleware(...APPROVAL_ROLES), approveManagerOvertime);
router.post("/approval/:id/reject", roleMiddleware(...APPROVAL_ROLES), rejectOvertime);

router.get("/detail/:id", getOvertimeDetail);

export default router;
