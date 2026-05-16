import { uploadFile } from "../middlewares/uploadFile.js";

import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  show,
  approvalDetailPage,
  newForm,
  startTrip,
  submitTripReport,
  showEditForm,
  update,
  resubmit,
  myTrips,
  approvalPage,
  handleApproval,
  reportTripPage,
  delegateTripToHR,
  create,
} from "../controllers/trip.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", newForm);
router.post("/", create);

router.get("/my", myTrips);

router.get("/:id/edit", showEditForm);

router.put("/:id", update);

router.post("/:id/resubmit", resubmit);
router.post("/:id/start", authMiddleware, startTrip);
router.get("/:id/report", authMiddleware, reportTripPage);
router.post("/:id/report", authMiddleware, uploadFile.single("attachments"), submitTripReport);
router.get("/approval", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), approvalPage);

router.get("/approval/:id", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), approvalDetailPage);

router.post("/approval/:id", handleApproval);

router.post("/:id/delegate", delegateTripToHR);

router.get("/report", reportTripPage);

router.get("/:id", show);

export default router;
