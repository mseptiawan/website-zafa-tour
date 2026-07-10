import express from "express";
import { renderDashboardPage } from "../controllers/dashboard.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, renderDashboardPage);

export default router;
