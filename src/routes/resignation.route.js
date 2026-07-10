import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createResignationSchema } from "../validations/resignation.schema.js";

import {
  renderResignationIndex,
  renderResignationForm,
  storeResignation,
  getMyResignations,
  approveWadir,
  approveFinal,
} from "../controllers/resignation.controller.js";

const router = express.Router();

router.use(authMiddleware);

// Halaman form pengajuan baru
router.get("/new", renderResignationForm);

router.get("/my", getMyResignations);

router.post("/", validate(createResignationSchema), storeResignation);

router.get("/", roleMiddleware("WAKIL_DIREKTUR", "DIREKTUR_UTAMA"), renderResignationIndex);

router.post("/approval-wadir/:id", roleMiddleware("WAKIL_DIREKTUR"), approveWadir);

router.post(
  "/approval-final/:id",
  roleMiddleware("DIREKTUR_UTAMA"),
  uploadFile.single("attachment"),
  approveFinal
);

export default router;
