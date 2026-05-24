import express from "express";
import {
  renderManagePage,
  createComponent,
  updateComponent,
  archiveComponent,
} from "../controllers/salaryComponent.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.post("/", createComponent);

router.put("/:id", updateComponent);

router.patch("/:id", archiveComponent);

export default router;
