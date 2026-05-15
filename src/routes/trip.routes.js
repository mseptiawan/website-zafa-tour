import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  newForm,
  myTrips,
  editTripForm,
  updateTrip,
  approvalPage,
  handleApproval,
  reportTripPage,
  delegateTripToHR,
  financeTripPage,
  confirmPayment,
  paymentHistoryPage,
  create,
} from "../controllers/trip.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", newForm);
router.post("/", create);

router.get("/my", myTrips);

/* EDIT (single entry point) */
router.get("/trip/:id/edit", editTripForm);
router.post("/trip/:id/edit", updateTrip);

/* APPROVAL */
router.get("/trip/approval", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), approvalPage);
router.post("/trip/approval/:id", handleApproval);

/* DELEGATION */
router.post("/trip/:id/delegate", delegateTripToHR);

/* REPORT */
router.get("/trip/report", reportTripPage);

/* FINANCE */
router.get("/finance/trips", roleMiddleware("KEUANGAN"), financeTripPage);
router.post("/finance/trips/:id/pay", roleMiddleware("KEUANGAN"), confirmPayment);

router.get(
  "/finance/payment-history",
  roleMiddleware(["MANAGER", "HR", "PIMPINAN", "KEUANGAN"]),
  paymentHistoryPage
);

export default router;
