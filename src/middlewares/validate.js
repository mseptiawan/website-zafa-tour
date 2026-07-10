import { formatZodError } from "../utils/formatZodError.js";

export const validate =
  (schema, source = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      req.validationErrors = formatZodError(result.error);

      req.body ??= {};
      req.params ??= {};
      req.query ??= {};

      return next();
    }

    req.validationErrors = null;
    req[source] = result.data;

    next();
  };
