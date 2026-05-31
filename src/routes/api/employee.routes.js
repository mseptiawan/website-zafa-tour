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
  updateEmployeeApi,
} from "../../controllers/employee.controller.js";
import { uploadFile } from "../../middlewares/uploadFile.js";

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
router.put("/:id/kontak", updateKontakApi);
router.put("/api/employee/:id/dokumen", uploadFile.any(), updateDokumenApi);
router.put("/:id/pendidikan", updatePendidikanApi);
router.put("/:id/keluarga", updateKeluargaApi);
router.put("/:id/finansial", updateFinansialApi);

export default router;
