import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.v2.js";
import { createAssignmentSchema } from "../validations/assignment.schema.js";

import {
  getAllAssignments,
  renderCreateAssignmentForm,
  storeAssignment,
  getMyAssignments,
  getAssignmentById,
} from "../controllers/assignment.controller.js";

const router = express.Router();

router.use(authMiddleware);

const ALLOWED_MANAGEMENT_ROLES = [
  "DIREKTUR_UTAMA",
  "WAKIL_DIREKTUR",
  "MANAGER_ADMINISTRASI",
  "MANAGER_HAJI_UMRAH",
  "MANAGER_KEUANGAN",
];

router.get("/", roleMiddleware(...ALLOWED_MANAGEMENT_ROLES), getAllAssignments);

router.get("/new", roleMiddleware(...ALLOWED_MANAGEMENT_ROLES), renderCreateAssignmentForm);

router.get("/me", getMyAssignments);

router.post(
  "/",
  roleMiddleware(...ALLOWED_MANAGEMENT_ROLES),
  uploadFile.single("attachment"),
  validate(createAssignmentSchema),
  storeAssignment
);

router.get("/:id", getAssignmentById);

export default router;
