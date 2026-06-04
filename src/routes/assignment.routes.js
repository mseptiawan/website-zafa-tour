import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  newForm,
  create,
  myAssignments,
  index,
  show,
} from "../controllers/assignment.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get(
  "/",
  roleMiddleware(
    "DIREKTUR_UTAMA",
    "MANAGER_ADMINISTRASI",
    "MANAGER_HAJI_UMRAH",
    "MANAGER_KEUANGAN",
    "WAKIL_DIREKTUR"
  ),
  index
);

router.get("/new", newForm);

router.post(
  "/",
  roleMiddleware([
    "DIREKTUR_UTAMA",
    "MANAGER_ADMINISTRASI",
    "MANAGER_HAJI_UMRAH",
    "MANAGER_KEUANGAN",
    "WAKIL_DIREKTUR",
  ]),
  uploadFile.single("attachment"),
  create
);

router.get("/my", myAssignments);

router.get("/:id", show);

export default router;
