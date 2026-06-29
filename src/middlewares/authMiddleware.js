const authMiddleware = (req, res, next) => {
  const user = req.session.user;

  if (!user || (!user._id && !user.id)) {
    return res.redirect("/login");
  }

  next();
};

export default authMiddleware;
