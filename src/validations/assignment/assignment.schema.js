import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),

  description: z.string().min(10, "Deskripsi terlalu pendek"),

  type: z.enum(["UNDANGAN", "INTERNAL", "TRAINING", "LAINNYA"]),

  location: z.string().min(3, "Lokasi wajib diisi"),

  startDate: z.string(),

  endDate: z.string(),

  employees: z.union([z.string(), z.array(z.string())]),
});
