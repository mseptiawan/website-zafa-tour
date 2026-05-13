import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import { visitForm, storeVisit, salesReport } from "../controllers/salesController.js";

const router = express.Router();

router.get("/sales/visit", authMiddleware, visitForm);
router.post("/sales/visit", authMiddleware, uploadPhoto.array("photo", 5), storeVisit);

router.get(
  "/sales/report",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  salesReport
);

export default router;
