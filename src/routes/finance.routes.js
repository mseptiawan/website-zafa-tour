import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  financeTripPage,
  financeTripDetail,
  paymentHistoryPage,
  paymentHistoryDetail,
  processPayment,
  uploadPaymentProof,
  confirmPayment,
} from "../controllers/finance.controller.js";

const router = express.Router();

/**
 * FINANCE MODULE
 */

// list finance trips
router.get("/", roleMiddleware("KEUANGAN"), financeTripPage);
router.get("/history", roleMiddleware("KEUANGAN"), paymentHistoryPage);

router.get("/history/:id", roleMiddleware("KEUANGAN"), paymentHistoryDetail);

// detail finance trip
router.get("/:id", roleMiddleware("KEUANGAN"), financeTripDetail);

// process payment
router.post("/:id/process", roleMiddleware("KEUANGAN"), processPayment);

// upload proof
router.post(
  "/:id/upload-proof",
  roleMiddleware("KEUANGAN"),
  uploadFile.single("proof"),
  uploadPaymentProof
);

// confirm payment
router.post("/:id/confirm", roleMiddleware("KEUANGAN"), confirmPayment);

export default router;
