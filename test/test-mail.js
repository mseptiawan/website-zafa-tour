import dotenv from "dotenv";
dotenv.config();

import { mailer } from "../src/config/mailer.js";

mailer
  .sendMail({
    from: process.env.EMAIL_USER,
    to: "mseptiawan017@gmail.com",
    subject: "TEST EMAIL",
    text: "Ini test email",
  })
  .then(() => {
    console.log("EMAIL BERHASIL DIKIRIM");
  })
  .catch((err) => {
    console.log("EMAIL ERROR:", err);
  });
