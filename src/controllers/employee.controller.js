import { EmployeeService } from "../services/employee.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response.js";

// ==========================================
// WEB CONTROLLERS (Merespons dengan EJS)
// ==========================================

export const getAllEmployeesWeb = async (req, res, next) => {
  try {
    const employees = await EmployeeService.findAllEmployees();
    res.render("employee/index", { title: "Data Karyawan", employees });
  } catch (err) {
    next(err);
  }
};

export const formEmployeeWeb = async (req, res, next) => {
  try {
    const { positions, units, bidang } = await EmployeeService.getFormData();
    res.render("employee/create", { title: "Tambah Karyawan", positions, units, bidang });
  } catch (err) {
    next(err);
  }
};

export const detailEmployeeWeb = async (req, res, next) => {
  try {
    const employee = await EmployeeService.findEmployeeById(req.params.id);
    if (!employee) return next(new AppError("Karyawan tidak ditemukan", 404));
    res.render("employee/detail", { title: "Detail Karyawan", employee });
  } catch (err) {
    next(err);
  }
};

// ==========================================
// API CONTROLLERS (Merespons dengan JSON)
// ==========================================

export const createEmployeeApi = async (req, res, next) => {
  try {
    const newEmployee = await EmployeeService.createNewEmployee(req.body);
    return successResponse(res, "Karyawan baru berhasil ditambahkan", newEmployee, 201);
  } catch (err) {
    next(err);
  }
};

export const updateEmployeeApi = async (req, res, next) => {
  try {
    const updated = await EmployeeService.updateEmployeeById(
      req.params.id,
      req.body,
      req.file?.filename
    );
    if (!updated) return next(new AppError("Gagal update, karyawan tidak ditemukan", 404));
    return successResponse(res, "Data karyawan berhasil diperbarui", updated);
  } catch (err) {
    next(err);
  }
};

export const ajukanPHKApi = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError("Dokumen PHK wajib diunggah", 400));
    await EmployeeService.createTermination(req.body, req.file.path);
    return successResponse(res, "Pengajuan PHK berhasil diproses");
  } catch (err) {
    next(err);
  }
};
