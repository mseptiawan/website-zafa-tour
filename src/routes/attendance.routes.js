import express from "express";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";
import {
  index,
  checkIn,
  checkOut,
  attendanceHistory,
  updateCompanyLocation,
} from "../controllers/attendanceController.js";

const router = express.Router();

router.get("/attendance", index);
router.get("/attendance/history", attendanceHistory);

router.post("/attendance/checkin", uploadPhoto.single("photo"), checkIn);
router.post("/attendance/checkout", uploadPhoto.single("photo"), checkOut);

router.post("/company/location", updateCompanyLocation);

export default router;
