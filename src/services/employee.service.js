import mongoose from "mongoose";
import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.model.js";
import Termination from "../models/Termination.model.js";
import Role from "../models/basic/Role.model.js";
import Position from "../models/basic/Position.model.js";
import Unit from "../models/basic/Unit.model.js";
import Bidang from "../models/basic/Bidang.model.js";
import EmployeeCareer from "../models/employee/EmployeeCareer.js";
import EmployeeFinancial from "../models/employee/EmployeeFinancial.js";
import EmployeeDocument from "../models/employee/EmployeeDocument.js";
import EmployeeFamily from "../models/employee/EmployeeFamily.model.js";
import EmployeeContact from "../models/employee/EmployeeContact.js";
import EmployeeEducation from "../models/employee/EmployeeEducation.js";
import bcrypt from "bcrypt";

export const EmployeeService = {
  findAllEmployees: async () => {
    const employeesData = await Employee.find()
      .populate("userId")
      .populate({
        path: "careerData",
        populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
      });

    const approvedTerminations = await Termination.find({ status: "Approved" }).populate(
      "approvedBy",
      "username"
    );

    return employeesData.map((emp) => {
      const empObj = emp.toObject();
      const termInfo = approvedTerminations.find(
        (t) => t.employeeId?.toString() === emp._id.toString()
      );

      if (termInfo) {
        empObj.terminationInfo = {
          reason: termInfo.reason,
          approvedBy: termInfo.approvedBy?.username || "System",
          date: new Date(termInfo.updatedAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        };
      }
      return empObj;
    });
  },

  getFormData: async (currentUserRole) => {
    let roleQuery = {};

    if (currentUserRole !== "DIREKTUR_UTAMA") {
      roleQuery = { name: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] } };
    }

    const [positions, units, bidang, roles] = await Promise.all([
      Position.find(),
      Unit.find(),
      Bidang.find(),
      Role.find(roleQuery),
    ]);

    return { positions, units, bidang, roles };
  },
  createNewEmployee: async (data) => {
    const username = data.fullName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const password = await bcrypt.hash("zafasecret", 10);

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
      });

      await EmployeeCareer.create({
        employee_id: createdEmployee._id,
        positionId: data.positionId,
        unitId: data.unitId,
        bidangId: data.bidangId,
        status_pegawai: data.status_pegawai,
        tanggal_mulai_bergabung: new Date(data.tanggal_mulai_bergabung),
      });

      await Promise.all([
        EmployeeContact.create({ employee_id: createdEmployee._id }),
        EmployeeEducation.create({ employee_id: createdEmployee._id, tahun_kelulusan: 0 }),
        EmployeeFinancial.create({ employee_id: createdEmployee._id }),
        EmployeeDocument.create({ employee_id: createdEmployee._id }),
      ]);

      return createdEmployee;
    } catch (error) {
      console.log("[ROLLBACK] Gagal menyimpan data, memulai pembersihan database...");

      if (createdEmployee) {
        await Promise.all([
          Employee.findByIdAndDelete(createdEmployee._id),
          EmployeeCareer.deleteOne({ employee_id: createdEmployee._id }),
          EmployeeContact.deleteOne({ employee_id: createdEmployee._id }),
          EmployeeEducation.deleteOne({ employee_id: createdEmployee._id }),
          EmployeeFinancial.deleteOne({ employee_id: createdEmployee._id }),
          EmployeeDocument.deleteOne({ employee_id: createdEmployee._id }),
        ]);
      }

      if (createdUser) {
        await User.findByIdAndDelete(createdUser._id);
      }

      throw error;
    }
  },

  findEmployeeById: async (id) => {
    return await Employee.findById(id)
      .populate("userId")
      .populate("careerData")
      .populate("contactData")
      .populate("educationData")
      .populate("financialData")
      .populate("documentData")
      .populate("familyData");
  },

  getReferenceData: async () => {
    const [positions, units, bidangs, roles] = await Promise.all([
      Position.find(),
      Unit.find(),
      Bidang.find(),
      Role.find(),
    ]);
    return { positions, units, bidangs, roles };
  },

  createTermination: async (data, filePath) => {
    const newTermination = new Termination({
      employeeId: data.employeeId,
      reason: data.reason,
      documentPath: filePath,
      status: "Waiting",
    });
    return await newTermination.save();
  },

  updateEmployeeById: async (id, data, files) => {
    const employee = await Employee.findByIdAndUpdate(
      id,
      {
        fullName: data.fullName,
        tempat_lahir: data.tempat_lahir,
        tanggal_lahir: data.tanggal_lahir ? new Date(data.tanggal_lahir) : null,
        jenis_kelamin: data.jenis_kelamin,
        agama: data.agama,
        golongan_darah: data.golongan_darah,
        status_pernikahan: data.status_pernikahan,
      },
      { new: true, runValidators: true }
    );

    if (!employee) return null;

    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { roleId: data.roleId });
    }

    // 1. Pembaruan Data Karir Kedinasan (Membaca objek careerData)
    await EmployeeCareer.findOneAndUpdate(
      { employee_id: id },
      {
        positionId: data.careerData?.positionId,
        unitId: data.careerData?.unitId,
        bidangId: data.careerData?.bidangId,
        status_pegawai: data.careerData?.status_pegawai,
        tanggal_mulai_bergabung: data.careerData?.tanggal_mulai_bergabung
          ? new Date(data.careerData.tanggal_mulai_bergabung)
          : null,
        tanggal_berakhir_kontrak: data.careerData?.tanggal_berakhir_kontrak
          ? new Date(data.careerData.tanggal_berakhir_kontrak)
          : null,
      },
      { upsert: true }
    );

    // 2. Pembaruan Data Kontak & Rumah (Membaca objek contactData) -> SOLUSI UTAMA NYA DI SINI
    await EmployeeContact.findOneAndUpdate(
      { employee_id: id },
      {
        nomor_telp: data.contactData?.nomor_telp,
        alamat: data.contactData?.alamat,
        nama_kontak_darurat: data.contactData?.nama_kontak_darurat,
        hubungan_kontak_darurat: data.contactData?.hubungan_kontak_darurat,
        nomor_kontak_darurat: data.contactData?.nomor_kontak_darurat,
      },
      { upsert: true }
    );

    // 3. Pembaruan Data Kompetensi Akademik (Membaca objek educationData)
    // Karena di controller data string koma sudah di-split/diubah menjadi array, di sini langsung dimasukkan saja
    await EmployeeEducation.findOneAndUpdate(
      { employee_id: id },
      {
        pendidikan_terakhir: data.educationData?.pendidikan_terakhir,
        institusi_pendidikan: data.educationData?.institusi_pendidikan,
        tahun_kelulusan: data.educationData?.tahun_kelulusan,
        keahlian_utama: data.educationData?.keahlian_utama || [],
        sertifikat_profesional: data.educationData?.sertifikat_profesional || [],
      },
      { upsert: true }
    );

    // 4. Pembaruan Rekening Finansial & Legal (Membaca objek financialData)
    await EmployeeFinancial.findOneAndUpdate(
      { employee_id: id },
      {
        nama_bank: data.financialData?.nama_bank,
        nomor_rekening: data.financialData?.nomor_rekening,
        nama_pemilik_rekening: data.financialData?.nama_pemilik_rekening,
        npwp: data.financialData?.npwp,
        bpjstk: data.financialData?.bpjstk,
      },
      { upsert: true }
    );

    // 5. Pembaruan Data Anggota Keluarga (Langsung berada di root data)
    await EmployeeFamily.findOneAndUpdate(
      { employee_id: id },
      {
        anggota_keluarga: (data.anggota_keluarga || []).map((fam) => ({
          ...fam,
          tanggal_lahir: fam.tanggal_lahir ? new Date(fam.tanggal_lahir) : null,
        })),
      },
      { upsert: true }
    );

    // 6. Pemrosesan Upload Dokumen Berkas & Media
    const fileUpdateObj = {};
    if (files?.foto_profile?.[0])
      fileUpdateObj.foto_profile = `/uploads/files/${path.basename(files.foto_profile[0].path)}`;
    if (files?.file_ktp?.[0])
      fileUpdateObj.file_ktp = `/uploads/files/${path.basename(files.file_ktp[0].path)}`;
    if (files?.file_kk?.[0])
      fileUpdateObj.file_kk = `/uploads/files/${path.basename(files.file_kk[0].path)}`;
    if (files?.file_skck?.[0])
      fileUpdateObj.file_skck = `/uploads/files/${path.basename(files.file_skck[0].path)}`;
    if (files?.file_ijazah?.[0])
      fileUpdateObj.file_ijazah = `/uploads/files/${path.basename(files.file_ijazah[0].path)}`;

    const docPayload = { ...fileUpdateObj };

    // Membaca tanggal kedaluwarsa SKCK dari documentData (jika terbungkus di controller) atau langsung dari root data
    const tanggalSkck = data.documentData?.tanggal_kadaluarsa_skck || data.tanggal_kadaluarsa_skck;
    if (tanggalSkck) {
      docPayload.tanggal_kadaluarsa_skck = new Date(tanggalSkck);
    }

    if (data.sertifikat_kompetensi) {
      docPayload.sertifikat_kompetensi = data.sertifikat_kompetensi.map((cert, index) => {
        const certObj = {
          nama_sertifikat: cert.nama_sertifikat,
          penerbit: cert.penerbit,
          nomor_sertifikat: cert.nomor_sertifikat,
          tanggal_terbit: cert.tanggal_terbit ? new Date(cert.tanggal_terbit) : null,
          tanggal_kadaluarsa: cert.tanggal_kadaluarsa ? new Date(cert.tanggal_kadaluarsa) : null,
        };
        if (files?.[`file_sertifikat_${index}`]?.[0]) {
          certObj.file_sertifikat = `/uploads/files/${path.basename(files[`file_sertifikat_${index}`][0].path)}`;
        }
        return certObj;
      });
    }

    if (Object.keys(docPayload).length > 0 || fileUpdateObj.foto_profile) {
      await EmployeeDocument.findOneAndUpdate(
        { employee_id: id },
        { $set: docPayload },
        { upsert: true }
      );
    }

    return employee;
  },
};
