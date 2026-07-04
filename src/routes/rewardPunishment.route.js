import express from "express";
import * as rpController from "../controllers/rewardPunishment.controller.js";

const router = express.Router();

// ─── TRANSACTIONAL LOGS ───
router.get("/", rpController.index);
router.get("/new", rpController.create);
router.post("/", rpController.store);
router.get("/delete/:id", rpController.destroy);

router.get("/my-logs", rpController.myLog);

// ─── MASTER TYPES (AJAX/API SINGLE PAGE) ───
router.get("/types", rpController.indexType);
router.post("/types", rpController.storeType);
router.put("/types/:id", rpController.updateType);
router.patch("/types/toggle-status/:id", rpController.toggleStatusType);

export default router;
