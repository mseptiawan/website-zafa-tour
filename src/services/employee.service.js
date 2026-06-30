import mongoose from "mongoose";
import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.model.js";
import Termination from "../models/Termination.model.js";
import Role from "../models/basic/Role.model.js";
import Position from "../models/basic/Position.model.js";
import Unit from "../models/basic/Unit.model.js";
import Bidang from "../models/basic/Bidang.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import EmployeeDocument from "../models/employee/EmployeeDocument.js";
import bcrypt from "bcrypt";
import notificationService from "./notification.service.js";
import { MODULES, NOTIF_CATEGORIES } from "../config/constants.js";

/**
 * Membuat password acak untuk kredensial karyawan baru.
 * @param {number} [length=12]
 * @returns {string} password murni
 */
const generateRandomPassword = (length = 12) => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Mengambil semua data karyawan dengan integrasi data karir dan status PHK.
 * @param {Object} currentUser - Sesi user yang sedang aktif
 * @returns {Promise<Array<Object>>}
 */
export const findAllEmployees = async (currentUser) => {
  let queryFilter = {};

  if (currentUser?.isManager && currentUser?.bidangId) {
    const matchingCareers = await EmployeeCareer.find({
      bidangId: currentUser.bidangId,
    }).select("employee_id");

    const employeeIds = matchingCareers.map((c) => c.employee_id);
    queryFilter = { _id: { $in: employeeIds } };
  }

  const employeesData = await Employee.find(queryFilter).populate("userId").lean();
  const terminations = await Termination.find({
    status: { $in: ["Waiting", "Approved"] },
  })
    .populate("approvedBy", "username")
    .lean();

  const employeeIds = employeesData.map((e) => e._id);
  const careers = await EmployeeCareer.find({ employee_id: { $in: employeeIds } })
    .populate("bidangId unitId positionId")
    .lean();

  return employeesData.map((emp) => {
    const termInfo = terminations.find((t) => t.employeeId?.toString() === emp._id.toString());
    const careerInfo = careers.find((c) => c.employee_id?.toString() === emp._id.toString());

    if (termInfo) {
      emp.terminationInfo = {
        statusPHK: termInfo.status,
        reason: termInfo.reason,
        approvedBy: termInfo.approvedBy?.username || "System",
        date: new Date(termInfo.updatedAt).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
      };
    }

    emp.careerData = careerInfo || null;
    return emp;
  });
};

/**
 * Memuat data referensi dinamis untuk form pembuatan pegawai.
 * @param {string} currentUserRole
 * @returns {Promise<Object>}
 */
export const getFormData = async (currentUserRole) => {
  let roleQuery = {};
  if (currentUserRole !== "DIREKTUR_UTAMA") {
    roleQuery = { name: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] } };
  }

  const [positions, units, bidang, roles] = await Promise.all([
    Position.find({ name: { $in: ["General Manager", "Pegawai", "Manager"] } }).lean(),
    Unit.find().lean(),
    Bidang.find().lean(),
    Role.find(roleQuery).lean(),
  ]);

  return { positions, units, bidang, roles };
};

/**
 * Mendaftarkan akun user dan profil karyawan terpadu baru (Atomic Transaction Simulation).
 * @param {Object} data - Payload dari Joi/Zod Validator
 * @returns {Promise<Object>} Objek berisi data karyawan baru dan password murni
 */
