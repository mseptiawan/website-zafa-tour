import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { validate } from "../middlewares/validate.js";
import { updateCompanySettingSchema } from "../validations/companySetting.schema.js";
import { showSettings, handleUpdateSettings } from "../controllers/companySetting.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_MANAGEMENT_ROLES = ["DIREKTUR_UTAMA", "WAKIL_DIREKTUR", "MANAGER_ADMINISTRASI"];

router.get("/", roleMiddleware(...ALLOWED_MANAGEMENT_ROLES), showSettings);

router.post(
  "/",
  roleMiddleware(...ALLOWED_MANAGEMENT_ROLES),
  validate(updateCompanySettingSchema),
  handleUpdateSettings
);

export default router;
