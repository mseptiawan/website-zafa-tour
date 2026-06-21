import { Resend } from "resend";

// Ambil API Key dari .env (Contoh: res_123abc...)
const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
