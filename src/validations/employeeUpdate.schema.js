import { z } from "zod";

export const updateEmployeeSchema = z.object({
  // --- DATA INTI (WAJIB) ---
  fullName: z
    .string()
    .min(3, { message: "Nama lengkap minimal 3 karakter" })
    .max(100, { message: "Nama lengkap terlalu panjang" })
    .regex(/^[a-zA-Z\s.`',]+$/, { message: "Nama hanya boleh berisi huruf dan tanda baca nama" }),

  roleId: z.string().min(1, { message: "Hak akses wajib dipilih" }),

  // --- DATA PRIBADI (OPSIONAL / NULLABLE) ---
  tempat_lahir: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 2, {
      message: "Tempat lahir minimal 2 karakter",
    }),

  tanggal_lahir: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Format tanggal lahir harus YYYY-MM-DD",
    }),

  jenis_kelamin: z
    .enum(["Laki-Laki", "Perempuan"], { message: "Pilih jenis kelamin yang valid" })
    .optional(),

  agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha"], {
    message: "Pilih agama yang valid",
  }),

  golongan_darah: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^(A|B|AB|O)[+-]?$/i.test(val), {
      message: "Golongan darah harus A, B, AB, atau O",
    })
    .transform((val) => (val ? val.toUpperCase() : val)),

  status_pernikahan: z.enum(["Lajang", "Menikah", "Cerai"]).optional(),

  // --- KEDINASAN / KARIR (WAJIB) ---
  positionId: z.string().min(1, { message: "Jabatan wajib dipilih" }),
  unitId: z.string().min(1, { message: "Unit wajib dipilih" }),
  bidangId: z.string().min(1, { message: "Bidang wajib dipilih" }),
  status_pegawai: z.enum(["Tetap", "Kontrak", "Magang"]),

  tanggal_mulai_bergabung: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal bergabung harus YYYY-MM-DD" }),

  tanggal_berakhir_kontrak: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Format tanggal berakhir kontrak harus YYYY-MM-DD",
    }),

  // --- KONTAK & DARURAT ---
  nomor_telp: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^(08|628)\d{7,12}$/.test(val), {
      message: "Nomor telepon tidak valid (Gunakan format 08xxxxxxxx atau 628xxxxxxxx)",
    }),

  alamat: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 10, {
      message: "Alamat rumah tinggal minimal 10 karakter",
    }),

  nama_kontak_darurat: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 3, {
      message: "Nama kontak darurat minimal 3 karakter",
    }),

  hubungan_kontak_darurat: z.string().optional().nullable(),

  nomor_kontak_darurat: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^(08|628)\d{7,12}$/.test(val), {
      message: "Nomor kontak darurat tidak valid",
    }),

  // --- AKADEMIK ---
  pendidikan_terakhir: z.string().optional().nullable(),
  institusi_pendidikan: z.string().optional().nullable(),
  tahun_kelulusan: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z
      .number()
      .min(1970, { message: "Tahun kelulusan tidak masuk akal" })
      .max(new Date().getFullYear(), {
        message: "Tahun kelulusan tidak boleh melebihi tahun sekarang",
      })
      .optional()
      .nullable()
  ),
  keahlian_utama: z.string().optional().nullable(),
  sertifikat_profesional: z.string().optional().nullable(),

  // --- FINANSIAL & LEGAL ---
  nama_bank: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 2, {
      message: "Nama bank minimal 2 karakter (misal: BCA, Mandiri)",
    }),

  nomor_rekening: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{8,18}$/.test(val), {
      message: "Nomor rekening harus berupa angka sepanjang 8-18 digit",
    }),

  nama_pemilik_rekening: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.trim().length >= 3, {
      message: "Nama pemilik rekening minimal 3 karakter",
    }),

  npwp: z
    .string()
    .optional()
    .nullable()
    // 🌟 TRANSFORM: Hapus semua karakter selain angka secara otomatis
    .transform((val) => (val ? val.replace(/[^0-9]/g, "") : val))
    .refine((val) => !val || /^\d{15,16}$/.test(val), {
      message: "Nomor NPWP harus berupa angka sepanjang 15 atau 16 digit",
    }),

  bpjstk: z
    .string()
    .optional()
    .nullable()
    // 🌟 TRANSFORM: Hapus semua karakter selain angka secara otomatis
    .transform((val) => (val ? val.replace(/[^0-9]/g, "") : val))
    .refine((val) => !val || /^\d{11}$/.test(val), {
      message: "Nomor BPJS Ketenagakerjaan harus berupa 11 digit angka",
    }),

  tanggal_kadaluarsa_skck: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), {
      message: "Format tanggal SKCK harus YYYY-MM-DD",
    }),

  // --- ARRAY: SERTIFIKAT KOMPETENSI ---
  sertifikat_kompetensi: z
    .array(
      z.object({
        nama_sertifikat: z
          .string()
          .optional()
          .nullable()
          .refine((val) => !val || val.trim().length >= 2, {
            message: "Nama sertifikat minimal 2 karakter jika diisi",
          }),
        penerbit: z.string().optional().nullable(),
        nomor_sertifikat: z.string().optional().nullable(),
        tanggal_terbit: z.string().optional().nullable(),
        tanggal_kadaluarsa: z.string().optional().nullable(),
      })
    )
    .optional()
    .default([]),

  // --- ARRAY: ANGGOTA KELUARGA ---
  anggota_keluarga: z
    .array(
      z.object({
        nama: z
          .string()
          .optional()
          .nullable()
          .refine((val) => !val || val.trim().length >= 3, {
            message: "Nama anggota keluarga minimal 3 huruf jika diisi",
          }),

        hubungan: z.enum(["Suami", "Istri", "Anak", "Orang Tua", "Saudara Kandung"]).optional(),

        nik: z
          .string()
          .optional()
          .nullable()
          .refine((val) => !val || /^\d{16}$/.test(val), {
            message: "NIK anggota keluarga harus tepat 16 digit angka",
          }),

        tanggal_lahir: z.string().optional().nullable(),
        jenis_kelamin: z.enum(["Laki-laki", "Perempuan"]).optional(),
        pekerjaan: z.string().optional().nullable(),
        status_tanggungan: z
          .preprocess((val) => val === "true" || val === true, z.boolean())
          .optional()
          .default(false),
      })
    )
    .optional()
    .default([]),
});
