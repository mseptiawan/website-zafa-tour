import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  renderCreateTripForm,
  storeTrip,
  getTripHistory,
  getTripDetail,
  getIncomingTrips,
  renderEditTripForm,
  updateTrip,
  actionTripApproval,
} from "../controllers/trip.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_APPROVER_ROLES = [
  "DIREKTUR_UTAMA",
  "WAKIL_DIREKTUR",
  "MANAGER_ADMINISTRASI",
  "MANAGER_KEUANGAN",
  "MANAGER_HAJI_UMRAH",
];

router.get("/new", renderCreateTripForm);
router.post("/", storeTrip);
router.get("/me", getTripHistory);
router.get("/edit/:id", renderEditTripForm);
router.post("/edit/:id", updateTrip);
router.get("/detail/:id", getTripDetail);

router.get("/incoming", roleMiddleware(...ALLOWED_APPROVER_ROLES), getIncomingTrips);

router.post(
  "/approval/:id",
  roleMiddleware(...ALLOWED_APPROVER_ROLES),
  uploadFile.single("disbursementFile"),
  actionTripApproval
);
export default router;
