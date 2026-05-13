import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  formAssignment,
  createAssignment,
  myAssignments,
  allAssignments,
  assignmentDetail,
} from "../controllers/assignmentController.js";

const router = express.Router();

router.get("/assignment/create", authMiddleware, formAssignment);

router.post(
  "/assignment/create",
  authMiddleware,
  uploadFile.single("attachment"),
  roleMiddleware(["PIMPINAN"]),
  createAssignment
);

router.get("/assignment/my", authMiddleware, myAssignments);
router.get("/assignment/all", authMiddleware, allAssignments);

router.get("/assignment/:id", authMiddleware, assignmentDetail);

export default router;
