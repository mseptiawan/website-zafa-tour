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
        tanggal_lahir: data.tanggal_lahir,
        jenis_kelamin: data.jenis_kelamin,
        agama: data.agama,
        golongan_darah: data.golongan_darah,
        status_pernikahan: data.status_pernikahan,
      },
      { new: true, runValidators: true }
    );

    if (!employee) return null;

    await EmployeeCareer.findOneAndUpdate(
      { employee_id: id },
      {
        positionId: data.positionId,
        unitId: data.unitId,
        bidangId: data.bidangId,
        status_pegawai: data.pegawai,
        tanggal_mulai_bergabung: data.tanggal_mulai_bergabung,
        tanggal_berakhir_kontrak: data.tanggal_berakhir_kontrak,
      },
      { upsert: true }
    );

    await EmployeeContact.findOneAndUpdate(
      { employee_id: id },
      {
        nomor_telp: data.nomor_telp,
        alamat: data.alamat,
        nama_kontak_darurat: data.nama_kontak_darurat,
        hubungan_kontak_darurat: data.hubungan_kontak_darurat,
        nomor_kontak_darurat: data.nomor_kontak_darurat,
      },
      { upsert: true }
    );

    await EmployeeEducation.findOneAndUpdate(
      { employee_id: id },
      {
        pendidikan_terakhir: data.pendidikan_terakhir,
        institusi_pendidikan: data.institusi_pendidikan,
        tahun_kelulusan: data.tahun_kelulusan,
      },
      { upsert: true }
    );

    await EmployeeFinancial.findOneAndUpdate(
      { employee_id: id },
      {
        nama_bank: data.nama_bank,
        nomor_rekening: data.nomor_rekening,
        nama_pemilik_rekening: data.nama_pemilik_rekening,
      },
      { upsert: true }
    );

    const fileData = {};
    if (files?.file_ktp?.[0]) fileData.file_ktp = files.file_ktp[0].filename;
    if (files?.file_kk?.[0]) fileData.file_kk = files.file_kk[0].filename;

    if (Object.keys(fileData).length > 0) {
      await EmployeeDocument.findOneAndUpdate(
        { employee_id: id },
        { $set: fileData },
        { upsert: true }
      );
    }

    return employee;
  },
};
