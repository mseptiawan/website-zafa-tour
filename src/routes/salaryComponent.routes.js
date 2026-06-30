import express from "express";
import {
  renderManagePage,
  createComponent,
  updateComponent,
  archiveComponent,
  restoreComponent,
} from "../controllers/salaryComponent.controller.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/manage", renderManagePage);

router.post("/", createComponent);

router.put("/:id", updateComponent);

router.patch("/:id", archiveComponent);

router.patch("/restore/:id", restoreComponent);
export default router;
