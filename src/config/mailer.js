import nodemailer from "nodemailer";

let transporter = null;

export const getMailer = () => {
  if (!transporter) {
    console.log("=== MAILER INIT ===");
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "OK" : "MISSING");

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("ENV EMAIL belum siap");
    }

    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return transporter;
};
