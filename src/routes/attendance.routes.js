import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";

import {
  index,
  checkIn,
  checkOut,
  allAttendance,
  editForm,
  manualForm,
  createManual,
  updateAttendance,
  getCorrectionDetail,
  history,
} from "../controllers/attendanceController.js";

const router = express.Router();

/* BASE */
router.get("/attendance", index);
router.get("/attendance/history", history);

/* CHECK */
router.post("/attendance/checkin", uploadPhoto.single("photo"), checkIn);
router.post("/attendance/checkout", checkOut);

/* ADMIN */
router.get("/attendance/all", authMiddleware, roleMiddleware(["HR"]), allAttendance);

/* EDIT */
router.get("/attendance/edit/:id", authMiddleware, roleMiddleware(["HR"]), editForm);
router.post("/attendance/edit/:id", authMiddleware, roleMiddleware(["HR"]), updateAttendance);

/* MANUAL */
router.get("/attendance/create-manual", authMiddleware, roleMiddleware(["HR"]), manualForm);
router.post("/attendance/create-manual", authMiddleware, roleMiddleware(["HR"]), createManual);

/* CORRECTION */
// router.get("/attendance/correction", formCorrection);
// router.post("/attendance/correction", submitCorrection);

// router.get("/attendance/correction/history", myCorrections);
// router.get(
//   "/attendance/approval-correction",
//   authMiddleware,
//   roleMiddleware(["HR"]),
//   allCorrections
// );

/* DETAIL (HARUS DI ATAS STATUS ROUTE) */
router.get("/attendance/correction/:id", authMiddleware, getCorrectionDetail);

/* STATUS ACTION */
// router.get(
//   "/attendance/correction/:id/:status",
//   authMiddleware,
//   roleMiddleware(["HR"]),
//   updateStatus
// );

export default router;
