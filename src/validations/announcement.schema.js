import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string({ required_error: "Judul wajib diisi" })
    .min(5, "Judul terlalu pendek (minimal 5 karakter)")
    .max(100, "Judul terlalu panjang (maksimal 100 karakter)")
    .trim(),

  content: z
    .string({ required_error: "Isi pengumuman wajib diisi" })
    .min(15, "Isi pengumuman terlalu pendek (minimal 15 karakter)")
    .trim(),

  category: z.enum(["LIGHT", "OFFICIAL"], {
    errorMap: () => ({ message: "Kategori tidak valid" }),
  }),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();
