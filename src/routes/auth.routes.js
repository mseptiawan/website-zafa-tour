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
import { validate } from "../middlewares/validate.js";

import authMiddleware from "../middlewares/authMiddleware.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from "../validations/auth.schema.js";

const router = express.Router();

router.get("/login", showLogin);
router.post("/login", validate(loginSchema), login);

router.post("/logout", authMiddleware, logout);

router.get("/forgot-password", showForgotPassword);
router.post("/forgot-password", validate(forgotPasswordSchema), requestPasswordReset);

router.get("/reset-password", showResetPasswordPage);
router.post("/reset-password", validate(resetPasswordSchema), handleResetPassword);

router.get("/change-password", authMiddleware, showChangePassword);
router.post("/change-password", authMiddleware, validate(changePasswordSchema), changePassword);

export default router;
