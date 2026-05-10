const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    // belum login
    if (!req.session.user) {
      return res.redirect("/");
    }

    const userRole = req.session.user.role;

    // role tidak diizinkan
    if (!roles.includes(userRole)) {
      return res.status(403).send("Access denied");
    }

    next();
  };
};

export default roleMiddleware;
