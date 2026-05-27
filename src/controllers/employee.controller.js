import { createEmployeeSchema } from "../validations/employeeValidation.js";
import { EmployeeService } from "../services/employee.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response.js";
import Role from "../models/basic/Role.js";
import Position from "../models/basic/Position.js";
import Unit from "../models/basic/Unit.js";
import Bidang from "../models/basic/Bidang.js";
import path from "path";

export const getAllEmployeesWeb = async (req, res, next) => {
  try {
    const employees = await EmployeeService.findAllEmployees();
    res.render("employee/index", {
      title: "Data Pegawai",
      employees,
      error: null,
      old: null,
    });
  } catch (err) {
    next(err);
  }
};

export const formEmployeeWeb = async (req, res, next) => {
  try {
    const { positions, units, bidang, roles } = await EmployeeService.getFormData();
    res.render("employee/create", { title: "Tambah Pegawai", positions, units, bidang, roles });
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

    res.render("employee/edit", {
      title: "Edit Data Pegawai",
      error: null,
      old: null,
      employees: [],
      employee,
      positions: references.positions,
      units: references.units,
      bidang: references.bidangs,
      roles: references.roles,
    });
  } catch (err) {
    next(err);
  }
};

export const createEmployeeApi = async (req, res, next) => {
  try {
    // 1. Validasi data form menggunakan Zod
    const validatedBody = createEmployeeSchema.parse(req.body);

    // 2. Mapping data file upload jika validasi berhasil
    const fileData = {
      file_ktp:
        req.files && req.files.file_ktp
          ? `/uploads/files/${path.basename(req.files.file_ktp[0].path)}`
          : null,
      file_kk:
        req.files && req.files.file_kk
          ? `/uploads/files/${path.basename(req.files.file_kk[0].path)}`
          : null,
    };

    // 3. Kirim data ke Service
    const newEmployee = await EmployeeService.createNewEmployee(validatedBody, fileData);

    return res.redirect("/employee");
  } catch (err) {
    let positions = [],
      units = [],
      bidang = [],
      roles = [];
    try {
      [positions, units, bidang, roles] = await Promise.all([
        Position.find(),
        Unit.find(),
        Bidang.find(),
        Role.find(),
      ]);
    } catch (dbErr) {
      console.error("Database Error:", dbErr);
    }

    // Tempat menyimpan pesan error per field
    let mappedErrors = {};

    // Jika error dari Zod, petakan berdasarkan nama field-nya
    if (err.name === "ZodError" || err.errors) {
      err.errors.forEach((e) => {
        const fieldName = e.path[0]; // mengambil nama field, contoh: 'fullName'
        mappedErrors[fieldName] = e.message; // set pesan errornya
      });
    } else {
      // Jika error dari database/system global biasa
      mappedErrors["global"] = err.message;
    }

    return res.render("employee/create", {
      title: "Tambah Pegawai",
      error: mappedErrors.global || null, // Error global jika ada
      errors: mappedErrors, // Objek error per field (*PENTING*)
      old: req.body,
      employees: [],
      positions,
      units,
      bidang,
      roles,
    });
  }
};
export const updateEmployeeApi = async (req, res, next) => {
  try {
    const updated = await EmployeeService.updateEmployeeById(req.params.id, req.body, req.files);

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
