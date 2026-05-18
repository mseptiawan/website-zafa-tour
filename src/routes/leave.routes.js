import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { showApplyLeave, applyLeave, myLeave } from "../controllers/leaveController.js";

const router = express.Router();

router.get("/leave/apply", authMiddleware, showApplyLeave);

router.post("/leave/apply", authMiddleware, uploadFile.single("file"), applyLeave);

router.get("/leave/my", authMiddleware, myLeave);

export default router;
