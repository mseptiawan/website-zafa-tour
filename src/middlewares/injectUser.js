const injectUser = (req, res, next) => {
  req.user = req.session.user || null;
  next();
};

export default injectUser;
