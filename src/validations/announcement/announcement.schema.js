import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),
  content: z.string().min(10, "Isi terlalu pendek"),
  category: z.enum(["LIGHT", "OFFICIAL"]),
});
