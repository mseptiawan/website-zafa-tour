import express from "express";
import { renderManagePage, getAllComponents } from "../controllers/salaryComponent.controller.js";
import authMiddleware  from "../middlewares/authMiddleware.js"; 

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderManagePage);

router.get("/api/data", getAllComponents);

export default router;