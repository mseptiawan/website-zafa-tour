import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import roleMiddleware from "../middlewares/roleMiddleware.js";

import { uploadFile } from "../middlewares/uploadFile.js";

import { validate } from "../middlewares/validate.js";

import {
  formAssignment,
  createAssignment,
  myAssignments,
  allAssignments,
  assignmentDetail,
} from "../controllers/assignment.controller.js";

import { createAssignmentSchema } from "../validations/assignment/assignment.schema.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/create", formAssignment);

router.post(
  "/create",

  roleMiddleware(["PIMPINAN"]),

  uploadFile.single("attachment"),

  validate(createAssignmentSchema),

  createAssignment
);

router.get("/my", myAssignments);

router.get("/all", allAssignments);

router.get("/:id", assignmentDetail);

export default router;
