import { z } from "zod";

export const createEmployeeSchema = z
  .object({
    fullName: z
      .string({ required_error: "Nama lengkap wajib diisi" })
      .min(3, "Nama lengkap minimal 3 karakter")
      .max(100, "Nama lengkap maksimal 100 karakter")
      .trim(),

    nomor_ktp: z
      .string({ required_error: "Nomor KTP (NIK) wajib diisi" })
      .length(16, "Nomor KTP (NIK) harus tepat 16 digit")
      .regex(/^\d+$/, "Nomor KTP (NIK) hanya boleh berisi angka")
      .trim(),

    email: z
      .string({ required_error: "Email utama wajib diisi" })
      .email("Format email aplikasi tidak valid")
      .trim()
      .toLowerCase(),

    roleId: z
      .string({ required_error: "Hak akses sistem (Role) wajib dipilih" })
      .min(1, "Hak akses sistem (Role) wajib dipilih"),

    jenis_kelamin: z.enum(["Laki-Laki", "Perempuan"], {
      required_error: "Jenis kelamin wajib dipilih",
      invalid_type_error: "Pilihan jenis kelamin tidak valid",
    }),

    agama: z.enum(["Islam", "Kristen", "Katolik", "Hindu", "Buddha"], {
      required_error: "Agama wajib dipilih",
      invalid_type_error: "Pilihan agama tidak valid",
    }),

    positionId: z
      .string({ required_error: "Jabatan struktural wajib dipilih" })
      .min(1, "Jabatan struktural wajib dipilih"),

    bidangId: z
      .string({ required_error: "Bidang kerja wajib dipilih" })
      .min(1, "Bidang kerja wajib dipilih"),

    unitId: z
      .string({ required_error: "Unit kantor penempatan wajib dipilih" })
      .min(1, "Unit kantor penempatan wajib dipilih"),

    status_pegawai: z.enum(["Pegawai Tetap", "Pegawai Kontrak", "Magang / Intern", "Pensiun"], {
      required_error: "Status kepegawaian awal wajib dipilih",
      invalid_type_error: "Pilihan status kepegawaian tidak valid",
    }),

    tanggal_mulai_bergabung: z
      .string({ required_error: "Tanggal mulai bergabung wajib diisi" })
      .refine((val) => !isNaN(Date.parse(val)), {
        message: "Format tanggal mulai bergabung tidak valid",
      }),

    tanggal_berakhir_kontrak: z
      .string()
      .optional()
      .transform((val) => (val === "" ? null : val))
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.status_pegawai === "Pegawai Kontrak" || data.status_pegawai === "Magang / Intern") {
        return (
          data.tanggal_berakhir_kontrak !== null && data.tanggal_berakhir_kontrak !== undefined
        );
      }
      return true;
    },
    {
      message: "Tanggal berakhir kontrak/magang wajib diisi untuk status ini",
      path: ["tanggal_berakhir_kontrak"],
    }
  )
  .refine(
    (data) => {
      if (data.tanggal_mulai_bergabung && data.tanggal_berakhir_kontrak) {
        const mulai = new Date(data.tanggal_mulai_bergabung);
        const berakhir = new Date(data.tanggal_berakhir_kontrak);
        return berakhir > mulai;
      }
      return true;
    },
    {
      message: "Tanggal berakhir kontrak harus lebih maju dari tanggal mulai bergabung",
      path: ["tanggal_berakhir_kontrak"],
    }
  );
