import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.v2.js";
import { createAnnouncementSchema } from "../validations/announcement.schema.js";

import {
  getAllAnnouncements,
  renderCreateAnnouncementForm,
  createAnnouncement,
  getAnnouncementById,
} from "../controllers/announcement.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllAnnouncements);

router.get("/new", renderCreateAnnouncementForm);

router.post(
  "/",
  uploadFile.single("attachment"),
  validate(createAnnouncementSchema),
  createAnnouncement
);

router.get("/:id", getAnnouncementById);

export default router;
