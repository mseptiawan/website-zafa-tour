import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  listPendingApprovals,
  listHistoryPHK,
  approvePHK,
} from "../controllers/approval.controller.js";

const router = express.Router();

router.use(authMiddleware);

// Pimpinan melihat daftar antrean pengajuan PHK status 'Waiting'
router.get("/pending", listPendingApprovals);

// Pimpinan menyetujui pengajuan PHK berdasarkan ID
router.post("/:terminationId/approve", approvePHK);
router.get("/history", listHistoryPHK);
export default router;
