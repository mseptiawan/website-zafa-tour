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

router.get("/:id", roleMiddleware("MANAGER_KEUANGAN"), financeTripDetail);

router.post("/:id/process", roleMiddleware("MANAGER_KEUANGAN"), processPayment);

router.post(
  "/:id/upload-proof",
  roleMiddleware("MANAGER_KEUANGAN"),
  uploadFile.single("proof"),
  uploadPaymentProof
);

router.post("/:id/confirm", roleMiddleware("MANAGER_KEUANGAN"), confirmPayment);

export default router;
