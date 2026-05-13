import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  showApplyLeave,
  applyLeave,
  myLeave,
  managerApprovalPage,
  hrApprovalPage,
  pimpinanApprovalPage,
  allLeavePage,
  detailLeave,
  approveManager,
  approveHR,
  approvePimpinan,
  rejectLeave,
} from "../controllers/leaveController.js";

const router = express.Router();

/* ================= APPLY ================= */
router.get("/leave/apply", authMiddleware, showApplyLeave);
router.post("/leave/apply", authMiddleware, uploadFile.single("file"), applyLeave);

/* ================= LIST ================= */
router.get("/leave/my", authMiddleware, myLeave);
router.get(
  "/leave/all",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  allLeavePage
);

/* ================= APPROVAL PAGES ================= */
router.get(
  "/leave/approval/manager",
  authMiddleware,
  roleMiddleware("MANAGER"),
  managerApprovalPage
);
router.get("/leave/approval/hr", authMiddleware, roleMiddleware("HR"), hrApprovalPage);
router.get(
  "/leave/approval/pimpinan",
  authMiddleware,
  roleMiddleware("PIMPINAN"),
  pimpinanApprovalPage
);

/* ================= APPROVAL ACTIONS ================= */
router.post(
  "/leave/approval/:id/manager",
  authMiddleware,
  roleMiddleware("MANAGER"),
  approveManager
);
router.post("/leave/approval/:id/hr", authMiddleware, roleMiddleware("HR"), approveHR);
router.post(
  "/leave/approval/:id/pimpinan",
  authMiddleware,
  roleMiddleware("PIMPINAN"),
  approvePimpinan
);

router.post(
  "/leave/approval/:id/reject",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  rejectLeave
);

/* ================= DETAIL (HARUS PALING BAWAH) ================= */
router.get("/leave/:id", authMiddleware, detailLeave);

export default router;
