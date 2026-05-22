import Employee from "../models/employee/Employee.model.js";
import User from "../models/basic/User.js";
import Termination from "../models/Termination.js"; // Sesuaikan dengan path folder model kamu
import bcrypt from "bcrypt";
import Role from "../models/basic/Role.js";
import Position from "../models/basic/Position.js";
import Unit from "../models/basic/Unit.js";
import Bidang from "../models/basic/Bidang.js";
/* =========================
   LIST EMPLOYEE
========================= */
export const getAllEmployees = async (req, res) => {
  try {
    // 1. Ambil seluruh data karyawan beserta user statusnya
    let employeesData = await Employee.find()
      .populate("userId")
      .populate("positionId")
      .populate("bidangId")
      .populate("unitId");

    // 2. Ambil data PHK yang sudah disetujui pimpinan untuk dicocokkan
    const approvedTerminations = await Termination.find({ status: "Approved" }).populate(
      "approvedBy",
      "username"
    );

    // 3. Gabungkan informasi PHK ke dalam list karyawan agar EJS tinggal pakai
    const employees = employeesData.map((emp) => {
      const empObj = emp.toObject();
      const termInfo = approvedTerminations.find(
        (t) => t.employeeId.toString() === emp._id.toString()
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

    res.render("employee/index", { title: "Data Karyawan", employees });
  } catch (error) {
    res.status(500).send("Error loading employees dashboard");
  }
};
/* =========================
   FORM CREATE
========================= */
export const formEmployee = async (req, res) => {
  try {
    const positions = await Position.find();
    const units = await Unit.find();
    const bidang = await Bidang.find();

    res.render("employee/create", {
      title: "Tambah Karyawan",
      positions,
      units,
      bidang,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};
/* =========================
   CREATE EMPLOYEE + AUTO USER
========================= */
export const createEmployee = async (req, res) => {
  try {
    const {
      fullName,
      positionId,
      unitId,
      bidangId,
      gender,
      phoneNumber,
      address,
      employmentStatus,
    } = req.body;

    const role = await Role.findOne({ name: "Karyawan" });

    const username = fullName.toLowerCase().replace(/[^a-z0-9]/g, "");

    const password = await bcrypt.hash("zafasecret", 10);

    const user = await User.create({
      username,
      password,
      roleId: role._id,
    });

    await Employee.create({
      userId: user._id,
      fullName,
      positionId,
      unitId: unitId || null,
      bidangId: bidangId || null,
      gender,
      phoneNumber,
      address,
      employmentStatus,
      joinDate: new Date(), // otomatis
    });

    res.redirect("/employee");
  } catch (err) {
    console.log(err);
    res.status(500).send("Create employee error");
  }
};
/* =========================
   DETAIL EMPLOYEE
========================= */
export const detailEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("userId")
      .populate("positionId")
      .populate("unitId")
      .populate("bidangId");

    res.render("employee/detail", {
      title: "Detail Karyawan",
      employee,
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

export const ajukanPHK = async (req, res) => {
  try {
    const { employeeId, reason } = req.body;

    // 🔍 Cek 1: Apakah file benar-benar masuk dari form?
    if (!req.file) {
      return res.status(400).json({
        message:
          "Gagal: File dokumen tidak terbaca oleh sistem. Pastikan input file di EJS bernama 'document'",
      });
    }

    // Ambil path atau filename sesuai konfigurasi multer kamu
    const documentPath = req.file.path || req.file.filename;

    const newTermination = new Termination({
      employeeId,
      reason,
      documentPath,
      status: "Waiting",
    });

    await newTermination.save();
    res.redirect("/employee");
  } catch (error) {
    // 🔍 Cek 2: Tampilkan error spesifik dari MongoDB/Node ke respon browser
    console.error(error);
    res.status(500).json({
      message: "Gagal mengajukan PHK",
      error_asli: error.message,
    });
  }
};
export const renderEditForm = async (req, res) => {
  try {
    const { id } = req.params;

    // Ambil data employee beserta data akun User-nya
    const employee = await Employee.findById(id).populate("userId");
    if (!employee) {
      return res.status(404).render("errors/404", { message: "Karyawan tidak ditemukan" });
    }

    // Ambil semua data master untuk opsi select-box
    const positions = await Position.find();
    const bidang = await Bidang.find();
    const units = await Unit.find();

    res.render("employee/edit", {
      title: "Edit Karyawan",
      employee,
      positions,
      bidang,
      units,
      error: null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

// 2. Memproses Perubahan Data (POST)
export const updateEmployee = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      fullName,
      positionId,
      unitId,
      bidangId,
      employmentStatus,
      gender,
      phoneNumber,
      address,
      baseSalary,
    } = req.body;

    // 1. Cari data employee terlebih dahulu
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).send("Karyawan tidak ditemukan");
    }

    // CATATAN: Proses update User (email & isActive) dihapus dari sini
    // karena field tersebut sudah diset readonly/dihapus di tampilan EJS.

    // 2. Update data Profil (Employee Model)
    employee.fullName = fullName;
    employee.positionId = positionId;
    employee.unitId = unitId || null;
    employee.bidangId = bidangId || null;
    employee.employmentStatus = employmentStatus;
    employee.gender = gender;
    employee.phoneNumber = phoneNumber;
    employee.address = address;
    employee.baseSalary = Number(baseSalary) || 0;

    // Jika ada upload foto baru
    if (req.file) {
      employee.profilePhoto = req.file.filename;
    }

    await employee.save();

    // Redirect kembali ke halaman daftar karyawan setelah sukses
    res.redirect("/employee");
  } catch (error) {
    // Tampilkan detail error asli di terminal untuk mempermudah tracking berikutnya
    console.error("Error Update Employee:", error);

    // Jika gagal, render ulang form dengan pesan error yang sesuai
    const employee = await Employee.findById(id).populate("userId");
    const positions = await Position.find();
    const bidang = await Bidang.find();
    const units = await Unit.find();

    res.render("employee/edit", {
      title: "Edit Karyawan",
      employee,
      positions,
      bidang,
      units,
      error: "Gagal memperbarui data profil karyawan. Silakan periksa kembali inputan Anda.",
    });
  }
};
