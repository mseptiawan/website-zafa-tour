import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendNewEmployeeEmail = async (email, fullName, username, password) => {
  try {
    await resend.emails.send({
      from: "HRD Zafa Tour <hrd@zafa-tour.my.id>",
      to: email,
      subject: "Selamat Bergabung! Informasi Akun Sistem Informasi Pegawai",
      html: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #2563eb;">Halo, ${fullName}!</h2>
          <p>Akun sistem informasi pegawai Anda telah berhasil dibuat.</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 8px;">
            <p><strong>Username:</strong> ${username}</p>
         <p><strong>Password Default:</strong> <code>${password}</code></p>
          </div>
          <p>Silakan segera login dan ubah password Anda demi keamanan.</p>
          <a href="https://zafa-tour.my.id" style="background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Login ke Aplikasi</a>
        </div>
      `,
    });
    console.log("Email berhasil dikirim ke:", email);
  } catch (error) {
    console.error("Gagal kirim email:", error);
  }
};
