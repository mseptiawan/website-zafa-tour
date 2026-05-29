import { z } from "zod";

export const bidangSchema = z.object({
  name: z
    .string()
    .min(3, "Nama bidang minimal 3 karakter")
    .max(50, "Nama bidang maksimal 50 karakter"),
});

export const unitSchema = z.object({
  bidangId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID Bidang tidak valid"),
  name: z.string().min(3, "Nama sub-unit minimal 3 karakter"),
  description: z.string().optional(),
});

export const positionSchema = z.object({
  name: z.string().min(3, "Nama jabatan minimal 3 karakter"),
  description: z.string().optional(),
});
