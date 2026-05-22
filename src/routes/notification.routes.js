import express from "express";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/api/notifications", notificationController.getNotifications);
router.post("/api/notifications/mark-all-read", notificationController.markAllRead);

export default router;
