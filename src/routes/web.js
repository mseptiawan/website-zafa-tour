import express from "express";

import {
  showLogin,
  login,
  dashboard,
  logout,
} from "../controllers/authController.js";

import {
  showApplyLeave,
  applyLeave,
  myLeave,
  detailLeave,
} from "../controllers/leaveController.js";

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

router.post("/leave/apply", authMiddleware, applyLeave);

router.get("/leave/my", authMiddleware, myLeave);

router.get("/leave/:id", authMiddleware, detailLeave);

export default router;
