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
router.get("/", roleMiddleware("MANAGER_KEUANGAN"), financeTripPage);
router.get(
  "/history",
  roleMiddleware("MANAGER_KEUANGAN", "WAKIL_DIREKTUR", "MANAGER_ADMINISTRASI", "DIREKTUR_UTAMA"),
  paymentHistoryPage
);

router.get(
  "/history/:id",
  roleMiddleware("MANAGER_KEUANGAN", "WAKIL_DIREKTUR", "MANAGER_ADMINISTRASI", "DIREKTUR_UTAMA"),
  paymentHistoryDetail
);

// detail finance trip
router.get("/:id", roleMiddleware("MANAGER_KEUANGAN"), financeTripDetail);

// process payment
router.post("/:id/process", roleMiddleware("MANAGER_KEUANGAN"), processPayment);

// upload proof
router.post(
  "/:id/upload-proof",
  roleMiddleware("MANAGER_KEUANGAN"),
  uploadFile.single("proof"),
  uploadPaymentProof
);

// confirm payment
router.post("/:id/confirm", roleMiddleware("MANAGER_KEUANGAN"), confirmPayment);

export default router;
