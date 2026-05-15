import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";

import {
  newForm,
  create,
  myVisits,
  report,
  show,
  edit,
  update,
} from "../controllers/sales.controller.js";

const router = express.Router();

router.use(authMiddleware);

// FORM + CREATE
router.get("/new", newForm);
router.post("/create", uploadFile.array("attachments", 5), create);

// READ
router.get("/my", myVisits);

router.get("/report", roleMiddleware(["HR", "MANAGER", "PIMPINAN"]), report);

router.get("/:id", show);

router.get("/:id/edit", authMiddleware, edit);

router.post("/:id/edit", authMiddleware, uploadFile.array("attachments", 5), update);

export default router;
