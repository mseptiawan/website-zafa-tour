import { createEmployeeSchema } from "../validations/employee.schema.js";
import * as EmployeeService from "../services/employee.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import { sendNewEmployeeEmail } from "../utils/emailHelper.js";
import Employee from "../models/employee/Employee.model.js";
import Position from "../models/basic/Position.model.js";
import Unit from "../models/basic/Unit.model.js";
import Bidang from "../models/basic/Bidang.model.js";
import Role from "../models/basic/Role.model.js";

const handleControllerError = (err, res) => {
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "NIK, Email, atau berkas unik tersebut sudah terdaftar di sistem.",
    });
  }
  return res.status(500).json({
    success: false,
    message: err.message || "Terjadi kesalahan internal server.",
  });
};

export const getAllEmployeesWeb = asyncHandler(async (req, res) => {
  const employees = await EmployeeService.findAllEmployees(req.session.user);
  res.render("employee/index", {
    ...buildRenderData(req, {
      title: "Data Pegawai",
      employees,
    }),
  });
});

export const formEmployeeWeb = asyncHandler(async (req, res) => {
  const currentUserRole = req.session.user.role;
  const { positions, units, bidang, roles } = await EmployeeService.getFormData(currentUserRole);

  res.render("employee/create", {
    ...buildRenderData(req, {
      title: "Tambah Pegawai",
      positions,
      units,
      bidang,
      roles,
    }),
  });
});

export const editEmployeeWeb = asyncHandler(async (req, res) => {
  const [employee, references] = await Promise.all([
    EmployeeService.findEmployeeById(req.params.id),
    EmployeeService.getReferenceData(),
  ]);

  if (!employee) {
    req.flash("error", "Pegawai tidak ditemukan.");
    return res.status(404).render("errors/404", { message: "Pegawai tidak ditemukan" });
  }

  res.render("employee/edit", {
    ...buildRenderData(req, {
      title: "Edit Data Pegawai",
      isMandiri: false,
      employee,
      positions: references.positions,
      units: references.units,
      bidang: references.bidangs,
      roles: references.roles,
    }),
  });
});

export const editProfileMandiriWeb = asyncHandler(async (req, res) => {
  const employeeId = req.session.user.employeeId;
  const employee = await EmployeeService.findEmployeeById(employeeId);

  if (!employee) {
    return res.status(404).render("errors/404", { message: "Pegawai tidak ditemukan" });
  }

  res.render("employee/edit", {
    ...buildRenderData(req, {
      title: "Edit Profil Mandiri",
      employee,
      isMandiri: true,
      positions: [],
      units: [],
      bidang: [],
      roles: [],
    }),
  });
});

export const getEmployeeDetailWeb = asyncHandler(async (req, res) => {
  const employee = await EmployeeService.findEmployeeById(req.params.id);

  if (!employee) {
    return res.status(404).render("errors/404", {
      message: "Data informasi pegawai tidak ditemukan atau sudah dihapus.",
    });
  }

  res.render("employee/detail", {
    ...buildRenderData(req, {
      title: "Profil Detail Pegawai",
      employee,
    }),
  });
});

