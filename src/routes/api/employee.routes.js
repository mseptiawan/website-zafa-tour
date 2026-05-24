import express from "express";
import {
  createEmployeeApi,
  ajukanPHKApi,
  updateEmployeeApi,
} from "../../controllers/employee.controller.js";
import { uploadFile } from "../../middlewares/uploadFile.js";

const router = express.Router();
router.post("/create", createEmployeeApi);
router.post("/phk", uploadFile.single("document"), ajukanPHKApi);
router.post("/edit/:id", updateEmployeeApi);
export default router;
