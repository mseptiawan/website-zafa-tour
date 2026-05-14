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

router.use(authMiddleware);

router.get("/", allAnnouncements);
router.get("/new", formAnnouncement);
router.post("/", uploadFile.single("attachment"), createAnnouncement);

router.get("/:id", detailAnnouncement);
router.post("/:id/publish", publishAnnouncement);

export default router;
