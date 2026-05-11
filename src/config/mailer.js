import dotenv from "dotenv";
dotenv.config();
import nodemailer from "nodemailer";

// Pastikan pengecekan log muncul saat file ini di-import
console.log("MAILER ENV CHECK:", {
  user: process.env.EMAIL_USER ? "Loaded" : "Not Found",
  pass: process.env.EMAIL_PASS ? "Loaded" : "Not Found",
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default transporter;
