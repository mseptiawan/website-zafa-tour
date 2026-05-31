export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    console.log("DATA YANG MASUK KE BACKEND:", req[source]);
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const error = new Error("Validation error");
      error.status = 400;
      error.message = result.error.errors[0].message;
      error.details = result.error.errors;
      return next(error);
    }

    req[source] = result.data;
    next();
  };
