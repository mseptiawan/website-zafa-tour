export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const formattedErrors = {};
      result.error.errors.forEach((err) => {
        const path = err.path[0];
        if (!formattedErrors[path]) {
          formattedErrors[path] = err.message;
        }
      });

      req.validationErrors = formattedErrors;
      return next();
    }

    req[source] = result.data;
    next();
  };
