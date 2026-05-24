import express from "express";
import { renderPayrollPage } from "../controllers/payroll.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);

router.get("/manage", renderPayrollPage);

export default router;
