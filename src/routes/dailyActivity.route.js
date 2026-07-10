import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  renderDailyActivityPage,
  renderReviewPage,
  getActivities,
  createDailyActivity,
  carryOverTasks,
  updateDailyActivity,
  getReviewData,
} from "../controllers/dailyActivity.controller.js";

const router = express.Router();

router.use(authMiddleware);

// ─── WEB VIEWS  ──────────────────
router.get("/", renderDailyActivityPage);
router.get("/review", renderReviewPage);

// ─── API ENDPOINTS ───
router.get("/api", getActivities);
router.post("/api", createDailyActivity);
router.post("/api/carry-over", carryOverTasks);
router.put("/api/:id", uploadFile.single("attachment"), updateDailyActivity);
router.get("/api/review", getReviewData);

export default router;
