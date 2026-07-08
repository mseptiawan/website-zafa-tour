import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData, getToday } from "../utils/renderHelper.js";

import {
  getEmployeesForAssignment,
  createAssignment as createAssignmentService, 
  getAssignmentsByEmployeeId,
  getAllAssignments as getAllAssignmentsService,
  getAssignmentById as getAssignmentByIdService,
} from "../services/assignment.service.js";

// ─── METHOD 1: RENDER FORM CREATE ─────────────────────
export const renderCreateForm = asyncHandler(async (req, res) => {
  const currentEmployeeId = req.session.user?.employeeId;
  
  const employees = await getEmployeesForAssignment(currentEmployeeId);

  res.render("assignment/create", {
    ...buildRenderData(req, {
      title: "Buat Penugasan",
      employees,
      today: getToday(),
    }),
  });
});

// ─── METHOD 2: STORE / CREATE DATA ───
export const createAssignment = asyncHandler(async (req, res) => {
  const currentEmployeeId = req.session.user?.employeeId;

  if (req.validationErrors) {
    const employees = await getEmployeesForAssignment(currentEmployeeId);

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

  await createAssignmentService({
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

// ─── METHOD 3: GET PENUGASAN SAYA ────────
export const getMyAssignments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const employeeId = req.session.user?.employeeId;

  const { data: assignments, meta } = await getAssignmentsByEmployeeId({
    employeeId,
    page,
    limit,
  });

  res.render("assignment/my", {
    ...buildRenderData(req, {
      title: "Penugasan Saya", 
      assignments,
      pagination: meta,
      query: req.query,
    }),
  });
});

// ─── METHOD 4: GET INDEX ALL ───
export const getAllAssignments = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const { data: assignments, meta } = await getAllAssignmentsService({
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

// ─── METHOD 5: GET SHOW DETAIL ────────
// ─── METHOD 5: GET SHOW DETAIL ────────
export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await getAssignmentByIdService(req.params.id);

  if (!assignment) {
    const err = new Error("Data penugasan tidak ditemukan");
    err.statusCode = 404;
    throw err;
  }

  // Deteksi halaman asal. Jika tidak ada (misal ketik URL langsung), default ke '/assignments'
  const referrer = req.get('Referer') || '';
  let backLink = '/assignments';

  if (referrer.includes('/assignments/me')) {
    backLink = '/assignments/me';
  }

  res.render("assignment/show", {
    ...buildRenderData(req, {
      title: "Detail Penugasan",
      assignment,
      backLink, // <-- Kirim variabel ini ke EJS
    }),
  });
});