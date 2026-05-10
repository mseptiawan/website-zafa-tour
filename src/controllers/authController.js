import bcrypt from "bcrypt";
import User from "../models/User.js";

/* ======================
   SHOW LOGIN PAGE
====================== */
export const showLogin = (req, res) => {
  res.render("auth/login");
};

/* ======================
   LOGIN
====================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("roleId");

    if (!user) {
      return res.send("User tidak ditemukan");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send("Password salah");
    }

    // 🔥 RESET SESSION BIAR TIDAK KETUKER USER
    req.session.regenerate((err) => {
      if (err) return res.send("Session error");

      req.session.user = {
        _id: user._id,
        email: user.email,
        username: user.email,
        role: user.roleId?.name,
      };

      req.session.save(() => {
        return res.redirect("/dashboard");
      });
    });
  } catch (err) {
    console.log(err);
    res.send("Terjadi kesalahan");
  }
};

/* ======================
   DASHBOARD
====================== */
export const dashboard = (req, res) => {
  res.render("dashboard/index", {
    user: req.session.user,
    title: "Dashboard",
  });
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
