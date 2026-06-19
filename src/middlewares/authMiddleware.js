const authMiddleware = (req, res, next) => {
  console.log("AUTH CHECK:", req.session.user);
  if (!req.session.user) {
    console.log("SESSION KOSONG");
    return res.redirect("/");
  }

  if (!req.session.user._id && !req.session.user.id) {
    return res.redirect("/");
  }

  next();
};

export default authMiddleware;
