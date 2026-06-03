import { z } from "zod";

export const createSalesVisitSchema = z.object({
  title: z
    .string()
    .min(5, "Judul kunjungan terlalu pendek (minimal 5 karakter)")
    .max(100, "Judul terlalu panjang (maksimal 100 karakter)"),

  address: z
    .string()
    .min(10, "Alamat harus lengkap (minimal 10 karakter)")
    .max(300, "Alamat terlalu panjang (maksimal 300 karakter)"),

  meetWith: z
    .string()
    .min(3, "Nama yang ditemui terlalu pendek (minimal 3 karakter)")
    .max(100, "Nama terlalu panjang (maksimal 100 karakter)"),

  result: z
    .string()
    .min(10, "Hasil kunjungan harus jelas (minimal 10 karakter)")
    .max(500, "Hasil terlalu panjang (maksimal 500 karakter)"),
});

export const updateSalesVisitSchema = createSalesVisitSchema;
