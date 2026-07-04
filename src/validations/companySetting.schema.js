import { z } from "zod";

// Reusable schema untuk nama lokasi / nama perusahaan sesuai standarmu
const companyNameSchema = z
  .string()
  .trim()
  .min(2, "Nama minimal 2 karakter")
  .max(100, "Nama maksimal 100 karakter")
  .regex(/^[a-zA-ZÀ-ÿ0-9\s.,&()/-]+$/, "Mengandung karakter yang tidak diperbolehkan");

// Skema untuk child object (lokasi kantor)
const officeLocationSchema = z.object({
  locationName: z
    .string()
    .trim()
    .min(2, "Nama lokasi minimal 2 karakter")
    .max(100, "Nama lokasi maksimal 100 karakter"),

  lat: z.coerce // Mengubah string dari form-body menjadi number secara otomatis
    .number({ invalid_type_error: "Garis lintang (Latitude) harus berupa angka" })
    .min(-90, "Latitude tidak boleh kurang dari -90")
    .max(90, "Latitude tidak boleh lebih dari 90"),

  lng: z.coerce
    .number({ invalid_type_error: "Garis bujur (Longitude) harus berupa angka" })
    .min(-180, "Longitude tidak boleh kurang dari -180")
    .max(180, "Longitude tidak boleh lebih dari 180"),

  radiusMeter: z.coerce
    .number({ invalid_type_error: "Radius harus berupa angka" })
    .int("Radius harus berupa bilangan bulat")
    .min(10, "Radius minimal berjarak 10 meter"),
});

// Skema utama untuk update Company Setting
export const updateCompanySettingSchema = z.object({
  name: companyNameSchema,

  entryTimeLimit: z
    .string()
    .trim()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Format jam masuk harus HH:mm (contoh: 08:20)"),

  gracePeriodMinutes: z.coerce
    .number({ invalid_type_error: "Masa tenggang harus berupa angka" })
    .int("Masa tenggang harus berupa bilangan bulat")
    .min(0, "Masa tenggang tidak boleh negatif"),

  // Menerima array of objects lokasi, minimal harus ada 1 lokasi kantor yang didaftarkan
  locations: z.array(officeLocationSchema).optional().default([]),
});
