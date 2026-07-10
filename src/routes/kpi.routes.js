import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  indexAppraisal,
  createAppraisal,
  storeAppraisal,
  indexHistory,
  showHistory,
  showMyHistory,
} from "../controllers/kpi.controller.js";

const router = express.Router();

// 1. MANAJEMEN PENILAIAN (Khusus Wakil Direktur)
// GET  /api/kpi/appraisals              -> Menampilkan halaman daftar antrean penilaian
// GET  /api/kpi/appraisals/form/:id     -> Menampilkan halaman form KPI karyawan spesifik
// POST /api/kpi/appraisals/:employeeId  -> Memproses dan menyimpan data penilaian baru
router.get("/appraisals", roleMiddleware(["WAKIL_DIREKTUR"]), indexAppraisal);
router.get("/appraisals/form/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), createAppraisal);
router.post("/appraisals/:employeeId", roleMiddleware(["WAKIL_DIREKTUR"]), storeAppraisal);

// 2. RIWAYAT PENILAIAN (Global / Admin / Atasan)
// GET /api/kpi/histories                -> Menampilkan semua daftar riwayat KPI
// GET /api/kpi/histories/:id/:period    -> Menampilkan detail riwayat spesifik karyawan & periode
router.get("/histories", indexHistory);
router.get("/histories/:employeeId/:periode", showHistory);

// 3. RIWAYAT MANDIRI (Karyawan Login)
// GET /api/kpi/my-histories            -> Menampilkan riwayat milik diri sendiri
router.get("/my-histories", showMyHistory);

export default router;
