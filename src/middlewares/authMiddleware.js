const authMiddleware = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/");
  }

  if (!req.session.user._id && !req.session.user.id) {
    return res.redirect("/");
  }

  next();
};

export default authMiddleware;
