import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "Nama lengkap minimal 3 karakter" })
    .max(100, { message: "Nama lengkap maksimal 100 karakter" }),
  nomor_ktp: z
    .string()
    .length(16, { message: "NIK KTP harus tepat 16 digit" })
    .regex(/^[0-9]+$/, { message: "NIK KTP hanya boleh berisi angka" }),
  email: z.string().email({ message: "Format email tidak valid" }),
  roleId: z.string().min(1, { message: "Hak akses wajib dipilih" }),
  jenis_kelamin: z.enum(["Laki-Laki", "Perempuan"], { message: "Jenis kelamin wajib dipilih" }),
  agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha"], {
    message: "Agama wajib dipilih",
  }),
  positionId: z.string().min(1, { message: "Jabatan wajib dipilih" }),
  unitId: z.string().min(1, { message: "Unit wajib dipilih" }),
  bidangId: z.string().min(1, { message: "Bidang wajib dipilih" }),
  status_pegawai: z.enum(["Pegawai Tetap", "Pegawai Kontrak", "Magang / Intern", "Pensiun"], {
    message: "Status pegawai wajib dipilih",
  }),
  tanggal_mulai_bergabung: z
    .string()
    .min(1, { message: "Tanggal mulai bergabung wajib diisi" })
    .refine((val) => !isNaN(Date.parse(val)), { message: "Format tanggal tidak valid" }),
});
