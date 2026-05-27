import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Nama lengkap minimal 3 karakter" })
    .max(100, { message: "Nama lengkap maksimal 100 karakter" })
    .trim(),
  email: z.string().trim().toLowerCase().email({ message: "Format email tidak valid" }),
  roleId: z.string().min(1, { message: "Role ID wajib diisi" }),

  nomor_ktp: z.string().regex(/^\d{16}$/, { message: "Nomor KTP harus berupa 16 digit angka" }),
  tempat_lahir: z.string().min(2, { message: "Tempat lahir wajib diisi" }).trim(),
  tanggal_lahir: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), { message: "Tanggal lahir tidak valid" }),
  jenis_kelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"], {
    message: "Jenis kelamin harus LAKI_LAKI atau PEREMPUAN",
  }),
  agama: z.string().min(1, { message: "Agama wajib diisi" }),
  golongan_darah: z.enum(["A", "B", "AB", "O", "-"]).optional().nullable().or(z.literal("")),
  status_pernikahan: z.string().min(1, { message: "Status pernikahan wajib diisi" }),

  positionId: z.string().nullable().optional().or(z.literal("")),
  unitId: z.string().nullable().optional().or(z.literal("")),
  bidangId: z.string().nullable().optional().or(z.literal("")),
  status_pegawai: z.string().nullable().optional().or(z.literal("")),
  tanggal_mulai_bergabung: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),
  tanggal_berakhir_kontrak: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .transform((val) => (val ? new Date(val) : null)),

  nomor_telp: z
    .string()
    .min(9, { message: "Nomor telepon minimal 9 digit" })
    .max(15, { message: "Nomor telepon maksimal 15 digit" }),
  alamat: z.string().min(5, { message: "Alamat minimal 5 karakter" }).trim(),
  nama_kontak_darurat: z
    .string()
    .min(3, { message: "Nama kontak darurat minimal 3 karakter" })
    .trim(),
  hubungan_kontak_darurat: z.string().min(1, { message: "Hubungan kontak darurat wajib diisi" }),
  nomor_kontak_darurat: z.string().min(9, { message: "Nomor kontak darurat minimal 9 digit" }),

  pendidikan_terakhir: z.string().min(1, { message: "Pendidikan terakhir wajib diisi" }),
  institusi_pendidikan: z
    .string()
    .min(2, { message: "Nama institusi pendidikan wajib diisi" })
    .trim(),
  tahun_kelulusan: z
    .string()
    .or(z.number())
    .transform((val) => Number(val))
    .refine((val) => val > 1950 && val <= new Date().getFullYear(), {
      message: "Tahun kelulusan tidak valid",
    }),
  keahlian_utama: z.string().optional().nullable().or(z.literal("")),
  sertifikat_profesional: z.string().optional().nullable().or(z.literal("")),

  nama_bank: z.string().min(2, { message: "Nama bank wajib diisi" }).trim(),
  nomor_rekening: z.string().min(5, { message: "Nomor rekening wajib diisi" }).trim(),
  nama_pemilik_rekening: z.string().min(3, { message: "Nama pemilik rekening wajib diisi" }).trim(),
  npwp: z.string().nullable().optional().or(z.literal("")),
  bpjstk: z.string().nullable().optional().or(z.literal("")),
});
