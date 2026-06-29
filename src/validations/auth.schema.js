import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string({ required_error: "Username atau Email wajib diisi" })
    .min(1, "Username atau Email tidak boleh kosong")
    .trim(),
  password: z
    .string({ required_error: "Password wajib diisi" })
    .min(1, "Password tidak boleh kosong"),
  remember: z.any().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: "Email wajib diisi" })
    .email("Format alamat email tidak valid")
    .trim(),
});

export const resetPasswordSchema = z
  .object({
    token: z.string({ required_error: "Token reset tidak valid atau hilang" }),
    password: z
      .string({ required_error: "Password baru wajib diisi" })
      .min(6, "Password baru terlalu pendek (minimal 6 karakter)"),
    confirmPassword: z.string({ required_error: "Konfirmasi password wajib diisi" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: "Password saat ini wajib diisi" })
      .min(1, "Password saat ini tidak boleh kosong"),
    password: z
      .string({ required_error: "Password baru wajib diisi" })
      .min(6, "Password baru terlalu pendek (minimal 6 karakter)"),
    confirmPassword: z.string({ required_error: "Konfirmasi password wajib diisi" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password baru tidak cocok",
    path: ["confirmPassword"],
  });