export const createNewEmployee = async (data) => {
  const username = data.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const plainPassword = generateRandomPassword(12);
  const password = await bcrypt.hash(plainPassword, 10);

  let createdUser = null;
  let createdEmployee = null;

  try {
    createdUser = await User.create({
      username,
      password,
      email: data.email,
      roleId: data.roleId,
    });

    createdEmployee = await Employee.create({
      userId: createdUser._id,
      employeeIdNumber: data.nomor_ktp,
      fullName: data.fullName,
      nomor_ktp: data.nomor_ktp,
      jenis_kelamin: data.jenis_kelamin,
      agama: data.agama,
      contactData: {},
      educationData: { tahun_kelulusan: 0 },
      financialData: { basicSalary: 0, overtimeRate: 0 },
      familyData: [],
    });

    await EmployeeCareer.create({
      employee_id: createdEmployee._id,
      positionId: data.positionId,
      unitId: data.unitId,
      bidangId: data.bidangId,
      status_pegawai: data.status_pegawai,
      tanggal_mulai_bergabung: new Date(data.tanggal_mulai_bergabung),
      tanggal_berakhir_kontrak: data.tanggal_berakhir_kontrak
        ? new Date(data.tanggal_berakhir_kontrak)
        : null,
    });

    await EmployeeDocument.create({ employee_id: createdEmployee._id });

    return { newEmployee: createdEmployee, plainPassword };
  } catch (error) {
    console.error("[ROLLBACK] Gagal menyimpan data, memulai pembersihan database...");
    if (createdEmployee) {
      await Promise.all([
        Employee.findByIdAndDelete(createdEmployee._id),
        EmployeeCareer.deleteOne({ employee_id: createdEmployee._id }),
        EmployeeDocument.deleteOne({ employee_id: createdEmployee._id }),
      ]);
    }
    if (createdUser) await User.findByIdAndDelete(createdUser._id);
    throw error;
  }
};

/**
 * Mencari rincian informasi satu pegawai secara mendalam berdasarkan ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export const findEmployeeById = async (id) => {
  const employee = await Employee.findById(id).populate("userId").lean();
  if (!employee) return null;

  const [career, document] = await Promise.all([
    EmployeeCareer.findOne({ employee_id: id }).populate("positionId unitId bidangId").lean(),
    EmployeeDocument.findOne({ employee_id: id }).lean(),
  ]);

  employee.careerData = career || null;
  employee.documentData = document || null;

  return employee;
};

/**
 * Memuat semua referensi master data untuk proses editing.
 */
export const getReferenceData = async () => {
  const [positions, units, bidangs, roles] = await Promise.all([
    Position.find().lean(),
    Unit.find().lean(),
    Bidang.find().lean(),
    Role.find().lean(),
  ]);
  return { positions, units, bidangs, roles };
};

export const createTermination = async (data, filePath) => {
  const newTermination = new Termination({
    employeeId: data.employeeId,
    reason: data.reason,
    documentPath: filePath,
    status: "Waiting",
  });
  return await newTermination.save();
};

export const updatePribadi = async (id, data) => {
  return await Employee.findByIdAndUpdate(
    id,
    {
      fullName: data.fullName,
      nomor_ktp: data.nomor_ktp,
      employeeIdNumber: data.nomor_ktp,
      tempat_lahir: data.tempat_lahir,
      tanggal_lahir: data.tanggal_lahir ? new Date(data.tanggal_lahir) : null,
      jenis_kelamin: data.jenis_kelamin,
      agama: data.agama,
      golongan_darah: data.golongan_darah,
      status_pernikahan: data.status_pernikahan,
    },
    { new: true }
  );
};

export const updateKarir = async (id, data) => {
  const employee = await Employee.findById(id).select("userId").lean();
  const updatePromises = [
    EmployeeCareer.findOneAndUpdate(
      { employee_id: id },
      {
        positionId: data.positionId,
        bidangId: data.bidangId,
        unitId: data.unitId,
        status_pegawai: data.status_pegawai,
        tanggal_mulai_bergabung: new Date(data.tanggal_mulai_bergabung),
        tanggal_berakhir_kontrak: data.tanggal_berakhir_kontrak
          ? new Date(data.tanggal_berakhir_kontrak)
          : null,
      },
      { new: true, upsert: true }
    ),
  ];

  if (employee?.userId) {
    updatePromises.push(
      User.findByIdAndUpdate(employee.userId, { status: data.status || "Active" }, { new: true })
    );
  }

  const [careerUpdate, userUpdate] = await Promise.all(updatePromises);
  return { career: careerUpdate, user: userUpdate };
};

