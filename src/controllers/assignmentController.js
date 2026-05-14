import Assignment from "../models/Assignment.js";
import Employee from "../models/Employee.js";

export const formAssignment = async (req, res) => {
  const employees = await Employee.find();

  res.render("assignment/create", {
    title: "Buat Penugasan",
    employees,
  });
};

export const createAssignment = async (req, res) => {
  try {
    const { title, description, type, location, startDate, endDate, employees } = req.body;

    await Assignment.create({
      title,
      description,
      type,
      location,
      startDate,
      endDate,
      employees,
      createdBy: req.session.user._id,
      attachment: req.file ? req.file.filename : null,
    });

    return res.redirect("/assignment/my");
  } catch (err) {
    console.log(err);
    res.status(500).send("Gagal membuat penugasan");
  }
};

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

export const allAssignments = async (req, res) => {
  const assignments = await Assignment.find().populate("employees").sort({ createdAt: -1 });

  res.render("assignment/all", {
    title: "Semua Penugasan",
    assignments,
  });
};

export const assignmentDetail = async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate("employees")
    .populate("createdBy");

  res.render("assignment/detail", {
    title: "Detail Penugasan",
    assignment,
  });
};
