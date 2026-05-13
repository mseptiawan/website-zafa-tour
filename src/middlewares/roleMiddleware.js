const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/");
    }

    let userRole = req.session.user.role;

    userRole = String(userRole || "")
      .trim()
      .toUpperCase();

    const allowedRoles = roles
      .flat()
      .filter(Boolean)
      .map((r) => String(r).trim().toUpperCase());

    console.log("USER ROLE:", userRole);
    console.log("ALLOWED:", allowedRoles);

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).send("Access denied");
    }

    next();
  };
};

export default roleMiddleware;
