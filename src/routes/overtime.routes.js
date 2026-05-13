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

import { getReportPage, exportExcel, exportPDF } from "../controllers/overtimeReportController.js";

const router = express.Router();

/* APPLY */
router.get("/overtime/apply", authMiddleware, showApplyOvertime);
router.post("/overtime/apply", authMiddleware, uploadFile.single("proofFile"), applyOvertime);

/* LIST */
router.get("/overtime/my", authMiddleware, myOvertime);

/* APPROVAL */
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

/* REPORT (HARUS DI ATAS /:id) */
router.get("/report/overtime", authMiddleware, getReportPage);
router.get("/report/overtime/export/excel", authMiddleware, exportExcel);
router.get("/report/overtime/export/pdf", authMiddleware, exportPDF);

/* DETAIL (PALING BAWAH) */
router.get("/overtime/:id", authMiddleware, detailOvertime);

export default router;
