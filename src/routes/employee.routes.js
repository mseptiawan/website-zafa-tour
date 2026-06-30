import express from "express";
import {
  // Web Views Controllers
  getAllEmployeesWeb,
  formEmployeeWeb,
  editEmployeeWeb,
  getEmployeeDetailWeb,
  editProfileMandiriWeb,

  // Action Handlers Controllers
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
} from "../controllers/employee.controller.js";

// Middlewares
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";

// Validations
import {
  updateFinancialSchema,
  updateFamilySchema,
  updateContactSchema,
} from "../validations/employee.schema.js";

const router = express.Router();

// Role yang diizinkan mengelola data kepegawaian & karir
const HR_MANAGEMENT_ROLES = ["DIREKTUR_UTAMA", "WAKIL_DIREKTUR", "HR"];

// Semua rute di bawah ini wajib login
router.use(authMiddleware);

// ==========================================
// 1. ROUTE TAMPILAN WEB (GET)
// ==========================================
router.get("/", getAllEmployeesWeb);
router.get("/create", roleMiddleware(...HR_MANAGEMENT_ROLES), formEmployeeWeb);
router.get("/edit/:id", editEmployeeWeb);
router.get("/detail/:id", getEmployeeDetailWeb);
router.get("/my-profile/edit", editProfileMandiriWeb);

// ==========================================
// 2. ROUTE PROSES DATA / ACTION FORM (POST & PUT)
// ==========================================

// Create Karyawan Baru (Hanya HR)
router.post(
  "/create",
  roleMiddleware(...HR_MANAGEMENT_ROLES),
  uploadFile.fields([
    { name: "file_ktp", maxCount: 1 },
    { name: "file_kk", maxCount: 1 },
  ]),
  createEmployeeApi
);

// Pengajuan PHK (Hanya HR)
router.post(
  "/phk",
  roleMiddleware(...HR_MANAGEMENT_ROLES),
  uploadFile.single("document"),
  ajukanPHKApi
);

// Update Tab Data Karyawan (API / AJAX Fetch)
router.put("/:id/pribadi", updatePribadiApi);

router.put("/:id/karir", roleMiddleware(...HR_MANAGEMENT_ROLES), updateKarirApi);

router.put("/:id/kontak", validate(updateContactSchema), updateKontakApi);

router.put("/:id/dokumen", uploadFile.any(), updateDokumenApi);

router.put("/:id/pendidikan", uploadFile.single("file_ijazah"), updatePendidikanApi);

router.put("/:id/keluarga", validate(updateFamilySchema), updateKeluargaApi);

router.put("/:id/finansial", validate(updateFinancialSchema), updateFinansialApi);

// Upload Avatar / Foto Profil
router.post("/upload-avatar/:id", uploadFile.single("foto_profile"), uploadAvatarWeb);

export default router;
