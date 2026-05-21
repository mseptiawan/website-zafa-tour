import express from "express";
import {
  listEmployee,
  formEmployee,
  ajukanPHK,
  createEmployee,
  detailEmployee,
} from "../controllers/employeeController.js";
import { uploadFile } from "../middlewares/uploadFile.js";
const router = express.Router();

// Route untuk melihat daftar karyawan
router.get("/employee", listEmployee);

// Route untuk menampilkan form tambah karyawan
router.get("/employee/create", formEmployee);

// Route untuk memproses data dari form tambah karyawan
router.post("/employee/create", createEmployee);

// Route untuk melihat detail karyawan berdasarkan ID
router.get("/employee/detail/:id", detailEmployee);
router.post("/employee/phk", uploadFile.single("document"), ajukanPHK);

export default router;
