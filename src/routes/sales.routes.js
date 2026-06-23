import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createSalesVisitSchema, updateSalesVisitSchema } from "../validations/sales.schema.js";
import {
  newForm,
  create,
  myVisits,
  report,
  edit,
  exportPdf,
  update,
  employeeVisits,
} from "../controllers/sales.controller.js";

const router = express.Router();

router.use(authMiddleware);

// FORM + CREATE
router.get("/new", newForm);
router.post(
  "/",
  uploadFile.single("attachments"),
  validate(createSalesVisitSchema, "body"),
  create
);

// READ
router.get("/my", myVisits);
router.get("/my/export-pdf", exportPdf);
router.get("/employee-visits", employeeVisits);
router.get("/:id/edit", authMiddleware, edit);

router.post(
  "/:id/edit",
  authMiddleware,
  uploadFile.single("attachments"),
  validate(updateSalesVisitSchema, "body"),
  update
);

export default router;
