import bcrypt from "bcrypt";
import User from "../models/User.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import Leave from "../models/Leave.js";
import BusinessTrip from "../models/BusinessTrip.js";
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

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.redirect("/?error=INVALID_PASSWORD");
    }

    req.session.regenerate((err) => {
      if (err) return res.redirect("/?error=SESSION_ERROR");

      req.session.user = {
        _id: user._id,
        email: user.email,
        username: user.email,
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

    // 🔥 TOTAL KARYAWAN
    const totalEmployee = await Employee.countDocuments();

    // 🔥 HADIR HARI INI
    const hadir = await Attendance.countDocuments({
      checkIn: { $gte: today },
      status: { $in: ["HADIR", "TELAT"] },
    });

    // 🔥 CUTI PENDING/APPROVED
    const cuti = await Leave.countDocuments({
      status: "APPROVED",
    });

    // 🔥 DINAS LUAR PENDING/APPROVED
    const trip = await BusinessTrip.countDocuments({
      status: { $in: ["PENDING", "APPROVED_MANAGER", "APPROVED_DIRECTOR"] },
    });

    // 🔥 ABSEN HARI INI DETAIL (opsional)
    const todayAttendance = await Attendance.find({
      checkIn: { $gte: today },
    }).populate("userId");

    res.render("dashboard/index", {
      user: req.session.user,
      title: "Dashboard",
      totalEmployee,
      hadir,
      cuti,
      trip,
      todayAttendance,
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
