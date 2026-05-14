import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  formAnnouncement,
  createAnnouncement,
  allAnnouncements,
  detailAnnouncement,
  publishAnnouncement,
} from "../controllers/announcementController.js";

const router = express.Router();

router.get("/announcement/create", authMiddleware, formAnnouncement);
router.post(
  "/announcement/create",
  authMiddleware,
  uploadFile.single("attachment"),
  createAnnouncement
);
router.get("/announcement/all", authMiddleware, allAnnouncements);
router.get("/announcement/:id", authMiddleware, detailAnnouncement);
router.post("/announcement/:id/publish", authMiddleware, publishAnnouncement);

export default router;
