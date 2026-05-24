import express from "express";
import { saveEmployeeAllowances } from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/save", saveEmployeeAllowances);

export default router;
