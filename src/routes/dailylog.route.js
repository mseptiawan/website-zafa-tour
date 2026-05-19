import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  renderDailyLogPage,
  getDailyLogApi, // Tambahkan import ini
  createActivity, // Tambahkan import ini
  updateActivity,
  carryOverTasks,
} from "../controllers/dailylog.controller.js";

const router = express.Router();

// Semua route daily log wajib melewati authMiddleware
router.use(authMiddleware);

// [VIEW RENDERING]
// Menampilkan halaman utama (SSR) -> GET /daily-log
router.get("/", renderDailyLogPage);

// [API JSON ENDPOINTS] -> Sesuai dengan fetch() di EJS kamu
// 1. Ambil data berdasarkan query tanggal -> GET /daily-log/api/data
router.get("/api/data", getDailyLogApi);

// 2. Simpan aktivitas baru -> POST /daily-log/api/data
router.post("/api/data", createActivity);

// 3. Salin tugas pending kemarin -> POST /daily-log/api/carry-over
router.post("/api/carry-over", carryOverTasks);

// 4. Update data/status aktivitas -> PUT /daily-log/api/:id
router.put("/api/:id", uploadFile.single("attachment"), updateActivity);

export default router;
