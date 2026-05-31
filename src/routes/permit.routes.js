import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { createPermitSchema } from "../validations/permit.schema.js";
import { validate } from "../middlewares/validate.js";

import {
  newForm,
  createPermit,
  getIncomingPermits,
  actionApproval,
  getHistoryPermits,
} from "../controllers/permit.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", newForm);
router.post("/", uploadFile.single("document"), validate(createPermitSchema), createPermit);
router.get("/history", getHistoryPermits);
router.get("/incoming", getIncomingPermits);
router.post("/approval/:id", actionApproval);
export default router;
