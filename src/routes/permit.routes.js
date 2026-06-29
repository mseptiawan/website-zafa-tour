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
  edit,
  update,
  destroy,
} from "../controllers/permit.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_DIRECTORATE_ROLES = ["DIREKTUR_UTAMA", "WAKIL_DIREKTUR"];

// Aksesibilitas Sisi Karyawan (Pengaju Pemohon)
router.get("/new", create);
router.post("/", uploadFile.single("document"), validate(createPermitSchema), store);
router.get("/history", getHistoryPermits);

// Tambahkan rute Edit & Delete khusus Sisi Karyawan di bawah ini:
router.get("/edit/:id", edit);
router.post("/edit/:id", uploadFile.single("document"), validate(createPermitSchema), update);
router.get("/delete/:id", destroy);

// Aksesibilitas Sisi Atasan (Otorisasi Direksi)
router.get("/incoming", roleMiddleware(...ALLOWED_DIRECTORATE_ROLES), getIncomingPermits);
router.post("/approval/:id", roleMiddleware(...ALLOWED_DIRECTORATE_ROLES), actionApproval);

export default router;
