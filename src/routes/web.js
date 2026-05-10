import express from "express";

import {
  showLogin,
  login,
  dashboard,
  logout,
} from "../controllers/authController.js";
import { uploadPhoto } from "../middlewares/uploadPhoto.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import {
  showApplyLeave,
  applyLeave,
  myLeave,
  detailLeave,
  approvalPage,
  approveManager,
  approveHR,
  rejectLeave,
} from "../controllers/leaveController.js";
import {
  showApplyOvertime,
  applyOvertime,
  myOvertime,
  approvalOvertimePage,
  approveManagerOvertime,
  approveHROvertime,
  rejectOvertime,
} from "../controllers/overtimeController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  kpiEmployeeList,
  kpiForm,
  submitKpi,
  kpiManage,
  kpiReport,
} from "../controllers/kpiController.js";
import {
  index,
  checkIn,
  allAttendance,
  detail,
  checkOut,
  history,
} from "../controllers/attendanceController.js";
import {
  formRequest,
  myTrips,
  tripDetail,
  createTrip,
  approveManagerTrip,
  allTrips,
  approveDirector,
} from "../controllers/tripController.js";
import { salesReport } from "../controllers/salesController.js";
const router = express.Router();

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/
router.get("/", showLogin);
router.post("/login", login);
router.get("/logout", logout);

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
*/
router.get("/dashboard", authMiddleware, dashboard);

/*
|--------------------------------------------------------------------------
| LEAVE MODULE
|--------------------------------------------------------------------------
*/
router.get("/leave/apply", authMiddleware, showApplyLeave);

router.post(
  "/leave/apply",
  authMiddleware,
  uploadFile.single("file"),
  applyLeave,
);

router.get("/leave/my", authMiddleware, myLeave);
router.get("/leave/approval", authMiddleware, approvalPage);

router.post("/leave/approval/:id/manager", authMiddleware, approveManager);

router.post("/leave/approval/:id/hr", authMiddleware, approveHR);

router.post("/leave/approval/:id/reject", authMiddleware, rejectLeave);
router.get("/leave/:id", authMiddleware, detailLeave);
// ==========================
// OVERTIME
// ==========================

router.get("/overtime/apply", authMiddleware, showApplyOvertime);

router.post(
  "/overtime/apply",
  authMiddleware,
  uploadFile.single("proofFile"),
  applyOvertime,
);

router.get("/overtime/my", authMiddleware, myOvertime);

router.get("/overtime/approval", authMiddleware, approvalOvertimePage);

router.post(
  "/overtime/approval/:id/manager",
  authMiddleware,
  approveManagerOvertime,
);

router.post("/overtime/approval/:id/hr", authMiddleware, approveHROvertime);

router.post("/overtime/approval/:id/reject", authMiddleware, rejectOvertime);
router.get("/kpi/input", kpiEmployeeList);
router.get("/kpi/input/:employeeId", kpiForm);
router.post("/kpi/input/:employeeId", submitKpi);

router.get("/kpi/manage", kpiManage);
router.get("/kpi/report", kpiReport);
router.get("/attendance", index);
router.get("/attendance/history", history);

router.post("/attendance/checkin", uploadPhoto.single("photo"), checkIn);
router.post("/attendance/checkout", checkOut);
router.get("/attendance/detail/:id", detail);
router.get("/attendance/all", allAttendance);
// form pengajuan dinas luar
router.get("/trip/request", authMiddleware, formRequest);
router.post("/trip/request", authMiddleware, createTrip);

// perjalanan saya (user login)
router.get("/trip/my", authMiddleware, myTrips);

// detail trip

/*
|--------------------------------------------------------------------------
| APPROVAL FLOW (HR / MANAGER / DIRECTOR)
|--------------------------------------------------------------------------
*/
router.get("/trip/all", allTrips);
// approval manager
router.post("/trip/:id/approve/manager", authMiddleware, approveManagerTrip);

// approval director
router.post("/trip/:id/approve/director", authMiddleware, approveDirector);
router.get("/trip/detail/:id", authMiddleware, tripDetail);
/*
|--------------------------------------------------------------------------
| SALES VISIT (PLACEHOLDER - nanti kita isi)
|--------------------------------------------------------------------------
*/

router.get("/sales/report", authMiddleware, salesReport);
export default router;
