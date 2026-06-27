import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData, getToday } from "../utils/renderHelper.js";
import {
  findEmployees,
  create as createAssignment,
  findMine,
  findAll,
  findById,
} from "../services/assignment.service.js";

// ─── METHOD 1: FORM CREATE  ─────────────────────
export const create = asyncHandler(async (req, res) => {
  const currentEmployeeId = req.session.user?.employeeId;
  const employees = await findEmployees(currentEmployeeId);

  res.render("assignment/create", {
    ...buildRenderData(req, {
      title: "Buat Penugasan",
      employees,
      today: getToday(),
    }),
  });
});

// ─── METHOD 2: STORE DATA  ───
export const store = asyncHandler(async (req, res) => {
  const currentEmployeeId = req.session.user?.employeeId;

  if (req.validationErrors) {
    const employees = await findEmployees(currentEmployeeId);

    return res.status(400).render("assignment/create", {
      ...buildRenderData(req, {
        title: "Buat Penugasan",
        employees,
        today: getToday(),
        errors: req.validationErrors,
        old: req.body,
        error: ["Mohon periksa kembali form pengisian Anda."],
      }),
    });
  }

  await createAssignment({
    body: req.body,
    file: req.file,
    userId: req.session.user._id,
    creatorName: req.session.user.fullName,
  });

  req.flash("success", "Penugasan berhasil diterbitkan!");

  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  return res.redirect("/assignments");
});

// ─── METHOD 3: PENUGASAN SAYA  ────────
export const my = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const employeeId = req.session.user?.employeeId;

  const { data: assignments, meta } = await findMine({
    employeeId,
    page,
    limit,
  });

  res.render("assignment/my", {
    ...buildRenderData(req, {
      title: "Penugasan ku",
      assignments,
      pagination: meta,
      query: req.query,
    }),
  });
});

// ─── METHOD 4: INDEX ALL  ───
export const index = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const { data: assignments, meta } = await findAll({
    page,
    limit,
    currentUser: req.session.user,
  });

  res.render("assignment/index", {
    ...buildRenderData(req, {
      title: "Semua Penugasan",
      assignments,
      pagination: meta,
      query: req.query,
    }),
  });
});

// ─── METHOD 5: SHOW DETAIL ────────
export const show = asyncHandler(async (req, res) => {
  const assignment = await findById(req.params.id);

  if (!assignment) {
    const err = new Error("Data penugasan tidak ditemukan");
    err.statusCode = 404;
    throw err;
  }

  res.render("assignment/show", {
    ...buildRenderData(req, {
      title: "Detail Penugasan",
      assignment,
    }),
  });
});
