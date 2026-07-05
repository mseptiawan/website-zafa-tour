import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData, getToday } from "../utils/renderHelper.js";
import * as rpService from "../services/rewardPunishment.service.js";

// =========================================================================
// ─── TRANSACTIONAL LOGS METHOD (UPDATED) ───
// =========================================================================

export const index = asyncHandler(async (req, res) => {
  const logs = await rpService.findAllLogs();
  res.render("rewardPunishment/index", {
    ...buildRenderData(req, {
      title: "Reward & Punishment",
      logs,
    }),
  });
});

export const create = asyncHandler(async (req, res) => {
  const employees = await rpService.findAvailableEmployees();
  const types = await rpService.findActiveMasterTypes();

  res.render("rewardPunishment/create", {
    ...buildRenderData(req, {
      title: "Catat Reward & Punishment",
      employees,
      types,
      today: getToday(),
    }),
  });
});

// SESUAIKAN: Menangkap file attachment dan meneruskannya ke service
export const store = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    const employees = await rpService.findAvailableEmployees();
    const types = await rpService.findActiveMasterTypes();

    return res.status(400).render("rewardPunishment/create", {
      ...buildRenderData(req, {
        title: "Catat Reward & Punishment",
        employees,
        types,
        today: getToday(),
        errors: req.validationErrors,
        old: req.body,
        error: ["Mohon periksa kembali form pengisian Anda."],
      }),
    });
  }

  // Jika operator mematikan toggle 'hasFinancialImpact', pastikan amount dipaksa jadi 0
  if (!req.body.hasFinancialImpact) {
    req.body.amount = 0;
  }

  // Ambil path file dari Multer jika ada file yang diupload
  const attachmentPath = req.file ? req.file.path : "";

  await rpService.createLog({
    body: req.body,
    userId: req.session.user._id,
    attachmentPath: attachmentPath, // Kirim berkas lampiran
  });

  req.flash("success", "Data Reward/Punishment berhasil dicatat!");
  await new Promise((resolve, reject) => {
    req.session.save((err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  return res.redirect("/reward-punishment");
});

export const destroy = asyncHandler(async (req, res) => {
  await rpService.deleteLogById(req.params.id);
  req.flash("success", "Catatan berhasil dihapus.");
  return res.redirect("/reward-punishment");
});

// =========================================================================
// ─── MASTER TYPES METHOD (AS IS) ───
// =========================================================================

export const indexType = asyncHandler(async (req, res) => {
  const types = await rpService.findMasterTypes();

  res.render("rewardPunishment/type/index", {
    ...buildRenderData(req, {
      title: "Master Jenis Reward & Punishment",
      types,
    }),
  });
});

export const storeType = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    const types = await rpService.findMasterTypes();
    return res.status(400).render("rewardPunishment/type/index", {
      ...buildRenderData(req, {
        title: "Master Jenis Reward & Punishment",
        types,
        errors: req.validationErrors,
        old: req.body,
        error: ["Mohon periksa kembali form pengisian Anda."],
      }),
    });
  }

  const { category, name, description, financialImpact } = req.body;

  const isDuplicate = await rpService.checkDuplicateTypeName(name, category);
  if (isDuplicate) {
    return res.status(400).json({
      success: false,
      message: `Jenis dengan nama "${name}" pada kategori ${category} sudah terdaftar.`,
    });
  }

  await rpService.createType({ category, name, description, financialImpact });

  req.flash("success", "Jenis master berhasil ditambahkan!");
  return res.json({
    success: true,
    message: "Jenis master berhasil ditambahkan",
  });
});

export const updateType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, name, description, financialImpact } = req.body;

  await rpService.updateTypeById(id, { category, name, description, financialImpact });

  req.flash("success", "Jenis master berhasil diperbarui!");
  return res.json({
    success: true,
    message: "Jenis master berhasil diperbarui",
  });
});

export const toggleStatusType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  await rpService.updateTypeStatus(id, isActive);

  const statusText = isActive ? "diaktifkan" : "dinonaktifkan";
  req.flash("success", `Jenis master berhasil di-${statusText}!`);

  return res.json({
    success: true,
    message: `Jenis master berhasil di-${statusText}`,
  });
});

export const myLog = asyncHandler(async (req, res) => {
  const employeeId = req.session.user.employeeId;

  if (!employeeId) {
    req.flash("error", "Data pegawai tidak ditemukan.");
    return res.redirect("/");
  }

  const logs = await rpService.findEmployeeLogs(employeeId);

  res.render("rewardPunishment/my-log", {
    ...buildRenderData(req, {
      title: "Reward & Punishment Saya",
      logs,
    }),
  });
});
