import { createEmployeeSchema } from "../validations/employee.schema.js";
import { updateEmployeeSchema } from "../validations/employeeUpdate.schema.js";
import { EmployeeService } from "../services/employee.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response.js";
import Role from "../models/basic/Role.model.js";
import Position from "../models/basic/Position.model.js";
import Unit from "../models/basic/Unit.model.js";
import Bidang from "../models/basic/Bidang.model.js";
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
    const currentUserRole = req.session.user.role;
    const { positions, units, bidang, roles } = await EmployeeService.getFormData(currentUserRole);

    res.render("employee/create", {
      title: "Tambah Pegawai",
      error: null,
      positions,
      units,
      bidang,
      roles,
    });
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

    if (!employee)
      return res.status(404).render("errors/404", { message: "Pegawai tidak ditemukan" });

    res.render("employee/edit", {
      title: "Edit Data Pegawai",
      error: null,
      errors: {},
      old: null,
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

const handleControllerError = (err, res) => {
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "NIK atau berkas unik tersebut sudah terdaftar di sistem.",
    });
  }
  return res
    .status(500)
    .json({ success: false, message: err.message || "Terjadi kesalahan internal server." });
};

export const updatePribadiApi = async (req, res) => {
  try {
    const data = await EmployeeService.updatePribadi(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Data Pribadi Pegawai berhasil disimpan.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
};

export const updateKarirApi = async (req, res) => {
  try {
    const data = await EmployeeService.updateKarir(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Data Struktur Jabatan & Karir berhasil diperbarui.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
};

export const updateKontakApi = async (req, res) => {
  try {
    const data = await EmployeeService.updateKontak(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Data Kontak Darurat & Alamat diperbarui.",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memperbarui data kontak.",
    });
  }
};
export const updateDokumenApi = async (req, res) => {
  console.log("BODY:", req.body);
  console.log("FILES:", req.files);
  try {
    const { id } = req.params;
    const bodyData = { ...req.body };

    let fileKtpPath = null;
    let fileKkPath = null;
    let fileSkckPath = null;
    const certFilesMap = {};

    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        const fileUrl = `/uploads/files/${file.filename}`;

        if (file.fieldname === "file_ktp") {
          fileKtpPath = fileUrl;
        } else if (file.fieldname === "file_kk") {
          fileKkPath = fileUrl;
        } else if (file.fieldname === "file_skck") {
          fileSkckPath = fileUrl;
        } else if (file.fieldname.startsWith("file_sertifikat_")) {
          const index = file.fieldname.split("_")[2];
          certFilesMap[index] = fileUrl;
        }
      });
    }

    const rawSertifikat = bodyData.sertifikat_kompetensi || [];

    const formattedSertifikat = rawSertifikat.map((cert, idx) => ({
      nama_sertifikat: cert.nama_sertifikat || "",
      penerbit: cert.penerbit || "",
      nomor_sertifikat: cert.nomor_sertifikat || "",
      tanggal_terbit: cert.tanggal_terbit ? new Date(cert.tanggal_terbit) : null,
      tanggal_kadaluarsa: cert.tanggal_kadaluarsa ? new Date(cert.tanggal_kadaluarsa) : null,
      file_sertifikat: certFilesMap[idx] || cert.file_sertifikat_old || "",
    }));

    const payload = {
      tanggal_kadaluarsa_skck: bodyData.tanggal_kadaluarsa_skck,
      file_ktp: fileKtpPath,
      file_kk: fileKkPath,
      file_skck: fileSkckPath,
      sertifikat_kompetensi: formattedSertifikat,
    };

    const updatedDoc = await EmployeeService.updateDokumen(id, payload);

    return res.status(200).json({
      success: true,
      message: "Seluruh berkas legalitas dan sertifikat kompetensi berhasil diperbarui.",
      data: updatedDoc,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message || "Gagal memperbarui tab dokumen.",
    });
  }
};

export const updatePendidikanApi = async (req, res) => {
  console.log(req.body);
  console.log(req.file);

  try {
    const data = await EmployeeService.updatePendidikan(req.params.id, req.body, req.file);

    return res.status(200).json({
      success: true,
      message: "Data Pendidikan Terakhir berhasil disimpan.",
      data,
    });
  } catch (err) {
    return handleControllerError(err, res);
  }
};
export const updateKeluargaApi = async (req, res) => {
  try {
    const data = await EmployeeService.updateKeluarga(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Susunan Anggota Keluarga berhasil diperbarui.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
};
export const updateFinansialApi = async (req, res) => {
  try {
    const data = await EmployeeService.updateFinansial(req.params.id, req.body);

    return res
      .status(200)
      .json({ success: true, message: "Data Finansial & Akun Payroll berhasil disimpan.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
};

export const createEmployeeApi = async (req, res, next) => {
  try {
    const validatedBody = createEmployeeSchema.parse(req.body);

    await EmployeeService.createNewEmployee(validatedBody);

    return res.redirect("/employee");
  } catch (err) {
    let positions = [],
      units = [],
      bidang = [],
      roles = [];
    try {
      const currentUserRole = req.session?.user?.role;
      let roleQuery = {};
      if (currentUserRole !== "DIREKTUR_UTAMA") {
        roleQuery = { name: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] } };
      }

      [positions, units, bidang, roles] = await Promise.all([
        Position.find({ name: { $in: ["General Manager", "Pegawai", "Manager"] } }),
        Unit.find().lean(),
        Bidang.find().lean(),
        Role.find(roleQuery),
      ]);
    } catch (dbErr) {
      console.error("Gagal memuat ulang database resource:", dbErr);
    }

    let mappedErrors = {};
    let globalError = null;

    if (err.name === "ZodError") {
      err.errors.forEach((e) => {
        const fieldName = e.path[0];
        mappedErrors[fieldName] = e.message;
      });
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      globalError = `${field === "email" ? "Email" : "NIK"} tersebut sudah terdaftar di sistem.`;
    } else {
      globalError = err.message || "Terjadi kesalahan internal pada server.";
    }

    return res.render("employee/create", {
      title: "Tambah Pegawai",
      error: globalError,
      errors: mappedErrors,
      old: req.body,
      positions,
      units,
      bidang,
      roles,
    });
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
