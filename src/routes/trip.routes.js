import { uploadFile } from "../middlewares/uploadFile.js";
import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";

import {
  show,
  approvalDetailPage,
  newForm,
  startTrip,
  submitTripReport,
  showEditForm,
  update,
  resubmit,
  myTrips,
  approvalPage,
  handleApproval,
  reportTripPage,
  delegateTripToHR,
  create,
} from "../controllers/trip.controller.js";

const router = express.Router();
router.use((req, res, next) => {
  console.log(`\n============== [DEBUG ROUTE] ==============`);
  console.log(`👉 METHOD      : ${req.method}`);
  console.log(`👉 ACTUAL URL  : ${req.originalUrl}`);
  console.log(`👉 ROUTE PATH  : ${req.url}`);
  console.log(`===========================================\n`);
  next();
});
// 1. Global Middleware
router.use(authMiddleware);

// 2. Route Statis (Tanpa Parameter ID)
router.get("/new", newForm);
router.post("/", create);
router.get("/my", myTrips);
router.get(
  "/approval",
  roleMiddleware([
    "WAKIL_DIREKTUR",
    "MANAGER_ADMINISTRASI",
    "MANAGER_KEUANGAN",
    "MANAGER_HAJI_UMRAH",
    "DIREKTUR_UTAMA",
  ]),
  approvalPage
);

// 3. Route Approval dengan ID
router.get(
  "/approval/:id",
  roleMiddleware([
    "WAKIL_DIREKTUR",
    "MANAGER_ADMINISTRASI",
    "MANAGER_KEUANGAN",
    "MANAGER_HAJI_UMRAH",
    "DIREKTUR_UTAMA",
  ]),
  approvalDetailPage
);
router.post("/approval/:id", handleApproval);

// 4. Route Fitur & Operasional Trip (:id/...)
router.get("/:id/edit", showEditForm);
router.put("/:id", update);
router.post("/:id/resubmit", resubmit);
router.post("/:id/start", startTrip);
router.get("/:id/report", reportTripPage);
router.post("/:id/report", uploadFile.single("attachments"), submitTripReport);
router.post("/:id/delegate", delegateTripToHR);

// 5. Route Master / Detail
router.get("/:id", show);

export default router;
