import { createEmployeeSchema } from "../validations/employee.schema.js";
import { updateEmployeeSchema } from "../validations/employeeUpdate.schema.js";
import { EmployeeService } from "../services/employee.service.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response.js";
import Role from "../models/basic/Role.model.js";
import { sendNewEmployeeEmail } from "../utils/emailHelper.js";
import Position from "../models/basic/Position.model.js";
import Unit from "../models/basic/Unit.model.js";
import Bidang from "../models/basic/Bidang.model.js";
import Employee from "../models/employee/Employee.model.js";
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
      isMandiri: false,
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

export const editProfileMandiriWeb = async (req, res, next) => {
  try {
    // Ambil ID pegawai dari sesi login yang sedang aktif
    const employeeId = req.session.user.employeeId;

    const employee = await EmployeeService.findEmployeeById(employeeId);
    if (!employee)
      return res.status(404).render("errors/404", { message: "Pegawai tidak ditemukan" });

    res.render("employee/edit", {
      title: "Edit Profil Mandiri",
      employee,
      isMandiri: true, // FLAG UTAMA UNTUK EJS
      error: null,
      errors: {},
      old: null,
      // Kirim array kosong karena tab karir akan disembunyikan
      positions: [],
      units: [],
      bidang: [],
      roles: [],
    });
  } catch (err) {
    next(err);
  }
};

export const getEmployeeDetailWeb = async (req, res, next) => {
  try {
    // Tarik data pegawai komplit berdasarkan ID dari parameter URL
    const employee = await EmployeeService.findEmployeeById(req.params.id);

    // Jika objek pegawai tidak ditemukan di database
    if (!employee) {
      return res.status(404).render("errors/404", {
        message: "Data informasi pegawai tidak ditemukan atau sudah dihapus.",
      });
    }
    console.log("=== BENTUK DATA SALARY ===");
    console.log(employee.salaryDetail);
    // Render ke file EJS detail terpisah (bukan file edit)
    res.render("employee/detail", {
      title: "Profil Detail Pegawai",
      employee,
      user: req.user,
      error: null,
      user: req.session?.user || req.user, // Sesuaikan dengan session login lo untuk verifikasi role di UI
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
    const payload = { ...req.body };
    const userRole = req.session.user.role; // Ambil role dari sesi
    console.log("=== CCTV 1: req.body DARI FORM ===", req.body);
    // Jika yang mengedit BUKAN HR / Wakil Direktur, hapus payload gaji!
    if (userRole !== "HR" && userRole !== "WAKIL_DIREKTUR") {
      delete payload.basicSalary;
      delete payload.overtimeRate;
      delete payload.effectiveDate;
    }

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

    // 1. Simpan ke database
    const newEmployee = await EmployeeService.createNewEmployee(validatedBody);

    // 2. Generate username untuk email (sama dengan logika di service)
    const username = validatedBody.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // 3. Kirim Email (Gunakan await agar kita tahu jika gagal kirim)
    try {
      await sendNewEmployeeEmail(validatedBody.email, validatedBody.fullName, username);
      console.log("Email kredensial berhasil dikirim ke:", validatedBody.email);
    } catch (emailErr) {
      // Kita log saja jika email gagal, tapi jangan sampai membatalkan proses pendaftaran
      console.error("Gagal mengirim email kredensial:", emailErr);
    }

    // 4. Redirect sukses
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
export const uploadAvatarWeb = async (req, res) => {
  try {
    const employeeId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Tidak ada file diunggah" });
    }

    // Path yang disimpan
    const imageUrl = `/uploads/files/${req.file.filename}`;

    // Update ke database
    const updated = await Employee.findByIdAndUpdate(
      employeeId,
      { foto_profile: imageUrl },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Pegawai tidak ditemukan" });
    }

    // --- UPDATE SESI SECARA MANUAL ---
    // Memastikan data di sesi (sidebar) sinkron dengan database
    if (req.session && req.session.user) {
      req.session.user.foto_profile = imageUrl;

      // Simpan perubahan sesi ke store (khusus jika menggunakan store eksternal/DB)
      req.session.save((err) => {
        if (err) {
          console.error("Gagal menyimpan sesi:", err);
        }
      });
    }

    return res.status(200).json({ success: true, imageUrl });
  } catch (err) {
    console.error("ERROR UPLOAD:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
