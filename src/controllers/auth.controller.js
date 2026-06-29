import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  verifyAndBuildSession,
  requestResetToken,
  getEmailByToken,
  resetPasswordWithToken,
  updateInternalPassword,
} from "../services/auth.service.js";

// ─── GET: SHOW LOGIN PAGE ────────────────────────────────────────────
export const showLogin = asyncHandler(async (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("auth/login", {
    ...buildRenderData(req, { title: "Login HRIS" }),
  });
});

// ─── POST: PROCESS LOGIN ─────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).render("auth/login", {
      ...buildRenderData(req, {
        title: "Login HRIS",
        errors: req.validationErrors,
        old: req.body,
      }),
    });
  }

  try {
    const { identifier, password, remember } = req.body;
    const sessionUserData = await verifyAndBuildSession(identifier, password);

    req.session.user = sessionUserData;

    if (remember) {
      req.session.cookie.maxAge = 3 * 24 * 60 * 60 * 1000; // 3 Hari
    }

    await new Promise((resolve, reject) => {
      req.session.save((err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    return res.redirect("/dashboard");
  } catch (error) {
    return res.status(error.statusCode || 500).render("auth/login", {
      ...buildRenderData(req, {
        title: "Login HRIS",
        error: [error.message || "Terjadi kesalahan internal pada server."],
        old: req.body,
      }),
    });
  }
});

// ─── POST: PROCESS LOGOUT ────────────────────────────────────────────
export const logout = asyncHandler(async (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Session Destroy Error:", err);
    res.clearCookie("connect.sid");
    return res.redirect("/login");
  });
});

// ─── GET: SHOW FORGOT PASSWORD PAGE ──────────────────────────────────
export const showForgotPassword = asyncHandler(async (req, res) => {
  res.render("auth/forgot-password", {
    ...buildRenderData(req, { title: "Lupa Password" }),
  });
});

// ─── POST: REQUEST PASSWORD RESET (SEND EMAIL) ───────────────────────
export const requestPasswordReset = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).render("auth/forgot-password", {
      ...buildRenderData(req, {
        title: "Lupa Password",
        errors: req.validationErrors,
        old: req.body,
      }),
    });
  }

  try {
    await requestResetToken(req.body.email);
    req.flash("success", "Link pemulihan kata sandi berhasil dikirim ke email Anda.");
    return res.redirect("/forgot-password");
  } catch (error) {
    return res.status(error.statusCode || 500).render("auth/forgot-password", {
      ...buildRenderData(req, {
        title: "Lupa Password",
        error: [error.message],
        old: req.body,
      }),
    });
  }
});

// ─── GET: SHOW RESET PASSWORD PAGE ───────────────────────────────────
export const showResetPasswordPage = asyncHandler(async (req, res) => {
  const { token } = req.query;
  if (!token) {
    req.flash("error", "Akses ditolak. Token tidak ditemukan.");
    return res.redirect("/forgot-password");
  }

  const email = await getEmailByToken(token);
  if (!email) {
    return res.status(400).send("Token tidak valid atau telah kedaluwarsa dari database.");
  }

  res.render("auth/reset-password", {
    ...buildRenderData(req, { title: "Atur Ulang Password", token }),
  });
});

// ─── POST: HANDLE RESET PASSWORD ACTION ──────────────────────────────
export const handleResetPassword = asyncHandler(async (req, res) => {
  const token = req.body.token || req.query.token;

  if (req.validationErrors) {
    return res.status(400).render("auth/reset-password", {
      ...buildRenderData(req, {
        title: "Atur Ulang Password",
        errors: req.validationErrors,
        token,
      }),
    });
  }

  try {
    await resetPasswordWithToken(token, req.body.password);
    req.flash("success", "Password Anda berhasil diperbarui. Silakan login.");
    return res.redirect("/login");
  } catch (error) {
    return res.status(error.statusCode || 500).render("auth/reset-password", {
      ...buildRenderData(req, {
        title: "Atur Ulang Password",
        error: [error.message],
        token,
      }),
    });
  }
});

// ─── GET: SHOW INTERNAL CHANGE PASSWORD PAGE ─────────────────────────
export const showChangePassword = asyncHandler(async (req, res) => {
  res.render("auth/change-password", {
    ...buildRenderData(req, { title: "Ubah Password", user: req.session.user }),
  });
});

// ─── POST: HANDLE INTERNAL CHANGE PASSWORD ───────────────────────────
export const changePassword = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    return res.status(400).render("auth/change-password", {
      ...buildRenderData(req, {
        title: "Ubah Password",
        errors: req.validationErrors,
        user: req.session.user,
      }),
    });
  }

  try {
    const userId = req.session.user._id;
    const { currentPassword, password } = req.body;

    await updateInternalPassword(userId, currentPassword, password);
    req.flash("success", "Kata sandi Anda berhasil diubah!");
    return res.redirect("/change-password");
  } catch (error) {
    return res.status(error.statusCode || 500).render("auth/change-password", {
      ...buildRenderData(req, {
        title: "Ubah Password",
        error: [error.message],
        user: req.session.user,
      }),
    });
  }
});