export const updatePribadiApi = asyncHandler(async (req, res) => {
  try {
    const data = await EmployeeService.updatePribadi(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Data Pribadi Pegawai berhasil disimpan.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
});

export const updateKarirApi = asyncHandler(async (req, res) => {
  try {
    const data = await EmployeeService.updateKarir(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Data Struktur Jabatan & Karir berhasil diperbarui.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
});

export const updateKontakApi = asyncHandler(async (req, res) => {
  try {
    const data = await EmployeeService.updateKontak(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Data Kontak Darurat & Alamat diperbarui.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
});

export const updateDokumenApi = asyncHandler(async (req, res) => {
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
        if (file.fieldname === "file_ktp") fileKtpPath = fileUrl;
        else if (file.fieldname === "file_kk") fileKkPath = fileUrl;
        else if (file.fieldname === "file_skck") fileSkckPath = fileUrl;
        else if (file.fieldname.startsWith("file_sertifikat_")) {
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
    return handleControllerError(err, res);
  }
});

export const updatePendidikanApi = asyncHandler(async (req, res) => {
  try {
    const data = await EmployeeService.updatePendidikan(req.params.id, req.body, req.file);
    return res
      .status(200)
      .json({ success: true, message: "Data Pendidikan Terakhir berhasil disimpan.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
});

export const updateKeluargaApi = asyncHandler(async (req, res) => {
  try {
    const data = await EmployeeService.updateKeluarga(req.params.id, req.body);
    return res
      .status(200)
      .json({ success: true, message: "Susunan Anggota Keluarga berhasil diperbarui.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
});

export const updateFinansialApi = asyncHandler(async (req, res) => {
  try {
    const payload = { ...req.body };
    const userRole = req.session.user.role;

    if (userRole !== "HR" && userRole !== "WAKIL_DIREKTUR") {
      delete payload.basicSalary;
      delete payload.overtimeRate;
    }

    const data = await EmployeeService.updateFinansial(req.params.id, payload);
    return res
      .status(200)
      .json({ success: true, message: "Data Finansial & Akun Payroll berhasil disimpan.", data });
  } catch (err) {
    return handleControllerError(err, res);
  }
});

export const createEmployeeApi = asyncHandler(async (req, res) => {
  try {
    const validatedBody = createEmployeeSchema.parse(req.body);
    const { newEmployee, plainPassword } = await EmployeeService.createNewEmployee(validatedBody);
    const username = validatedBody.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");

    try {
      await sendNewEmployeeEmail(
        validatedBody.email,
        validatedBody.fullName,
        username,
        plainPassword
      );
    } catch (emailErr) {
      console.error("Gagal mengirim email kredensial:", emailErr);
    }

    req.flash("success", `Pegawai baru bernama ${validatedBody.fullName} berhasil ditambahkan!`);
    return res.redirect("/employee");
  } catch (err) {
    let positions = [],
      units = [],
      bidang = [],
      roles = [];
    const currentUserRole = req.session?.user?.role;
    let roleQuery = {};
    if (currentUserRole !== "DIREKTUR_UTAMA") {
      roleQuery = { name: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] } };
    }

    [positions, units, bidang, roles] = await Promise.all([
      Position.find({ name: { $in: ["General Manager", "Pegawai", "Manager"] } }).lean(),
      Unit.find().lean(),
      Bidang.find().lean(),
      Role.find(roleQuery).lean(),
    ]);

    let mappedErrors = {};
    let globalError = null;

    if (err.name === "ZodError") {
      err.errors.forEach((e) => {
        mappedErrors[e.path[0]] = e.message;
      });
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      globalError = `${field === "email" ? "Email" : "NIK"} tersebut sudah terdaftar di sistem.`;
    } else {
      globalError = err.message || "Terjadi kesalahan internal pada server.";
    }

    return res.render("employee/create", {
      ...buildRenderData(req, {
        title: "Tambah Pegawai",
        error: globalError,
        errors: mappedErrors,
        old: req.body,
        positions,
        units,
        bidang,
        roles,
      }),
    });
  }
});

export const ajukanPHKApi = asyncHandler(async (req, res) => {
  if (!req.file) {
    req.flash("error", "Dokumen bukti keputusan PHK wajib diunggah.");
    return res.redirect("back");
  }
  await EmployeeService.createTermination(req.body, req.file.path);
  req.flash("success", "Pengajuan Surat PHK berhasil diterbitkan dan menunggu persetujuan.");
  return res.redirect("/employee");
});

export const uploadAvatarWeb = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Tidak ada file diunggah" });
  }

  const imageUrl = `/uploads/files/${req.file.filename}`;
  const updated = await Employee.findByIdAndUpdate(
    req.params.id,
    { foto_profile: imageUrl },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ success: false, message: "Pegawai tidak ditemukan" });
  }

  if (req.session?.user) {
    req.session.user.foto_profile = imageUrl;
    await new Promise((resolve) => req.session.save(() => resolve()));
  }

  return res.status(200).json({ success: true, imageUrl });
});
