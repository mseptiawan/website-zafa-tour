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
  "/approval/:id/approve",
  roleMiddleware(["HR", "PIMPINAN", "KEUANGAN"]),
  uploadFile.single("paymentProof"),
  approveLoan
);

router.post("/approval/:id/reject", roleMiddleware(["HR", "PIMPINAN", "KEUANGAN"]), rejectLoan);

export default router;
