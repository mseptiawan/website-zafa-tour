import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z
    .string()
    .min(5, { message: "Judul pengumuman terlalu pendek (minimal 5 karakter)" })
    .max(100, { message: "Judul pengumuman terlalu panjang (maksimal 100 karakter)" }),
  content: z.string().min(15, { message: "Isi pengumuman terlalu pendek (minimal 15 karakter)" }),
  category: z.enum(["LIGHT", "OFFICIAL"], {
    errorMap: () => ({ message: "Kategori yang dipilih tidak valid" }),
  }),
});
