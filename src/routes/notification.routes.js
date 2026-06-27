import express from "express";
import * as notificationController from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/notifications", notificationController.getNotifications);
router.post("/notifications/mark-all-read", notificationController.markAllRead);
router.patch("/notifications/:id/read", notificationController.markSingleRead);
export default router;
