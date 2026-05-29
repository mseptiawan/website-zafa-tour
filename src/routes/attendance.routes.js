import express from "express";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import injectUser from "../middlewares/injectUser.js";
import {
  index,
  checkIn,
  checkOut,
  attendanceHistory,
  updateCompanyLocation,
} from "../controllers/attendance.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.use(injectUser);

router.get("/", index);
router.get("/history", attendanceHistory);

router.post("/checkin", uploadPhoto.single("photo"), checkIn);
router.post("/checkout", uploadPhoto.single("photo"), checkOut);

router.post("/company/location", updateCompanyLocation);

export default router;