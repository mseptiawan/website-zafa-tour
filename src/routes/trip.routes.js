import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  formRequest,
  createTrip,
  myTrips,
  approvalPage,
  editTripForm,
  updateTrip,
  showEditTrip,
  reportTripPage,
  resubmitUpdateTrip,
  handleApproval,
  delegateTripToHR,
  financeTripPage,
  confirmPayment,
  paymentHistoryPage,
} from "../controllers/trip.controller.js";

const router = express.Router();

router.use(authMiddleware);

/* REQUEST */
router.get("/new", newForm);
router.post("/", create);

/* USER */
router.get("/my", myTrips);

/* APPROVAL */
router.get("/approval", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), approvalPage);

router.post("/:id/approval", handleApproval);

/* EDIT */
router.get("/:id/edit", editTripForm);
router.post("/:id/edit", updateTrip);
// router.get("/:id/edit", showEditTrip);
router.post("/:id/update", resubmitUpdateTrip);

/* REPORT */
router.get("/report", reportTripPage);

/* DELEGATION */
router.post("/:id/delegate", delegateTripToHR);

/* FINANCE */
router.get("/finance/trips", roleMiddleware("KEUANGAN"), financeTripPage);
router.post("/finance/trips/:id/pay", roleMiddleware("KEUANGAN"), confirmPayment);

router.get(
  "/finance/payment-history",
  roleMiddleware(["MANAGER", "HR", "PIMPINAN", "KEUANGAN"]),
  paymentHistoryPage
);

export default router;
