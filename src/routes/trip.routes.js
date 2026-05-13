import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  formRequest,
  myTrips,
  createTrip,
  allTrips,
  approvalPage,
  handleApproval,
} from "../controllers/tripController.js";

const router = express.Router();

router.get("/trip/request", authMiddleware, formRequest);
router.post("/trip/request", authMiddleware, createTrip);
router.get("/trip/my", authMiddleware, myTrips);
router.get(
  "/trip/approval",
  authMiddleware,
  roleMiddleware(["HR", "MANAGER", "PIMPINAN"]),
  approvalPage
);

router.post("/trip/approval/:id", handleApproval);
router.get("/trip/all", authMiddleware, roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), allTrips);

export default router;
