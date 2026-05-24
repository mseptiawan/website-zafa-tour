import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  newForm,
  create,
  myLoans,
  cancel,
  edit,
  update,
  getManageLoanPage,
  getDetail,
  approveLoan,
  rejectLoan,
  getFinanceCenterPage,
  disburseLoan
} from "../controllers/loan.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", newForm);
router.post("/", create);

router.get("/my", myLoans);
router.get("/detail/:id", getDetail);
router.get("/edit/:id", edit);
router.post("/update/:id", update);
router.post("/cancel/:id", cancel);
router.get("/manage-center", roleMiddleware(["HR", "PIMPINAN", "KEUANGAN"]), getManageLoanPage);

router.post(
  "/approval/approve/:id",
  roleMiddleware(["HR", "PIMPINAN"]),
  approveLoan
);

router.post("/approval/:id/reject", roleMiddleware(["HR", "PIMPINAN", "KEUANGAN"]), rejectLoan);


router.get("/finance-center", roleMiddleware(["KEUANGAN"]), getFinanceCenterPage);

router.post(
  "/approval/disburse/:id",
  roleMiddleware(["KEUANGAN"]),
  uploadFile.single("paymentProof"),
  disburseLoan
);


export default router;
