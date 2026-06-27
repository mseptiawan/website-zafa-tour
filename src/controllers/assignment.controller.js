import {
  findEmployees,
  create as createAssignment,
  findMine,
  findAll,
  findById,
} from "../services/assignment.service.js";

const RENDER_DEFAULTS = (req) => ({
  user: req.session.user,
});

export const create = async (req, res, next) => {
  try {
    const currentEmployeeId = req.session.user?.employeeId;
    const employees = await findEmployees(currentEmployeeId);
    const today = new Date().toISOString().split("T")[0];

    res.render("assignment/create", {
      ...RENDER_DEFAULTS(req),
      title: "Buat Penugasan",
      employees,
      today,
      errors: {},
      old: {},
      activeMenu: "create-assignment",
    });
  } catch (err) {
    next(err);
  }
};

export const store = async (req, res, next) => {
  try {
    const currentEmployeeId = req.session.user?.employeeId;

    if (req.validationErrors) {
      const employees = await findEmployees(currentEmployeeId);
      const today = new Date().toISOString().split("T")[0];

      return res.status(400).render("assignment/create", {
        ...RENDER_DEFAULTS(req),
        title: "Buat Penugasan",
        employees,
        today,
        errors: req.validationErrors,
        old: req.body,
        activeMenu: "create-assignment",
      });
    }

    await createAssignment({
      body: req.body,
      file: req.file,
      userId: req.session.user._id,
      creatorName: req.session.user.fullName,
    });

    return res.redirect("/assignments");
  } catch (err) {
    next(err);
  }
};

export const my = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const employeeId = req.session.user?.employeeId;

    const { data, meta } = await findMine({
      employeeId,
      page,
      limit,
    });

    res.render("assignment/my", {
      ...RENDER_DEFAULTS(req),
      title: "Penugasan Saya",
      assignments: data,
      pagination: meta,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

export const index = async (req, res, next) => {
  try {
    const { page, limit } = req.query;

    const result = await findAll({
      page,
      limit,
      currentUser: req.session.user,
    });

    res.render("assignment/index", {
      ...RENDER_DEFAULTS(req),
      title: "Semua Penugasan",
      assignments: result.assignments,
      pagination: result.meta,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};

export const show = async (req, res, next) => {
  try {
    const assignment = await findById(req.params.id);

    if (!assignment) {
      const err = new Error("Penugasan tidak ditemukan");
      err.statusCode = 404;
      return next(err);
    }

    res.render("assignment/show", {
      ...RENDER_DEFAULTS(req),
      title: "Detail Penugasan",
      assignment,
    });
  } catch (err) {
    next(err);
  }
};
