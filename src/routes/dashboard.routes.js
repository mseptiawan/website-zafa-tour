import express from "express";
import { index } from "../controllers/DashboardController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Halaman utama jalankan fungsi controller tadi
router.get("/dashboard", authMiddleware, index);

export default router;
