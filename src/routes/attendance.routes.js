import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";

import {
  index,
  checkIn,
  checkOut,
  getAttendanceDashboard,
  allAttendance,
  history,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/attendance", index);
router.get("/attendance/history", history);

router.post("/attendance/checkin", uploadPhoto.single("photo"), checkIn);
router.post("/attendance/checkout", checkOut);

router.get("/attendance/all", authMiddleware, roleMiddleware(["WAKIL_DIREKTUR"]), allAttendance);

router.get(
  "/attendance/getall",
  authMiddleware,
  roleMiddleware("WAKIL_DIREKTUR"),
  getAttendanceDashboard
);

export default router;
