import { z } from "zod";

export const createSalesVisitSchema = z.object({
  title: z.string().min(1, "Judul wajib diisi").max(100),
  address: z.string().min(1, "Alamat wajib diisi").max(300),
  meetWith: z.string().min(1, "Bertemu dengan wajib diisi").max(100),
  result: z.string().max(500).optional().or(z.literal("")),
});

export const updateSalesVisitSchema = createSalesVisitSchema;
