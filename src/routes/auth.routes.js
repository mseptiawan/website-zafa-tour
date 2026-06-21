import express from "express";
import {
  showLogin,
  login,
  logout,
  showForgotPassword,
  requestPasswordReset,
  showResetPasswordPage,
  handleResetPassword,
  showChangePassword,
  changePassword,
} from "../controllers/auth.controller.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", showLogin);
router.post("/login", login);
router.get("/logout", logout);

router.get("/forgot-password", showForgotPassword);
router.post("/forgot-password", requestPasswordReset);

router.get("/reset-password", showResetPasswordPage);
router.post("/reset-password", handleResetPassword);

router.get("/change-password", authMiddleware, showChangePassword);
router.post("/change-password", authMiddleware, changePassword);

export default router;
