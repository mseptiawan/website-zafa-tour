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
import EmployeeSalary from "../models/employee/EmployeeSalary.model.js";
import EmployeeFamily from "../models/employee/EmployeeFamily.model.js";
import EmployeeContact from "../models/employee/EmployeeContact.js";
import EmployeeEducation from "../models/employee/EmployeeEducation.js";
import bcrypt from "bcrypt";

export const EmployeeService = {
  findAllEmployees: async () => {
    const employeesData = await Employee.find()
      .populate("userId")
      .populate("salaryDetail")
      .populate({
        path: "careerData",
        populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
      });

    const terminations = await Termination.find({
      status: { $in: ["Waiting", "Approved"] },
    }).populate("approvedBy", "username");

    return employeesData.map((emp) => {
      const empObj = emp.toObject();

      const termInfo = terminations.find((t) => t.employeeId?.toString() === emp._id.toString());

      if (termInfo) {
        empObj.terminationInfo = {
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
      return empObj;
    });
  },
  getFormData: async (currentUserRole) => {
    let roleQuery = {};

    if (currentUserRole !== "DIREKTUR_UTAMA") {
      roleQuery = { name: { $nin: ["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"] } };
    }

    const [positions, units, bidang, roles] = await Promise.all([
      Position.find({ name: { $in: ["General Manager", "Pegawai", "Manager"] } }),
      Unit.find().lean(),
      Bidang.find().lean(),
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
        tanggal_berakhir_kontrak: data.tanggal_berakhir_kontrak
          ? new Date(data.tanggal_berakhir_kontrak)
          : null,
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
      .populate({
        path: "careerData",
        populate: [
          { path: "positionId" }, // Menarik nama posisi jabatan
          { path: "unitId" }, // Menarik nama unit kerja penempatan
          { path: "bidangId" }, // Menarik nama bidang kerja
        ],
      })
      .populate("contactData")
      .populate("educationData")
      .populate("financialData")
      .populate("documentData")
      .populate("familyData")
      .populate("salaryDetail");
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

  updatePribadi: async (id, data) => {
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
  },

  updateKarir: async (id, data) => {
    // 1. Cari data Employee terlebih dahulu untuk mendapatkan userId-nya
    const employee = await Employee.findById(id).select("userId");

    // Siapkan array untuk menampung promise update paralel
    const updatePromises = [
      // Update data karir di EmployeeCareer
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

    if (employee && employee.userId) {
      updatePromises.push(
        User.findByIdAndUpdate(employee.userId, { status: data.status || "Active" }, { new: true })
      );
    }

    const [careerUpdate, userUpdate] = await Promise.all(updatePromises);

    return {
      career: careerUpdate,
      user: userUpdate,
    };
  },

  updateKontak: async (id, data) => {
    return await EmployeeContact.findOneAndUpdate(
      { employee_id: id },
      {
        nomor_telp: data.nomor_telp,
        alamat: data.alamat,
        nama_kontak_darurat: data.nama_kontak_darurat,
        hubungan_kontak_darurat: data.hubungan_kontak_darurat,
        nomor_kontak_darurat: data.nomor_kontak_darurat,
      },
      { new: true, upsert: true }
    );
  },

  updateDokumen: async (id, data) => {
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
      {
        $set: updateFields,
        $setOnInsert: {
          employee_id: id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
  updatePendidikan: async (id, data, file) => {
    const updateData = {
      pendidikan_terakhir: data.pendidikan_terakhir,
      institusi_pendidikan: data.institusi_pendidikan,
      tahun_kelulusan: data.tahun_kelulusan ? Number(data.tahun_kelulusan) : null,
    };

    if (file) {
      updateData.file_ijazah = `/uploads/files/${file.filename}`;
    }

    return await EmployeeEducation.findOneAndUpdate(
      { employee_id: id },
      {
        $set: updateData,
        $setOnInsert: {
          employee_id: id,
        },
      },
      {
        new: true,
        upsert: true,
      }
    );
  },
  updateKeluarga: async (id, data) => {
    const listKeluarga = data.anggota_keluarga || [];
    const formattedFamily = listKeluarga.map((m) => ({
      nama: m.nama,
      hubungan: m.hubungan,
      nik: m.nik,
      pekerjaan: m.pekerjaan,
    }));
    return await EmployeeFamily.findOneAndUpdate(
      { employee_id: id },
      {
        anggota_keluarga: formattedFamily,
      },
      { new: true, upsert: true }
    );
  },

  updateFinansial: async (id, data) => {
    // 1. Jalankan update untuk EmployeeFinancial dan EmployeeSalary secara bersamaan (Parallel)
    const [financialUpdate, salaryUpdate] = await Promise.all([
      // Update data bank, npwp, bpjs, dan overtime rate
      EmployeeFinancial.findOneAndUpdate(
        { employee_id: id },
        {
          nama_bank: data.nama_bank,
          nomor_rekening: data.nomor_rekening,
          nama_pemilik_rekening: data.nama_pemilik_rekening,
          npwp: data.npwp,
          bpjstk: data.bpjstk,
          overtimeRate: data.overtimeRate ?? 0,
        },
        { returnDocument: "after", upsert: true }
      ),

      EmployeeSalary.findOneAndUpdate(
        { employeeId: id },
        {
          basicSalary: data.basicSalary ?? 0,
          effectiveDate: data.effectiveDate ? new Date(data.effectiveDate) : Date.now(),
        },
        { returnDocument: "after", upsert: true }
      ),
    ]);

    return {
      financial: financialUpdate,
      salary: salaryUpdate,
    };
  },
};
