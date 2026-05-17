import { z } from "zod";

export const createAssignmentSchema = z.object({
  title: z.string().min(5, "Judul minimal 5 karakter"),

  description: z.string().min(10),

  type: z.enum(["UNDANGAN", "INTERNAL", "TRAINING", "LAINNYA"]),

  location: z.string().min(3, "Lokasi wajib diisi"),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  employees: z.preprocess((val) => {
    if (!val) return [];

    if (Array.isArray(val)) return val;

    return [val];
  }, z.array(z.string())),
});
