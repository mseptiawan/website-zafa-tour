import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  listPendingApprovals,
  listHistoryPHK,
  approvePHK,
} from "../controllers/approval.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/pending", listPendingApprovals);

router.post("/:terminationId/approve", approvePHK);
router.get("/history", listHistoryPHK);
export default router;
