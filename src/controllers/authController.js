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
  res.render("auth/login", {
    query: req.query || {},
  });
};

/* ======================
   LOGIN
====================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("roleId");

    if (!user) {
      return res.redirect("/?error=USER_NOT_FOUND");
    }

    // 🔥 ambil employee
    const employee = await Employee.findOne({
      userId: user._id,
    });

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.redirect("/?error=INVALID_PASSWORD");
    }

    req.session.regenerate((err) => {
      if (err) {
        return res.redirect("/?error=SESSION_ERROR");
      }

      req.session.user = {
        _id: user._id,

        email: user.email,

        fullName: employee?.fullName || user.email,

        employeeCode: employee?.employeeCode || "-",

        role: user.roleId?.name?.toUpperCase() || "UNKNOWN",
      };

      req.session.save(() => {
        return res.redirect("/dashboard");
      });
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
