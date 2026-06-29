import { z } from "zod";

export const createPermitSchema = z.object({
  type: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(
      [
        "SAKIT",
        "PENDAMPINGAN_MELAHIRKAN",
        "MUSIBAH",
        "PENTING",
        "KEPERLUAN_KELUARGA",
        "KEPERLUAN_MENDESAK",
        "LAINNYA",
      ],
      {
        invalid_type_error: "Jenis izin yang dipilih tidak valid.",
        required_error: "Jenis izin wajib dipilih.",
      }
    )
  ),
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
