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

router.get("/", renderRewardPunishmentIndexPage);
router.get("/new", renderCreateRewardPunishmentForm);
router.post("/", uploadFile.single("attachment"), storeRewardPunishmentLog);
router.delete("/:id", deleteRewardPunishmentLog);
router.get("/my-logs", renderEmployeeRewardPunishmentLogPage);

router.get("/types", renderMasterTypeIndexPage);
router.post("/types", storeMasterType);
router.put("/types/:id", updateMasterType);
router.patch("/types/toggle-status/:id", toggleMasterTypeStatus);

export default router;
