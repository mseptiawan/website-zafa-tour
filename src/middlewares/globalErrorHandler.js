export const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  const message =
    statusCode === 500
      ? "Maaf, sistem sedang mengalami gangguan. Mohon coba beberapa saat lagi."
      : err.message;

  if (!req.xhr && !req.headers.accept?.includes("application/json")) {
    return res.status(statusCode).render("error", {
      title: "Terjadi Kesalahan",
      message: message,
      statusCode,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: message,
  });
};
