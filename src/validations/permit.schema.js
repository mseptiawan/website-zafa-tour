import { z } from "zod";

export const createPermitSchema = z.object({
  type: z.enum(["SAKIT", "PENDAMPINGAN_MELAHIRKAN", "MUSIBAH", "PENTING"], {
    error_map: () => ({ message: "Jenis izin yang dipilih tidak valid." }),
  }),
  date: z
    .string({ required_error: "Tanggal ketidakhadiran wajib diisi." })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Format tanggal tidak valid.",
    }),
  reason: z
    .string({ required_error: "Alasan pengajuan wajib diisi." })
    .trim()
    .min(5, { message: "Alasan terlalu pendek, minimal 5 karakter." })
    .max(500, { message: "Alasan terlalu panjang, maksimal 500 karakter." }),
});
