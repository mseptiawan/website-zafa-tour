import assignmentService from "../services/assignment.service.js";

export const newForm = async (req, res, next) => {
  try {
    const employees = await assignmentService.findEmployees();

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

export const create = async (req, res) => {
  try {
    await assignmentService.create({
      body: req.body,
      file: req.file,
      userId: req.session.user._id,
    });

    return res.redirect("/assignment");
  } catch (err) {
    const employees = await assignmentService.findEmployees();

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
    const assignments = await assignmentService.findMine(req.session.user._id);

    res.render("assignment/my", {
      title: "Penugasan Saya",
      assignments,
    });
  } catch (err) {
    next(err);
  }
};

export const index = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;

    const result = await assignmentService.findAll({
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

export const show = async (req, res, next) => {
  try {
    const assignment = await assignmentService.findById(req.params.id);

    res.render("assignment/detail", {
      title: "Detail Penugasan",
      assignment,
    });
  } catch (err) {
    next(err);
  }
};
