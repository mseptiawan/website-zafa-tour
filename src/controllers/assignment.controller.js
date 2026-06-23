import { createAssignmentSchema } from "../validations/assignment.schema.js";
import * as assignmentService from "../services/assignment.service.js";

export const newForm = async (req, res, next) => {
  try {
    const currentEmployeeId = req.session.user?.employeeId;

    const employees = await assignmentService.findEmployees(currentEmployeeId);
    const today = new Date().toISOString().split("T")[0];
    res.render("assignment/create", {
      title: "Buat Penugasan",
      employees,
      today,
      error: null,
      old: {},
    });
  } catch (err) {
    next(err);
  }
};
export const create = async (req, res, next) => {
  try {
    const result = createAssignmentSchema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = result.error.format();

      const employees = await assignmentService.findEmployees();
      return res.status(400).render("assignment/create", {
        title: "Buat Penugasan",
        employees,
        errors: fieldErrors,
        old: req.body,
      });
    }

    await assignmentService.create({
      body: result.data,
      file: req.file,
      userId: req.session.user._id,
    });

    return res.redirect("/assignment");
  } catch (err) {
    console.error("Database Error Terdeteksi:", err);

    const employees = await assignmentService.findEmployees();

    let customFieldsError = { _errors: [] };

    if (err.message && err.message.includes("at least 10 character")) {
      customFieldsError = {
        _errors: [],
        description: {
          _errors: ["Deskripsi terlalu pendek, minimal harus berisi 10 karakter"],
        },
      };
    } else {
      return res.status(400).render("assignment/create", {
        title: "Buat Penugasan",
        employees,
        errors: customFieldsError,
        old: req.body,
        today: new Date().toISOString().split("T")[0],
      });
    }

    return res.status(400).render("assignment/create", {
      title: "Buat Penugasan",
      employees,
      errors: fieldErrors,
      old: req.body,
      today: new Date().toISOString().split("T")[0],
    });
  }
};
export const myAssignments = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 5, 1);

    const { data, meta } = await assignmentService.findMine({
      userId: req.session.user._id,
      page,
      limit,
    });

    res.render("assignment/my", {
      title: "Penugasan Saya",
      assignments: data,
      pagination: meta,
      query: req.query,
    });
  } catch (err) {
    next(err);
  }
};
// Jalankan update pada fungsi index di assignment.controller.js
export const index = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit) || 5, 1);

    // Kirim data user yang sedang login ke service untuk di-filter jabatannya
    const result = await assignmentService.findAll({
      page,
      limit,
      currentUser: req.session.user,
    });

    res.render("assignment/index", {
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

    res.render("assignment/show", {
      title: "Detail Penugasan",
      assignment,
    });
  } catch (err) {
    next(err);
  }
};