export const updateFinancialSchema = z.object({
  nama_bank: z
    .string({ required_error: "Nama bank wajib diisi" })
    .min(2, "Nama bank minimal 2 karakter")
    .trim(),

  nomor_rekening: z
    .string({ required_error: "Nomor rekening wajib diisi" })
    .trim()
    .regex(/^\d+$/, "Nomor rekening harus angka"),

  nama_pemilik_rekening: z
    .string({ required_error: "Nama pemilik wajib diisi" })
    .min(3, "Nama pemilik wajib diisi")
    .trim(),

  npwp: z
    .preprocess((val) => (val === "" || val === undefined ? null : val), z.string().nullable())
    .optional(),

  bpjstk: z
    .preprocess((val) => (val === "" || val === undefined ? null : val), z.string().nullable())
    .optional(),

  overtimeRate: z
    .preprocess(
      (val) => (val === "" || val === undefined ? 0 : Number(val)),
      z.number().min(0, "Overtime rate tidak boleh negatif")
    )
    .optional(),

  basicSalary: z
    .preprocess(
      (val) => {
        if (!val) return 0;
        if (typeof val === "string") {
          const cleanString = val.replace(/[^0-9]/g, "");
          return Number(cleanString);
        }
        return Number(val);
      },
      z.number().min(0, "Gaji pokok tidak boleh negatif")
    )
    .optional(),
});

const familyMemberSchema = z.object({
  nama: z.string({ required_error: "Nama wajib diisi" }).min(2, "Nama minimal 2 karakter").trim(),

  hubungan: z.enum(["Suami", "Istri", "Anak", "Orang Tua", "Saudara Kandung"], {
    required_error: "Hubungan keluarga wajib dipilih",
    invalid_type_error: "Pilihan hubungan keluarga tidak valid",
  }),

  nik: z
    .string({ required_error: "NIK wajib diisi" })
    .length(16, "NIK harus tepat 16 digit")
    .regex(/^\d+$/, "NIK harus berupa angka")
    .trim(),

  pekerjaan: z
    .string()
    .trim()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .optional(),
});

export const updateFamilySchema = z.object({
  anggota_keluarga: z.array(familyMemberSchema).optional().default([]),
});

export const updateContactSchema = z.object({
  nomor_telp: z
    .string({ required_error: "Nomor telepon pegawai wajib diisi" })
    .trim()
    .min(1, "Nomor telepon pegawai tidak boleh kosong")
    .regex(/^\d+$/, "Nomor telepon harus berupa angka (tidak boleh ada huruf/simbol)")
    .min(9, "Nomor telepon minimal 9 digit")
    .max(15, "Nomor telepon maksimal 15 digit"),

  nama_kontak_darurat: z
    .string({ required_error: "Nama kontak darurat wajib diisi" })
    .trim()
    .min(1, "Nama kontak darurat tidak boleh kosong")
    .min(3, "Nama kontak darurat minimal 3 karakter"),

  hubungan_kontak_darurat: z
    .string({ required_error: "Hubungan kontak darurat wajib diisi" })
    .trim()
    .min(1, "Hubungan kontak darurat tidak boleh kosong"),

  nomor_kontak_darurat: z
    .string({ required_error: "Nomor kontak darurat wajib diisi" })
    .trim()
    .min(1, "Nomor kontak darurat tidak boleh kosong")
    .regex(/^\d+$/, "Nomor kontak darurat harus berupa angka (tidak boleh ada huruf/simbol)")
    .min(9, "Nomor kontak darurat minimal 9 digit")
    .max(15, "Nomor kontak darurat maksimal 15 digit"),

  alamat: z
    .string({ required_error: "Alamat domisili lengkap wajib diisi" })
    .trim()
    .min(1, "Alamat domisili lengkap tidak boleh kosong")
    .min(10, "Alamat domisili harus lengkap (minimal 10 karakter)"),
});

export const updateDocumentSchema = z.object({
  nik_ktp: z
    .string({ required_error: "NIK KTP wajib diisi" })
    .length(16, "NIK KTP harus tepat 16 digit")
    .regex(/^\d+$/, "NIK KTP harus berupa angka")
    .trim(),

  nomor_paspor: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .nullable()
    .refine(
      (val) => {
        if (!val) return true;
        return /^[A-Z0-9]{7,9}$/i.test(val); // Pola umum nomor paspor Alfanumerik 7-9 karakter
      },
      { message: "Format Nomor Paspor tidak valid" }
    ),

  nama_file_kontrak: z.string().optional(),
});
