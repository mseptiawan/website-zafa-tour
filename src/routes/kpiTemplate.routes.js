import express from "express";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import {
  index as indexTemplate,
  create as createTemplate,
  store as storeTemplate,
  edit as editTemplate,
  update as updateTemplate,
  destroy as destroyTemplate,
} from "../controllers/kpiTemplate.controller.js";

import {
  index as indexDetail,
  create as createDetail,
  store as storeDetail,
  edit as editDetail,
  update as updateDetail,
  destroy as destroyDetail,
} from "../controllers/kpiTemplateDetail.controller.js";

const router = express.Router();

// 🔒 Proteksi ini SEKARANG HANYA BERLAKU untuk modul KPI Template saja
router.use(roleMiddleware(["WAKIL_DIREKTUR"]));

// URL Base: /master/kpi-template (Ditangani oleh index.js)
router.get("/", indexTemplate);
router.get("/create", createTemplate);
router.post("/", storeTemplate);
router.get("/:id/edit", editTemplate);
router.put("/:id", updateTemplate);
router.delete("/:id", destroyTemplate);

// 2. Router Khusus untuk Template Detail (Nested Route)
const detailRouter = express.Router({ mergeParams: true });

// URL turunan dari: /master/kpi-template/:templateId/details
detailRouter.get("/", indexDetail);
detailRouter.get("/create", createDetail);
detailRouter.post("/", storeDetail);
detailRouter.get("/:detailId/edit", editDetail);
detailRouter.put("/:detailId", updateDetail);
detailRouter.delete("/:detailId", destroyDetail);

// 3. Menyambungkan Router Detail ke Router Utama
router.use("/:templateId/details", detailRouter);

export default router;
