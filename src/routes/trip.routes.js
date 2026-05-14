import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  formRequest,
  myTrips,
  reportTripPage,
  delegateTripToHR,
  editTripForm,
  createTrip,
  showEditTrip,
  paymentHistoryPage,
  resubmitUpdateTrip,
  approvalPage,
  updateTrip,
  handleApproval,
  financeTripPage,
  confirmPayment,
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
router.get("/trip/edit/:id", authMiddleware, editTripForm);
router.post("/trip/edit/:id", authMiddleware, updateTrip);
router.get("/trip/:id/edit", authMiddleware, showEditTrip);
router.get("/trip/report", authMiddleware, reportTripPage);
router.post("/trip/:id/update", authMiddleware, resubmitUpdateTrip);
router.post("/trip/approval/:id", authMiddleware, handleApproval);
router.post("/trip/:id/delegate", authMiddleware, delegateTripToHR);
router.get("/finance/trips", roleMiddleware("KEUANGAN"), financeTripPage);

router.post("/finance/trips/:id/pay", roleMiddleware("KEUANGAN"), confirmPayment);
router.get(
  "/finance/payment-history",
  roleMiddleware(["MANAGER", "HR", "PIMPINAN", "KEUANGAN"]),
  paymentHistoryPage
);
export default router;
