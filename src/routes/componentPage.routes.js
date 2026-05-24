import express from "express";
import { renderManagePage } from "../controllers/salaryComponent.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderManagePage);

export default router;
