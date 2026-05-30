import express from "express";
import { index } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", authMiddleware, index);

export default router;
