import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  renderDailyLogPage,
  getDailyLogApi,
  createActivity,
  updateActivity,
  carryOverTasks,
} from "../controllers/dailyLog.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", renderDailyLogPage);

router.get("/api/data", getDailyLogApi);

// 2. Simpan aktivitas baru -> POST /daily-log/api/data
router.post("/api/data", createActivity);

// 3. Salin tugas pending kemarin -> POST /daily-log/api/carry-over
router.post("/api/carry-over", carryOverTasks);

// 4. Update data/status aktivitas -> PUT /daily-log/api/:id
router.put("/api/:id", uploadFile.single("attachment"), updateActivity);

export default router;
