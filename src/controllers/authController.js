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
    console.log("REMEMBER RAW:", remember);
    console.log("BEFORE SESSION:", {
      cookie: req.session.cookie,
      sessionID: req.sessionID,
    });
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
