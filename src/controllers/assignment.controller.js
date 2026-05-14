import assignmentService from "../services/assignment.service.js";

export const formAssignment = async (req, res, next) => {
  try {
    const employees = await assignmentService.getEmployees();

    res.render("assignment/create", {
      title: "Buat Penugasan",

      employees,

      error: null,

      old: {},
    });
  } catch (err) {
    next(err);
  }
};

export const createAssignment = async (req, res) => {
  try {
    await assignmentService.create(req);

    return res.redirect("/assignment/all");
  } catch (err) {
    const employees = await assignmentService.getEmployees();

    return res.status(400).render("assignment/create", {
      title: "Buat Penugasan",

      employees,

      error: err.message,

      old: req.body,
    });
  }
};

export const myAssignments = async (req, res, next) => {
  try {
    const assignments = await assignmentService.getMyAssignments(req.session.user._id);

    res.render("assignment/my", {
      title: "Penugasan Saya",

      assignments,
    });
  } catch (err) {
    next(err);
  }
};

export const allAssignments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const result = await assignmentService.getAllAssignments({
      page,
    });

    res.render("assignment/all", {
      title: "Semua Penugasan",

      assignments: result.assignments,

      pagination: result.pagination,

      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

export const assignmentDetail = async (req, res, next) => {
  try {
    const assignment = await assignmentService.getById(req.params.id);

    res.render("assignment/detail", {
      title: "Detail Penugasan",

      assignment,
    });
  } catch (err) {
    next(err);
  }
};
