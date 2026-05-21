import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Termination from "../models/Termination.js"; // Sesuaikan dengan path folder model kamu
import bcrypt from "bcrypt";
import Role from "../models/Role.js";
import Position from "../models/Position.js";
import Unit from "../models/Unit.js";
import Bidang from "../models/Bidang.js";
/* =========================
   LIST EMPLOYEE
========================= */
export const listEmployee = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("userId")
      .populate("positionId")
      .populate("unitId")
      .populate("bidangId")
      .sort({ createdAt: -1 });

    res.render("employee/index", {
      title: "Data Karyawan",
      employees,
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Error");
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
