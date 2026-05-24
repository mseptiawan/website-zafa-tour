import express from "express";
import { savePayroll } from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/save", savePayroll);

export default router;
