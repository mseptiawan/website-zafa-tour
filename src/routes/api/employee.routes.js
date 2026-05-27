import express from "express";
import {
  createEmployeeApi,
  ajukanPHKApi,
  updateEmployeeApi,
} from "../../controllers/employee.controller.js";
import { uploadFile } from "../../middlewares/uploadFile.js";

const router = express.Router();
router.post(
  "/create",
  uploadFile.fields([
    { name: "file_ktp", maxCount: 1 },
    { name: "file_kk", maxCount: 1 },
  ]),
  createEmployeeApi
);
router.post("/phk", uploadFile.single("document"), ajukanPHKApi);
router.post(
  "/edit/:id",
  uploadFile.fields([
    { name: "file_ktp", maxCount: 1 },
    { name: "file_kk", maxCount: 1 },
  ]),
  updateEmployeeApi
);

export default router;
