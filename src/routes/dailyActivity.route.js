import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  index,
  renderReviewPage,
  getActivities,
  store,
  carryOverTasks,
  update,
  getReviewData,
} from "../controllers/dailyActivity.controller.js";

const router = express.Router();

router.use(authMiddleware);

// ─── WEB VIEWS  ──────────────────
router.get("/", index);
router.get("/review", renderReviewPage);

// ─── API ENDPOINTS ───
router.get("/api", getActivities);
router.post("/api", store);
router.post("/api/carry-over", carryOverTasks);
router.put("/api/:id", uploadFile.single("attachment"), update);
router.get("/api/review", getReviewData);

export default router;
