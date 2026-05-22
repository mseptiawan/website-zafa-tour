import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  showApplyOvertime,
  applyOvertime,
  myOvertime,
  approvalOvertimePage,
  approveManagerOvertime,
  detailOvertime,
  rejectOvertime,
  approvalOvertimeHistory,
} from "../controllers/overtimeController.js";

const router = express.Router();

router.get("/overtime/apply", authMiddleware, showApplyOvertime);
router.post("/overtime/apply", authMiddleware, uploadFile.single("proofFile"), applyOvertime);

router.get("/overtime/my", authMiddleware, myOvertime);

router.get(
  "/overtime/approval/history",
  authMiddleware,
  roleMiddleware("MANAGER"),
  approvalOvertimeHistory
);
router.get(
  "/overtime/approval",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER"]),
  approvalOvertimePage
);

router.post(
  "/overtime/approval/:id/manager",
  authMiddleware,
  roleMiddleware("MANAGER"),
  approveManagerOvertime
);
router.post(
  "/overtime/approval/:id/reject",
  authMiddleware,
  roleMiddleware("MANAGER"),
  rejectOvertime
);

// router.get("/report/overtime", authMiddleware, getReportPage);
// router.get("/report/overtime/export/excel", authMiddleware, exportExcel);
// router.get("/report/overtime/export/pdf", authMiddleware, exportPDF);

router.get("/overtime/:id", authMiddleware, detailOvertime);

export default router;
