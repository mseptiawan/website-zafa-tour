import bcrypt from "bcrypt";
import User from "../models/User.js";
const showLogin = (req, res) => {
  res.render("auth/login");
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).populate("roleId");

  if (!user) {
    return res.send("User tidak ditemukan");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    return res.send("Password salah");
  }

  // 🔥 SIMPAN SESSION (INI YANG KAMU MAU)
  req.session.user = {
    id: user._id,
    email: user.email,
    username: user.fullName, // 👈 ini username
    role: user.roleId.name, // optional tapi penting
  };

  return req.session.save(() => {
    res.redirect("/dashboard");
  });
};
const dashboard = (req, res) => {
  res.render("dashboard/index", {
    user: req.session.user,
    title: "Dashboard",
  });
};
const logout = (req, res) => {
  req.session.destroy();

  res.redirect("/");
};

export { showLogin, login, dashboard, logout };
