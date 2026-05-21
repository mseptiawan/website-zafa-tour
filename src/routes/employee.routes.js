import express from "express";
import {
  formEmployee,
  ajukanPHK,
  renderEditForm,
  updateEmployee,
  createEmployee,
  getAllEmployees,
} from "../controllers/employeeController.js";
import { uploadFile } from "../middlewares/uploadFile.js";
const router = express.Router();

// Route untuk melihat daftar karyawan
router.get("/employee", getAllEmployees);

// Route untuk menampilkan form tambah karyawan
router.get("/employee/create", formEmployee);

// Route untuk memproses data dari form tambah karyawan
router.post("/employee/create", createEmployee);

// Route untuk melihat detail karyawan berdasarkan ID
router.post("/employee/phk", uploadFile.single("document"), ajukanPHK);
// Route untuk menampilkan Form Edit Karyawan (GET)
router.get("/employee/edit/:id", renderEditForm);

// Route untuk memproses aksi Simpan Perubahan Data (POST)
router.post("/employee/edit/:id", updateEmployee);
export default router;
