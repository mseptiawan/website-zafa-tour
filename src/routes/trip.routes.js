import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  newForm,
  create,
  myTrips,
  approvalPage,
  showEditForm,
  update,
  handleApproval,
  show,
  resubmitForm,
  delegateToHR,
  reportPage,
  financePage,
  confirmPayment,
  paymentHistoryPage,
} from "../controllers/trip.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", newForm);
router.post("/", create);

router.get("/my", myTrips);

router.get("/approval", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), approvalPage);
router.post("/:id/approval", handleApproval);

router.get("/report", reportPage);

router.get("/finance", roleMiddleware(["KEUANGAN"]), financePage);
router.post("/finance/:id/pay", roleMiddleware(["KEUANGAN"]), confirmPayment);

router.get(
  "/finance/history",
  roleMiddleware(["MANAGER", "HR", "PIMPINAN", "KEUANGAN"]),
  paymentHistoryPage
);

router.get("/:id/edit", showEditForm);

router.get("/:id/edit", resubmitForm);

router.get("/:id", show);

router.post("/:id", update);

router.post("/:id/delegate", delegateToHR);

export default router;
