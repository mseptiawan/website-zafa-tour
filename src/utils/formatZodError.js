export const formatZodError = (error) => {
  const formatted = {};

  error.issues.forEach((issue) => {
    const path = issue.path.join(".");

    if (!formatted[path]) {
      formatted[path] = issue.message;
    }
  });

  return formatted;
};
