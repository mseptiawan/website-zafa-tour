import express from "express";
import {
  createEmployeeApi,
  ajukanPHKApi,
  updatePribadiApi,
  updateKarirApi,
  updateKontakApi,
  updateDokumenApi,
  updatePendidikanApi,
  updateKeluargaApi,
  updateFinansialApi,
} from "../../controllers/employee.controller.js";
import { uploadFile } from "../../middlewares/uploadFile.js";
import {
  updateFinancialSchema,
  updateFamilySchema,
  updateContactSchema,
} from "../../validations/employee.schema.js";
import { validate } from "../../middlewares/validate.js";

const router = express.Router();
router.post(
  "/create",
  uploadFile.fields([
    { name: "file_ktp", maxCount: 1 },
    { name: "file_kk", maxCount: 1 },
  ]),
  createEmployeeApi
);
router.post("/phk", uploadFile.single("document"), ajukanPHKApi);

router.put("/:id/pribadi", updatePribadiApi);
router.put("/:id/karir", updateKarirApi);
router.put("/:id/kontak", validate(updateContactSchema), updateKontakApi);
router.put("/:id/dokumen", uploadFile.any(), updateDokumenApi);
router.put("/:id/pendidikan", uploadFile.single("file_ijazah"), updatePendidikanApi);
router.put("/:id/keluarga", validate(updateFamilySchema), updateKeluargaApi);
router.put("/:id/finansial", validate(updateFinancialSchema), updateFinansialApi);

export default router;
