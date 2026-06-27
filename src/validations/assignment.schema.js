import { z } from "zod";

export const createAssignmentSchema = z
  .object({
    title: z.string().min(1, "Judul penugasan wajib diisi"),
    description: z.string().min(10, "Deskripsi penugasan terlalu pendek (minimal 10 karakter)"),
    type: z.enum(["UNDANGAN", "INTERNAL", "TRAINING", "LAINNYA"], {
      errorMap: () => ({ message: "Tipe penugasan tidak valid" }),
    }),
    location: z.string().min(1, "Lokasi tujuan / tempat wajib diisi"),
    startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
    endDate: z.string().min(1, "Tanggal selesai wajib diisi"),
    employees: z.union([z.string().min(1), z.array(z.string()).min(1)], {
      errorMap: () => ({ message: "Minimal pilih satu pegawai untuk ditugaskan" }),
    }),
  })
  .refine(
    (data) => {
      if (
        data.startDate &&
        data.startDate.trim() !== "" &&
        data.endDate &&
        data.endDate.trim() !== ""
      ) {
        return new Date(data.startDate) <= new Date(data.endDate);
      }
      return true;
    },
    {
      message: "Tanggal mulai tidak boleh melebihi tanggal selesai",
      path: ["startDate"],
    }
  );
