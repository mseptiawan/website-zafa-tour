export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    ...req.body,
    file: req.file,
    files: req.files,
  });

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: result.error.errors.map((e) => ({
        field: e.path[0],
        message: e.message,
      })),
    });
  }

  req.body = result.data;

  next();
};
