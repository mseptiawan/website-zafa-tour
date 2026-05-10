import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";

/* =========================
   FORM CREATE
========================= */
export const formAssignment = async (req, res) => {
  const employees = await Employee.find();

  res.render("assignment/create", {
    title: "Buat Penugasan",
    employees,
  });
};

/* =========================
   CREATE ASSIGNMENT
========================= */
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      location,
      startDate,
      endDate,
      employees,
    } = req.body;

    await Assignment.create({
      title,
      description,
      type,
      location,
      startDate,
      endDate,
      employees,
      createdBy: req.session.user._id,
      status: "ACTIVE",

      // 🔥 FILE UPLOAD
      attachment: req.file ? req.file.filename : null,
    });

    return res.redirect("/assignment/my");
  } catch (err) {
    console.log(err);
    res.status(500).send("Gagal membuat penugasan");
  }
};

/* =========================
   MY ASSIGNMENT (karyawan)
========================= */
export const myAssignments = async (req, res) => {
  const employee = await Employee.findOne({
    userId: req.session.user._id,
  });

  const assignments = await Assignment.find({
    employees: employee._id,
  }).sort({ createdAt: -1 });

  res.render("assignment/my", {
    title: "Penugasan Saya",
    assignments,
  });
};

/* =========================
   ALL ASSIGNMENT (monitoring)
========================= */
export const allAssignments = async (req, res) => {
  const assignments = await Assignment.find()
    .populate("employees")
    .sort({ createdAt: -1 });

  res.render("assignment/all", {
    title: "Semua Penugasan",
    assignments,
  });
};

/* =========================
   DETAIL
========================= */
export const assignmentDetail = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("employees")
    .populate("createdBy");

  res.render("assignment/detail", {
    title: "Detail Penugasan",
    assignment,
  });
};
