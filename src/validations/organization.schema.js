import { z } from "zod";

const nameSchema = z
  .string()
  .trim()
  .min(2, "Minimal 2 karakter")
  .max(100, "Maksimal 100 karakter")
  .regex(/^[a-zA-ZÀ-ÿ0-9\s.,&()/-]+$/, "Mengandung karakter yang tidak diperbolehkan");

export const bidangSchema = z.object({
  name: nameSchema,
});

export const unitSchema = z.object({
  bidangId: z.string().regex(/^[0-9a-fA-F]{24}$/, "ID bidang tidak valid"),

  name: nameSchema,

  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter")
    .optional()
    .or(z.literal("")),
});

export const positionSchema = z.object({
  name: nameSchema,

  description: z
    .string()
    .trim()
    .max(255, "Deskripsi maksimal 255 karakter")
    .optional()
    .or(z.literal("")),
});
