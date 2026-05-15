import { z } from "zod";

export const createSalesVisitSchema = z.object({
  customerName: z.string().min(1, "Customer wajib diisi").max(100),
  address: z.string().min(1, "Alamat wajib diisi").max(300),
  meetWith: z.string().min(1, "Bertemu dengan wajib diisi").max(100),
  result: z.string().max(500).optional(),
  note: z.string().max(500).optional(),
});
