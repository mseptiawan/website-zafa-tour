import { z } from "zod";

const baseExpenseSchema = z.object({
  title: z
    .string({ required_error: "Judul pengeluaran wajib diisi" })
    .min(5, "Judul terlalu pendek (minimal 5 karakter)")
    .max(150, "Judul terlalu panjang (maksimal 150 karakter)")
    .trim(),

  category: z
    .string({ required_error: "Kategori beban wajib dipilih" })
    .regex(/^[0-9a-fA-F]{24}$/, "Format kategori tidak valid"),

  expenseDate: z.string({ required_error: "Tanggal nota wajib diisi" }).refine((dateStr) => {
    const inputDate = new Date(dateStr);
    const today = new Date();
    inputDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return inputDate <= today;
  }, "Tanggal nota tidak boleh melebihi hari ini"),

  amount: z
    .string({ required_error: "Nominal tagihan wajib diisi" })
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Nominal harus berupa angka dan lebih besar dari 0",
    }),

  noReceipt: z
    .string()
    .optional()
    .transform((val) => val === "on"),

  noReceiptReason: z
    .string()
    .max(500, "Alasan terlalu panjang (maksimal 500 karakter)")
    .trim()
    .optional(),

  selfDeclaration: z
    .string()
    .optional()
    .transform((val) => val === "on"),
});

export const createExpenseSchema = baseExpenseSchema.superRefine((data, ctx) => {
  if (data.noReceipt) {
    if (!data.noReceiptReason || data.noReceiptReason.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Alasan ketiadaan nota wajib diisi (minimal 10 karakter)",
        path: ["noReceiptReason"],
      });
    }

    if (!data.selfDeclaration) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pernyataan Tanggung Jawab Mutlak wajib dicentang",
        path: ["selfDeclaration"],
      });
    }
  }
});

export const updateExpenseSchema = baseExpenseSchema.partial();
