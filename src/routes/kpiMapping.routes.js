import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  index,
  create,
  store,
  edit,
  update,
  destroy,
} from "../controllers/kpiMapping.contoller.js"; // Sesuaikan nama file controller Anda

const router = express.Router();

// 🔒 Proteksi hak akses khusus manajemen/wakil direktur untuk pengelolaan distribusi KPI
router.use(roleMiddleware(["WAKIL_DIREKTUR"]));

// URL Base: /master/kpi-mapping (Sudah di-prefix di file router utama/app.js)
router.get("/", index);
router.get("/create", create);
router.post("/", store);
router.get("/:id/edit", edit);
router.put("/:id", update);
router.delete("/:id", destroy);

export default router;
