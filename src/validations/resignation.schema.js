import { z } from "zod";

export const createResignationSchema = z.object({
  effective_date: z
    .string({ required_error: "Tanggal efektif keluar wajib diisi" })
    .refine((dateStr) => {
      const inputDate = new Date(dateStr);
      const today = new Date();
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      return inputDate > today;
    }, "Tanggal efektif keluar harus lebih besar dari hari ini"),

  reason: z
    .string({ required_error: "Alasan pengunduran diri wajib diisi" })
    .min(10, "Alasan terlalu pendek (minimal 10 karakter)")
    .max(1000, "Alasan terlalu panjang (maksimal 1000 karakter)")
    .trim(),
});

export const updateResignationSchema = createResignationSchema.partial();