import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { listPendingApprovals, approvePHK } from "../controllers/termination.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/pending", listPendingApprovals);
router.post("/:terminationId/approve", approvePHK);

export default router;