/**
 * Mengupdate data kontak langsung ke field embedded contactData di Employee
 */
export const updateKontak = async (id, data) => {
  return await Employee.findByIdAndUpdate(
    id,
    {
      $set: {
        "contactData.nomor_telp": data.nomor_telp,
        "contactData.alamat": data.alamat,
        "contactData.nama_kontak_darurat": data.nama_kontak_darurat,
        "contactData.hubungan_kontak_darurat": data.hubungan_kontak_darurat,
        "contactData.nomor_kontak_darurat": data.nomor_kontak_darurat,
      },
    },
    { new: true }
  );
};

export const updateDokumen = async (id, data) => {
  const updateFields = {
    sertifikat_kompetensi: data.sertifikat_kompetensi || [],
  };

  if (data.tanggal_kadaluarsa_skck) {
    updateFields.tanggal_kadaluarsa_skck = new Date(data.tanggal_kadaluarsa_skck);
  }

  if (data.file_ktp) updateFields.file_ktp = data.file_ktp;
  if (data.file_kk) updateFields.file_kk = data.file_kk;
  if (data.file_skck) updateFields.file_skck = data.file_skck;

  return await EmployeeDocument.findOneAndUpdate(
    { employee_id: id },
    { $set: updateFields, $setOnInsert: { employee_id: id } },
    { new: true, upsert: true }
  );
};

/**
 * Mengupdate data pendidikan langsung ke field embedded educationData di Employee
 */
export const updatePendidikan = async (id, data, file) => {
  const updateData = {
    "educationData.pendidikan_terakhir": data.pendidikan_terakhir,
    "educationData.institusi_pendidikan": data.institusi_pendidikan,
    "educationData.tahun_kelulusan": data.tahun_kelulusan ? Number(data.tahun_kelulusan) : null,
    "educationData.jurusan": data.jurusan,
  };

  if (file) {
    updateData["educationData.file_ijazah"] = `/uploads/files/${file.filename}`;
  }

  return await Employee.findByIdAndUpdate(id, { $set: updateData }, { new: true });
};

/**
 * Mengupdate susunan keluarga langsung ke field embedded familyData di Employee
 */
export const updateKeluarga = async (id, data) => {
  const listKeluarga = data.anggota_keluarga || [];

  const formattedFamily = listKeluarga.map((m) => ({
    nama: m.nama,
    hubungan: m.hubungan,
    nik: m.nik || "-",
    tanggal_lahir: m.tanggal_lahir ? new Date(m.tanggal_lahir) : null,
    jenis_kelamin: m.jenis_kelamin || null,
    pekerjaan: m.pekerjaan || "-",
    status_tanggungan: m.status_tanggungan === "true" || m.status_tanggungan === true,
  }));

  return await Employee.findByIdAndUpdate(
    id,
    { $set: { familyData: formattedFamily } },
    { new: true, runValidators: true }
  );
};

/**
 * Mengupdate data finansial & payroll langsung ke field embedded financialData di Employee
 */
export const updateFinansial = async (id, data) => {
  const updateData = {
    "financialData.nama_bank": data.nama_bank,
    "financialData.nomor_rekening": data.nomor_rekening,
    "financialData.nama_pemilik_rekening": data.nama_pemilik_rekening,
    "financialData.npwp": data.npwp,
    "financialData.bpjstk": data.bpjstk,
    "financialData.overtimeRate": data.overtimeRate ?? 0,
  };

  if (data.basicSalary !== undefined) {
    updateData["financialData.basicSalary"] = data.basicSalary ?? 0;
  }

  return await Employee.findByIdAndUpdate(id, { $set: updateData }, { new: true });
};
