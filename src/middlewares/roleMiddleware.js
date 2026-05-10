const roleMiddleware = (...roles) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.redirect("/");
    }

    let userRole = req.session.user.role;

    // amanin userRole
    userRole = String(userRole || "")
      .trim()
      .toUpperCase();

    const allowedRoles = roles
      .flat() // kalau ada array nested
      .filter(Boolean) // buang null/undefined
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
