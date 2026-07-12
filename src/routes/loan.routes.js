import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  renderCreateForm,
  storeLoan,
  getMyLoans,
  cancelLoan,
  editLoan,
  updateLoan,
  getManageLoanPage,
  getDetailLoan,
  approveLoan,
  rejectLoan,
  getFinanceCenterPageLoan,
  disburseLoan,
} from "../controllers/loan.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", renderCreateForm);
router.post("/", storeLoan);
router.get("/me", getMyLoans);
router.get("/detail/:id", getDetailLoan);
router.get("/edit/:id", editLoan);
router.post("/update/:id", updateLoan);
router.post("/cancel/:id", cancelLoan);

router.get("/approval", roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"), getManageLoanPage);
router.post(
  "/approval/approve/:id",
  roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"),
  approveLoan
);
router.post("/approval/reject/:id", roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"), rejectLoan);

router.get("/disbursement", roleMiddleware("MANAGER_KEUANGAN"), getFinanceCenterPageLoan);
router.post(
  "/approval/disburse/:id",
  roleMiddleware("MANAGER_KEUANGAN"),
  uploadFile.single("paymentProof"),
  disburseLoan
);

export default router;
