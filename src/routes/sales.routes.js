import express from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import { uploadFile } from "../middlewares/uploadFile.js";
import { validate } from "../middlewares/validate.js";
import { createSalesVisitSchema, updateSalesVisitSchema } from "../validations/sales.schema.js";
import {
  create,
  store,
  my,
  edit,
  exportPdf,
  update,
  employeeVisits,
} from "../controllers/sales.controller.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/new", create);
router.post("/", uploadFile.single("attachments"), validate(createSalesVisitSchema), store);

router.get("/my", my);
router.get("/my/export-pdf", exportPdf);
router.get("/employee-visits", employeeVisits);
router.get("/:id/edit", edit);

router.post(
  "/:id/edit",
  uploadFile.single("attachments"),
  validate(updateSalesVisitSchema),
  update
);

export default router;
