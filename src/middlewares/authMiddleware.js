const authMiddleware = (req, res, next) => {
  console.log("SESSION USER:", req.session.user);
  console.log("ROLE:", req.session.user?.role);
  if (!req.session.user) {
    return res.redirect("/");
  }

  next();
};

export default authMiddleware;
