import { redisClient } from "../config/redis.js";
import { mailer } from "../utils/email.js";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import BusinessTrip from "../models/BusinessTrip.js";
import Announcement from "../models/Announcement.js";
/* ======================
   SHOW LOGIN PAGE
====================== */
export const showLogin = (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  res.render("auth/login", {
    query: req.query || {},
  });
};

/* ======================
   LOGIN
====================== */
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

    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      fullName: employee?.fullName || user.username,
      employeeId: employee?._id || null,
      role: user.roleId?.name?.toUpperCase() || "UNKNOWN",
    };

    if (remember) {
      req.session.cookie.maxAge = 3 * 24 * 60 * 60 * 1000;
    }

    req.session.save(() => {
      return res.redirect("/dashboard");
    });
  } catch (err) {
    console.log(err);
    return res.redirect("/?error=SERVER_ERROR");
  }
};

/* ======================
   DASHBOARD
====================== */

export const dashboard = async (req, res) => {
  try {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    // =========================
    // SUMMARY
    // =========================
    const totalEmployee = await Employee.countDocuments();

    const hadir = await Attendance.countDocuments({
      checkIn: { $gte: today },

      status: {
        $in: ["HADIR", "TELAT"],
      },
    });

    const cuti = await Leave.countDocuments({
      status: "APPROVED",
    });

    const trip = await BusinessTrip.countDocuments({
      status: {
        $in: ["PENDING", "APPROVED_MANAGER", "APPROVED_DIRECTOR"],
      },
    });

    // =========================
    // ATTENDANCE TODAY
    // =========================
    const todayAttendance = await Attendance.find({
      checkIn: { $gte: today },
    })
      .populate("userId")
      .sort({
        checkIn: -1,
      });

    // 🔥 inject employee
    for (const attendance of todayAttendance) {
      const employee = await Employee.findOne({
        userId: attendance.userId?._id,
      });

      attendance.employee = employee;
    }

    // =========================
    // ANNOUNCEMENT
    // =========================
    const announcements = await Announcement.find({
      status: "PUBLISHED",
    })
      .populate("createdBy")
      .sort({
        isPinned: -1,
        createdAt: -1,
      })
      .limit(5);

    // =========================
    // RENDER
    // =========================
    res.render("dashboard/index", {
      title: "Dashboard",

      user: req.session.user,

      totalEmployee,
      hadir,
      cuti,
      trip,

      todayAttendance,

      announcements,
    });
  } catch (err) {
    console.log(err);

    res.status(500).send("Dashboard error");
  }
};
/* ======================
   LOGOUT (FIXED)
====================== */
export const logout = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.redirect("/");
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

    // 1. validasi session dari OTP
    const email = req.session.resetEmail;

    if (!email) {
      return res.redirect("/forgot-password");
    }

    // 2. validasi password
    if (!password || password.length < 6) {
      return res.redirect("/reset-password?error=WEAK_PASSWORD");
    }

    // 3. confirm password check
    if (password !== confirmPassword) {
      return res.redirect("/reset-password?error=PASSWORD_MISMATCH");
    }

    // 4. cari user
    const user = await User.findOne({ email });

    if (!user) {
      return res.redirect("/forgot-password?error=EMAIL_NOT_FOUND");
    }

    // 5. hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6. update password
    await User.updateOne({ email }, { $set: { password: hashedPassword } });

    // 7. cleanup session
    req.session.resetEmail = null;

    return res.redirect("/?success=PASSWORD_CHANGED");
  } catch (err) {
    console.log(err);
    return res.redirect("/reset-password?error=SERVER_ERROR");
  }
};

export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    // =========================
    // DEBUG INPUT
    // =========================
    console.log("=== REQUEST OTP START ===");
    console.log("EMAIL INPUT:", email);

    if (!email) {
      console.log("EMAIL EMPTY");
      return res.redirect("/forgot-password?error=INVALID_EMAIL");
    }

    // normalize email biar tidak case-sensitive issue
    const cleanEmail = email.toLowerCase().trim();
    console.log("CLEAN EMAIL:", cleanEmail);

    // =========================
    // CHECK USER
    // =========================
    const user = await User.findOne({ email: cleanEmail });

    console.log("USER FOUND:", user ? "YES" : "NO");

    if (!user) {
      return res.redirect("/forgot-password?error=EMAIL_NOT_FOUND");
    }

    // =========================
    // GENERATE OTP
    // =========================
    const otp = Math.floor(100000 + Math.random() * 900000);

    console.log("OTP GENERATED:", otp);

    // =========================
    // CHECK REDIS STATUS
    // =========================
    console.log("REDIS OPEN:", redisClient.isOpen);

    // =========================
    // SEND EMAIL FIRST (lebih aman)
    // =========================
    console.log("SENDING EMAIL TO:", cleanEmail);

    await mailer.sendMail({
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: "OTP Reset Password",
      text: `Kode OTP kamu adalah: ${otp}. Berlaku 5 menit.`,
    });

    console.log("EMAIL SENT SUCCESS");

    // =========================
    // STORE OTP IN REDIS
    // =========================
    await redisClient.setEx(`otp:${cleanEmail}`, 300, otp.toString());

    console.log("OTP SAVED TO REDIS");

    console.log("=== REQUEST OTP SUCCESS ===");

    return res.redirect(`/verify-otp?email=${cleanEmail}`);
  } catch (err) {
    console.error("=== REQUEST OTP ERROR ===");
    console.error(err);

    return res.redirect("/forgot-password?error=SERVER_ERROR");
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email) {
      return res.redirect("/forgot-password");
    }

    const storedOtp = await redisClient.get(`otp:${email}`);

    if (!storedOtp) {
      return res.redirect(`/verify-otp?email=${email}&error=OTP_EXPIRED`);
    }

    if (storedOtp !== otp) {
      return res.redirect(`/verify-otp?email=${email}&error=INVALID_OTP`);
    }

    await redisClient.del(`otp:${email}`);

    req.session.resetEmail = email;

    return res.redirect("/reset-password");
  } catch (err) {
    console.log(err);
    return res.redirect("/verify-otp?error=SERVER_ERROR");
  }
};
