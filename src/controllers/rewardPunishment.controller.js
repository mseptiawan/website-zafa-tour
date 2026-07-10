import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData, getToday } from "../utils/renderHelper.js";
import {
  findAllLogs,
  findAvailableEmployees,
  findActiveMasterTypes,
  createLog,
  deleteLogById,
  findMasterTypes,
  checkDuplicateTypeName,
  createType,
  updateTypeById,
  updateTypeStatus,
  findEmployeeLogs,
} from "../services/rewardPunishment.service.js";

// =========================================================================
// ─── TRANSACTIONAL LOGS METHOD ───
// =========================================================================

export const renderRewardPunishmentIndexPage = asyncHandler(async (req, res) => {
  const logs = await findAllLogs();
  res.render("rewardPunishment/index", {
    ...buildRenderData(req, {
      title: "Reward & Punishment",
      logs,
    }),
  });
});

export const renderCreateRewardPunishmentForm = asyncHandler(async (req, res) => {
  const employees = await findAvailableEmployees();
  const types = await findActiveMasterTypes();

  res.render("rewardPunishment/create", {
    ...buildRenderData(req, {
      title: "Catat Reward & Punishment",
      employees,
      types,
      today: getToday(),
    }),
  });
});

export const storeRewardPunishmentLog = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    const employees = await findAvailableEmployees();
    const types = await findActiveMasterTypes();

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

  if (!req.body.hasFinancialImpact) {
    req.body.amount = 0;
  }

  const attachmentPath = req.file ? req.file.path : "";

  await createLog({
    body: req.body,
    userId: req.session.user._id,
    attachmentPath: attachmentPath,
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

export const deleteRewardPunishmentLog = asyncHandler(async (req, res) => {
  await deleteLogById(req.params.id);
  req.flash("success", "Catatan berhasil dihapus.");
  return res.redirect("/reward-punishment");
});

export const renderEmployeeRewardPunishmentLogPage = asyncHandler(async (req, res) => {
  const employeeId = req.session.user.employeeId;

  if (!employeeId) {
    req.flash("error", "Data pegawai tidak ditemukan.");
    return res.redirect("/");
  }

  const logs = await findEmployeeLogs(employeeId);

  res.render("rewardPunishment/history", {
    ...buildRenderData(req, {
      title: "Reward & Punishment Saya",
      logs,
    }),
  });
});

// =========================================================================
// ─── MASTER TYPES METHOD ───
// =========================================================================

export const renderMasterTypeIndexPage = asyncHandler(async (req, res) => {
  const types = await findMasterTypes();

  res.render("rewardPunishment/type/index", {
    ...buildRenderData(req, {
      title: "Master Jenis Reward & Punishment",
      types,
    }),
  });
});

export const storeMasterType = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    const types = await findMasterTypes();
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

  const isDuplicate = await checkDuplicateTypeName(name, category);
  if (isDuplicate) {
    return res.status(400).json({
      success: false,
      message: `Jenis dengan nama "${name}" pada kategori ${category} sudah terdaftar.`,
    });
  }

  await createType({ category, name, description, financialImpact });

  req.flash("success", "Jenis master berhasil ditambahkan!");
  return res.json({
    success: true,
    message: "Jenis master berhasil ditambahkan",
  });
});

export const updateMasterType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { category, name, description, financialImpact } = req.body;

  await updateTypeById(id, { category, name, description, financialImpact });

  req.flash("success", "Jenis master berhasil diperbarui!");
  return res.json({
    success: true,
    message: "Jenis master berhasil diperbarui",
  });
});

export const toggleMasterTypeStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  await updateTypeStatus(id, isActive);

  const statusText = isActive ? "diaktifkan" : "dinonaktifkan";
  req.flash("success", `Jenis master berhasil di-${statusText}!`);

  return res.json({
    success: true,
    message: `Jenis master berhasil di-${statusText}`,
  });
});
