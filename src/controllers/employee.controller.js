import { EmployeeService } from "../services/employee.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response.js";

// ==========================================
// WEB CONTROLLERS (Merespons dengan EJS)
// ==========================================

export const getAllEmployeesWeb = async (req, res, next) => {
  try {
    const employees = await EmployeeService.findAllEmployees();
    res.render("employee/index", { title: "Data Pegawai", employees });
  } catch (err) {
    next(err);
  }
};

export const formEmployeeWeb = async (req, res, next) => {
  try {
    const { positions, units, bidang } = await EmployeeService.getFormData();
    res.render("employee/create", { title: "Tambah Pegawai", positions, units, bidang });
  } catch (err) {
    next(err);
  }
};

export const editEmployeeWeb = async (req, res, next) => {
  try {
    const [employee, references] = await Promise.all([
      EmployeeService.findEmployeeById(req.params.id),
      EmployeeService.getReferenceData(),
    ]);

    if (!employee) return next(new AppError("Pegawai tidak ditemukan", 404));

    res.render("employee/detail", {
      title: "Edit Pegawai",
      error: null,
      employee,
      positions: references.positions,
      units: references.units,
      bidang: references.bidangs,
    });
  } catch (err) {
    next(err);
  }
};

export const createEmployeeApi = async (req, res, next) => {
  try {
    const newEmployee = await EmployeeService.createNewEmployee(req.body);
    return res.redirect("/employee");
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
    if (!updated) return next(new AppError("Gagal update, Pegawai tidak ditemukan", 404));

    req.flash("success", "Data Pegawai berhasil diperbarui!");

    return res.redirect("/employee");
  } catch (err) {
    next(err);
  }
};

export const ajukanPHKApi = async (req, res, next) => {
  try {
    if (!req.file) return next(new AppError("Dokumen PHK wajib diunggah", 400));
    await EmployeeService.createTermination(req.body, req.file.path);

    return res.redirect("/employee");
  } catch (err) {
    next(err);
  }
};
