import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import {
  renderRewardPunishmentIndexPage,
  renderCreateRewardPunishmentForm,
  storeRewardPunishmentLog,
  deleteRewardPunishmentLog,
  renderEmployeeRewardPunishmentLogPage,
  renderMasterTypeIndexPage,
  storeMasterType,
  updateMasterType,
  toggleMasterTypeStatus,
} from "../controllers/rewardPunishment.controller.js";

const router = express.Router();

router.use(authMiddleware);

// ─── TRANSACTIONAL LOGS ───
router.get("/", renderRewardPunishmentIndexPage);
router.get("/new", renderCreateRewardPunishmentForm);
router.post("/", uploadFile.single("attachment"), storeRewardPunishmentLog);
router.delete("/:id", deleteRewardPunishmentLog);
router.get("/my-logs", renderEmployeeRewardPunishmentLogPage);

// ─── MASTER TYPES (AJAX/API SINGLE PAGE) ───
router.get("/types", renderMasterTypeIndexPage);
router.post("/types", storeMasterType);
router.put("/types/:id", updateMasterType);
router.patch("/types/toggle-status/:id", toggleMasterTypeStatus);

export default router;
