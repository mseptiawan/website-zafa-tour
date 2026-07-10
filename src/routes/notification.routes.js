import express from "express";
import {
  getNotifications,
  markAllRead,
  markSingleRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", getNotifications);
router.post("/mark-all-read", markAllRead);
router.patch("/:id/read", markSingleRead);

export default router;
