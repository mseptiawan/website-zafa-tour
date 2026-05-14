import express from "express";

import authMiddleware from "../middlewares/authMiddleware.js";

import roleMiddleware from "../middlewares/roleMiddleware.js";

import { uploadFile } from "../middlewares/uploadFile.js";

import { validate } from "../middlewares/validate.js";

import {
  newForm,
  create,
  myAssignments,
  index,
  show,
} from "../controllers/assignment.controller.js";

import { createAssignmentSchema } from "../validations/assignment/assignment.schema.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", index);

router.get("/new", newForm);

router.post(
  "/",

  roleMiddleware(["PIMPINAN"]),

  uploadFile.single("attachment"),

  validate(createAssignmentSchema),

  create
);

router.get("/my", myAssignments);

router.get("/:id", show);

export default router;
