// src/utils/validateData.js
export const validateData = (schema, data) => {
  const result = schema.safeParse(data);

  if (!result.success) {
    const error = new Error("Validation error");
    error.status = 400;
    error.details = result.error.errors;
    throw error;
  }

  return result.data;
};
