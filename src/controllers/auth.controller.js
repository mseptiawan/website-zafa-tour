import { redisClient } from "../config/redis.js";
import transporter from "../config/mailer.js";
import bcrypt from "bcrypt";
import { sendEmail } from "../services/email.service.js";
import User from "../models/basic/User.model.js";
import crypto from "crypto";
import { getPermissions } from "../services/permission.service.js";
import Attendance from "../models/Attendance.model.js";
import Employee from "../models/employee/Employee.model.js";
import BusinessTrip from "../models/BusinessTrip.model.js";
import Announcement from "../models/Announcement.model.js";
export const showLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.render("auth/login", {
    query: req.query || {},
  });
};
export const login = async (req, res) => {
  try {
    const { identifier, password, remember } = req.body;
    const user = await User.findOne({
      $or: [{ username: identifier }, { email: identifier }],
    }).populate("roleId");

    if (!user) {
      return res.redirect("/?error=USER_NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.redirect("/?error=INVALID_PASSWORD");
    }

    const employee = await Employee.findOne({ userId: user._id }).populate({
      path: "careerData",
      populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
    });

    const roleName = user.roleId?.name?.toUpperCase();

    const managerRoles = [
      "MANAGER_KEUANGAN",
      "MANAGER_ADMINISTRASI",
      "MANAGER_HAJI_UMRAH",
      "WAKIL_DIREKTUR",
    ];
    const isManager = managerRoles.includes(roleName);

    const career = employee?.careerData || null;

    const careerId = career?._id || null;
    const bidangId = career?.bidangId?._id || null;
    const bidangName = career?.bidangId?.name || null;
    const unitId = career?.unitId?._id || null;
    const unitName = career?.unitId?.name || null;
    const positionId = career?.positionId?._id || null;
    const positionName = career?.positionId?.name || null;
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,

      employeeId: employee?._id,
      employeeNumber: employee?.employeeIdNumber,

      fullName: employee?.fullName,
      foto_profile: employee?.foto_profile,
      gender: employee?.jenis_kelamin,

      role: roleName,
      roleId: user.roleId?._id,
      permissions: getPermissions(roleName),

      isManager,

      bidangId,
      bidangName,

      unitId,
      unitName,

      careerId,

      positionId,
      positionName,
    };

    if (remember) {
      req.session.cookie.maxAge = 3 * 24 * 60 * 60 * 1000;
    }

    req.session.save(() => {
      res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
      console.log("LOGIN SUCCESS -> /dashboard");
      return res.redirect("/dashboard");
    });
  } catch (err) {
    console.error(err);
    return res.redirect("/?error=SERVER_ERROR");
  }
};
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error(err);
    res.clearCookie("connect.sid");
    return res.redirect("/");
  });
};
export const showForgotPassword = (req, res) => {
  res.render("auth/forgot-password", {
    query: req.query || {},
  });
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    const email = req.session.resetEmail;

    if (!email) {
      return res.redirect("/forgot-password");
    }

    if (!password || password.length < 6) {
      return res.redirect("/reset-password?error=WEAK_PASSWORD");
    }

    if (password !== confirmPassword) {
      return res.redirect("/reset-password?error=PASSWORD_MISMATCH");
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/forgot-password?error=EMAIL_NOT_FOUND");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    req.session.resetEmail = null;

    return res.redirect("/?success=PASSWORD_CHANGED");
  } catch (err) {
    console.log(err);
    return res.redirect("/reset-password?error=SERVER_ERROR");
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/forgot-password?error=EMAIL_NOT_FOUND");
    }

    const token = crypto.randomBytes(32).toString("hex");
    await redisClient.setEx(`reset:${token}`, 900, user.email);

    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset Password Akun HRIS",
      html: `
        <h2>Reset Password</h2>
        <p>Klik tombol di bawah ini untuk mengatur ulang password Anda:</p>
        <a href="${resetLink}" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Link ini akan kedaluwarsa dalam 15 menit.</p>
      `,
    });

    return res.redirect("/forgot-password?success=EMAIL_SENT");
  } catch (err) {
    console.error(err);
    return res.redirect("/forgot-password?error=SERVER_ERROR");
  }
};
export const showResetPasswordPage = async (req, res) => {
  const { token } = req.query;

  if (!token) return res.redirect("/forgot-password");

  const redisKey = `reset:${token}`;
  const email = await redisClient.get(redisKey);

  console.log("Mencari token di Redis dengan key:", redisKey);
  console.log("Hasil ditemukan:", email);

  if (!email) {
    return res.send(`Token tidak ditemukan di database. Token: ${token}`);
  }

  res.render("auth/reset-password", { token, query: req.query || {} });
};

export const handleResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
      return res.redirect("/forgot-password");
    }

    if (password !== confirmPassword) {
      return res.redirect(`/reset-password?token=${token}&error=PASSWORD_MISMATCH`);
    }

    const email = await redisClient.get(`reset:${token}`);

    if (!email) {
      return res.redirect("/forgot-password?error=TOKEN_EXPIRED");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    await redisClient.del(`reset:${token}`);

    return res.redirect("/?success=PASSWORD_CHANGED");
  } catch (err) {
    console.log(err);
    return res.redirect("/reset-password?error=SERVER_ERROR");
  }
};

// ==========================================
// SHOW CHANGE PASSWORD PAGE (RENDER VIEW)
// ==========================================
export const showChangePassword = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/");
    }

    res.render("auth/change-password", {
      user: req.session.user,
      query: req.query || {},
    });
  } catch (err) {
    console.error("Error showing change password page:", err);
    return res.redirect("/dashboard?error=SERVER_ERROR");
  }
};

// ==========================================
// HANDLE CHANGE PASSWORD (POST ACTION)
// ==========================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, password, confirmPassword } = req.body;
    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect("/");
    }

    if (!password || password.length < 6) {
      return res.redirect("/change-password?error=WEAK_PASSWORD");
    }

    if (password !== confirmPassword) {
      return res.redirect("/change-password?error=PASSWORD_MISMATCH");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/?error=USER_NOT_FOUND");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.redirect("/change-password?error=WRONG_CURRENT_PASSWORD");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.updateOne({ _id: userId }, { $set: { password: hashedPassword } });

    return res.redirect("/change-password?success=PASSWORD_CHANGED");
  } catch (err) {
    console.error("Error handling change password:", err);
    return res.redirect("/change-password?error=SERVER_ERROR");
  }
};
