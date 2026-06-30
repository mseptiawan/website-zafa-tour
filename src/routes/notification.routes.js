import express from "express";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", notificationController.getNotifications);
router.post("/mark-all-read", notificationController.markAllRead);
router.patch("/:id/read", notificationController.markSingleRead);

export default router;
