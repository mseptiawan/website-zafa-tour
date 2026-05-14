export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      ...req.body,
      file: req.file,
    });
    next();
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      error: err.errors,
    });
  }
};
