import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createPermitSchema } from "../validations/permit.schema.js";
import {
  create,
  store,
  getHistoryPermits,
  getIncomingPermits,
  actionApproval,
} from "../controllers/permit.controller.js";

const router = express.Router();

// Mewajibkan verifikasi token autentikasi login aktif untuk mengakses seluruh sub-rute
router.use(authMiddleware);

const ALLOWED_DIRECTORATE_ROLES = ["DIREKTUR_UTAMA", "WAKIL_DIREKTUR"];

// Aksesibilitas Sisi Karyawan (Pengaju Pemohon)
router.get("/new", create);
router.post("/", uploadFile.single("document"), validate(createPermitSchema), store);
router.get("/history", getHistoryPermits);

// Aksesibilitas Sisi Atasan (Otorisasi Direksi)
router.get("/incoming", roleMiddleware(...ALLOWED_DIRECTORATE_ROLES), getIncomingPermits);
router.post("/approval/:id", roleMiddleware(...ALLOWED_DIRECTORATE_ROLES), actionApproval);

export default router;
