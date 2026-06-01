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
  approvalOvertimePage,
  approveManagerOvertime,
  detailOvertime,
  rejectOvertime,
  approvalOvertimeHistory,
} from "../controllers/overtime.controller.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/new", showApplyOvertime);
router.post(
  "/",
  uploadFile.single("proofFile"),
  validate(createOvertimeSchema),
  applyOvertime
);

router.get("/my", myOvertime);

router.get(
  "/approval/history",

  roleMiddleware("MANAGER_ADMINISTRASI"),
  approvalOvertimeHistory
);
router.get(
  "/approval",

  roleMiddleware(["MANAGER_ADMINISTRASI", "WAKIL_DIREKTUR"]),
  approvalOvertimePage
);

router.post(
  "/approval/:id/manager",

  roleMiddleware("MANAGER_ADMINISTRASI"),
  approveManagerOvertime
);
router.post(
  "/approval/:id/reject",

  roleMiddleware("MANAGER_ADMINISTRASI"),
  rejectOvertime
);

router.get("/:id", authMiddleware, detailOvertime);

export default router;
