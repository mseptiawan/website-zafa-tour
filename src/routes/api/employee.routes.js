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
  uploadAvatarWeb,
  updateFinansialApi,
} from "../../controllers/employee.controller.js";
import employeePdfController from "../../controllers/employeePdf.controller.js"; // Import controller PDF terpisah
import { uploadFile } from "../../middlewares/uploadFile.js";
import {
  updateFinancialSchema,
  updateFamilySchema,
  updateContactSchema,
} from "../../validations/employee.schema.js";
import { validate } from "../../middlewares/validate.js";

const router = express.Router();

// ==========================================
// 1. EXPORT DOCUMENTS (Taruh paling atas agar tidak bentrok dengan /:id)
// ==========================================
router.get("/export-pdf", employeePdfController.exportPdf);
// router.get("/export-docs", employeeDocsController.exportDocs);

// ==========================================
// 2. OPERASIONAL CRUD & PROSES DATA
// ==========================================
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
router.post("/upload-avatar/:id", uploadFile.single("foto_profile"), uploadAvatarWeb);

export default router;
