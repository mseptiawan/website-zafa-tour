import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { listPendingApprovals, approvePHK } from "../controllers/approval.controller.js";

const router = express.Router();

// Semua route di file ini wajib melewati autentikasi
router.use(authMiddleware);

// Pimpinan melihat daftar antrean pengajuan PHK status 'Waiting'
router.get("/pending", listPendingApprovals);

// Pimpinan menyetujui pengajuan PHK berdasarkan ID
router.post("/:terminationId/approve", approvePHK);

export default router;
