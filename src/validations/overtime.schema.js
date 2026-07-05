import { z } from "zod";

export const createOvertimeSchema = z
  .object({
    date: z.string().min(1, "Tanggal wajib diisi"),

    startTime: z.string().min(1, "Jam mulai wajib diisi"),

    endTime: z.string().min(1, "Jam selesai wajib diisi"),

    workDescription: z
      .string()
      .min(10, "Deskripsi pekerjaan minimal 10 karakter")
      .max(500, "Deskripsi pekerjaan maksimal 500 karakter"),

    result: z
      .string()
      .max(500, "Hasil pekerjaan maksimal 500 karakter")
      .optional()
      .or(z.literal("")),

    location: z.object({
      type: z.enum(["OFFICE", "REMOTE", "CLIENT_SITE", "OTHER"]),
      detail: z.string().max(200).optional(),
    }),
  })
  .superRefine((data, ctx) => {
    // =========================
    // TIME VALIDATION
    // =========================
    const start = new Date(`${data.date}T${data.startTime}`);
    const end = new Date(`${data.date}T${data.endTime}`);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Jam selesai harus lebih besar dari jam mulai",
      });
    }

    const totalHours = (end - start) / (1000 * 60 * 60);

    if (totalHours > 12) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Lembur maksimal 12 jam",
      });
    }

    // =========================
    // DATE VALIDATION (FIXED)
    // =========================

    const workDate = data.date;
    const today = new Date().toISOString().split("T")[0];

    // tidak boleh future date
    if (workDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Tanggal lembur tidak boleh lebih dari hari ini",
      });
    }

    // maksimal 7 hari ke belakang
    const diffDays = (new Date(today) - new Date(workDate)) / (1000 * 60 * 60 * 24);

    if (diffDays > 7) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Lembur hanya dapat dicatat maksimal 7 hari ke belakang",
      });
    }
  });
