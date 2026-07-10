const injectUser = (req, res, next) => {
  req.user = req.session.user || null;
  res.locals.req = req;
  next();
};

export default injectUser;
