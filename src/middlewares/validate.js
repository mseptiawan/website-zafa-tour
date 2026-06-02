import { formatZodError } from "../utils/formatZodError.js";

export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      console.log("ZOD ERROR:", result.error.issues);
      req.validationErrors = formatZodError(result.error);

      return next();
    }

    req[source] = result.data;
    req.validationErrors = null;

    next();
  };
