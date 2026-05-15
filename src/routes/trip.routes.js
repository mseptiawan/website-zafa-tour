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

router.get("/:id/edit", showEditForm);
router.post("/:id", update);

router.post("/:id/delegate", delegateToHR);

router.get("/report", reportPage);

router.get("/finance", roleMiddleware(["KEUANGAN"]), financePage);
router.post("/finance/:id/pay", roleMiddleware(["KEUANGAN"]), confirmPayment);

router.get(
  "/finance/history",
  roleMiddleware(["MANAGER", "HR", "PIMPINAN", "KEUANGAN"]),
  paymentHistoryPage
);

export default router;
