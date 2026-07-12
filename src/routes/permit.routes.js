import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createPermitSchema } from "../validations/permit.schema.js";
import {
  renderCreatePermitForm,
  storePermit,
  getHistoryPermits,
  getIncomingPermits,
  actionApproval,
  editPermit,
  updatePermit,
  cancelPermit,
} from "../controllers/permit.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_DIRECTORATE_ROLES = ["DIREKTUR_UTAMA", "WAKIL_DIREKTUR"];

router.get("/new", renderCreatePermitForm);
router.post("/", uploadFile.single("document"), validate(createPermitSchema), storePermit);
router.get("/me", getHistoryPermits);

router.get("/edit/:id", editPermit);
router.post("/edit/:id", uploadFile.single("document"), validate(createPermitSchema), updatePermit);
router.get("/cancel/:id", cancelPermit);

router.get("/incoming", roleMiddleware(...ALLOWED_DIRECTORATE_ROLES), getIncomingPermits);
router.post("/approval/:id", roleMiddleware(...ALLOWED_DIRECTORATE_ROLES), actionApproval);

export default router;
