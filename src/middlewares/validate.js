export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    console.log("BODY:", req.body);

    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const error = new Error("Validation error");
      error.status = 400;
      error.details = result.error.errors;
      return next(error);
    }

    req.validated = result.data;
    next();
  };
