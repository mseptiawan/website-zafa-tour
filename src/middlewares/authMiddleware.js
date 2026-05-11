const authMiddleware = (req, res, next) => {
  console.log("=== AUTH DEBUG ===");
  console.log("Session user:", req.session.user);
  console.log("==================");

  if (!req.session.user) {
    return res.redirect("/");
  }

  // validasi minimal field penting
  if (!req.session.user._id && !req.session.user.id) {
    console.log("ERROR: user session tidak punya id/_id");
    return res.redirect("/");
  }

  next();
};

export default authMiddleware;
