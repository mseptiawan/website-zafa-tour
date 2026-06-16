import { redisClient } from "../config/redis.js";
import transporter from "../config/mailer.js";
import bcrypt from "bcrypt";
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

    const employee = await Employee.findOne({
      userId: user._id,
    });

    const roleName = user.roleId?.name?.toUpperCase();
    console.log("ROLE:", roleName);
    console.log("PERMISSIONS:", getPermissions(roleName));
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: employee?.fullName || user.username,
      foto_profile: employee?.foto_profile || null,
      employeeId: employee?._id || null,
      gender: employee?.jenis_kelamin || "Laki-Laki",
      role: roleName,
      roleId: user.roleId?._id || null,
      permissions: getPermissions(roleName),
    };

    console.log("SESSION USER:", req.session.user);
    if (remember) {
      req.session.cookie.maxAge = 3 * 24 * 60 * 60 * 1000;
    }

    req.session.save(() => {
      res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
      return res.redirect("/dashboard");
    });
  } catch (err) {
    console.log(err);
    console.log("LOGIN SUCCESS -> /dashboard");
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

    const resetLink = `http://localhost:3000/reset-password?token=${token}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Password",
      text: `Klik link ini untuk reset password: ${resetLink}`,
    });

    return res.redirect("/forgot-password?success=EMAIL_SENT");
  } catch (err) {
    console.log(err);
    return res.redirect("/forgot-password?error=SERVER_ERROR");
  }
};
export const showResetPasswordPage = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.redirect("/forgot-password");
  }

  const email = await redisClient.get(`reset:${token}`);

  if (!email) {
    return res.send("Token expired atau tidak valid");
  }

  res.render("auth/reset-password", {
    token,
    query: req.query || {},
  });
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
