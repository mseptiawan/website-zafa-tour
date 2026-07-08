import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import {
  createSubmission,
  findMine,
  findAllPending,
  findById,
  processWadirApproval,
  processFinalApproval
} from "../services/resignation.service.js";

export const create = asyncHandler(async (req, res) => {
  res.render("resignation/create", {
    ...buildRenderData(req, {
      title: "Ajukan Pengunduran Diri",
    }),
  });
});

export const store = asyncHandler(async (req, res) => {
  const currentEmployeeId = req.session.user?.employeeId;

  if (req.validationErrors) {
    return res.status(400).render("resignation/create", {
      ...buildRenderData(req, {
        title: "Ajukan Pengunduran Diri",
        errors: req.validationErrors,
        old: req.body,
        error: ["Mohon periksa kembali form pengisian Anda."],
      }),
    });
  }

  try {
    await createSubmission({
      body: req.body,
      employeeId: currentEmployeeId,
    });

    req.flash("success", "Pengajuan pengunduran diri berhasil dikirim.");
  } catch (err) {
    return res.status(err.statusCode || 500).render("resignation/create", {
      ...buildRenderData(req, {
        title: "Ajukan Pengunduran Diri",
        old: req.body,
        error: [err.message],
      }),
    });
  }

  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  return res.redirect("/resignation/my");
});

export const my = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const employeeId = req.session.user?.employeeId;

  const { data: resignations, meta } = await findMine({
    employeeId,
    page,
    limit,
  });

  res.render("resignation/my", {
    ...buildRenderData(req, {
      title: "Riwayat Resign Saya",
      resignations,
      pagination: meta,
      query: req.query,
    }),
  });
});
export const index = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const { data: resignations, meta } = await findAllPending({
    page,
    limit,
    currentUser: req.session.user,
  });

  // Hitung summary global secara dinamis dari array atau buat konstan statis untuk pelaporan
  const totalResignations = resignations.length;
  const pending = resignations.filter(r => ["PENDING_WADIR", "PENDING_DIRUT"].includes(r.status)).length;
  const approved = resignations.filter(r => r.status === "APPROVED").length;
  const rejected = resignations.filter(r => ["REJECTED_WADIR", "REJECTED_DIRUT"].includes(r.status)).length;

  res.render("resignation/index", {
    ...buildRenderData(req, {
      title: "Daftar Persetujuan Resign",
      resignations,
      pagination: meta,
      query: req.query,
      summary: {
        totalResignations,
        pending,
        approved,
        rejected
      }
    }),
  });
});
export const show = asyncHandler(async (req, res) => {
  const resignation = await findById(req.params.id);

  if (!resignation) {
    const err = new Error("Data pengunduran diri tidak ditemukan");
    err.statusCode = 404;
    throw err;
  }

  res.render("resignation/show", {
    ...buildRenderData(req, {
      title: "Detail Pengunduran Diri",
      resignation,
    }),
  });
});

export const approveWadir = asyncHandler(async (req, res) => {
  const { action, note } = req.body;

  await processWadirApproval({
    resignationId: req.params.id,
    userId: req.session.user._id,
    action,
    note,
  });

  req.flash("success", `Pengajuan berhasil di-${action.toLowerCase()}.`);
  return res.redirect("/resignation");
});

export const approveFinal = asyncHandler(async (req, res) => {
  const { action, note } = req.body;

  await processFinalApproval({
    resignationId: req.params.id,
    userId: req.session.user._id,
    action,
    note,
    attachment: req.file ? req.file.path : null,
  });

  req.flash("success", `Keputusan final berhasil disimpan: Berkas di-${action.toLowerCase()}.`);
  return res.redirect("/resignation");
});