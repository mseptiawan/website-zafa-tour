import express from "express";
import { renderManagePage, getAllComponents } from "../controllers/salaryComponentController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js"; // Sesuaikan path middleware kamu

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderManagePage);

router.get("/api/data", getAllComponents);

export default router;