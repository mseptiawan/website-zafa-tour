import express from "express";

import {
  showLogin,
  login,
  dashboard,
  logout,
} from "../controllers/authController.js";
import upload from "../middlewares/uploadMiddleware.js";
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

router.post("/leave/apply", authMiddleware, upload.single("file"), applyLeave);

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

router.post("/overtime/apply", authMiddleware, applyOvertime);

router.get("/overtime/my", authMiddleware, myOvertime);

router.get("/overtime/approval", authMiddleware, approvalOvertimePage);

router.post(
  "/overtime/approval/:id/manager",
  authMiddleware,
  approveManagerOvertime,
);

router.post("/overtime/approval/:id/hr", authMiddleware, approveHROvertime);

router.post("/overtime/approval/:id/reject", authMiddleware, rejectOvertime);
export default router;
