import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  visitForm,
  salesHistory,
  storeVisit,
  salesReport,
} from "../controllers/salesController.js";

const router = express.Router();

router.get("/sales/visit", authMiddleware, visitForm);
router.post("/visit", authMiddleware, uploadFile.array("attachments", 5), storeVisit);
router.get("/sales/history", authMiddleware, salesHistory);
router.get(
  "/sales/report",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  salesReport
);

export default router;
