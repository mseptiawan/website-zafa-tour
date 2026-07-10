import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import Employee from "../models/employee/Employee.model.js";
import moment from "moment";

// NAMED IMPORT SEMUA SERVICE METHOD BERBENTUK DESTRUCTURING
import {
  getKpiDetails,
  findActivitiesByDate,
  createActivity,
  updateActivity,
  carryOverPendingTasks,
  getReviewerBidangFilter,
  generateReviewReport,
} from "../services/dailyActivity.service.js";

// ─── METHOD 1: MAIN EJS VIEW (INDEX) ─────────────────────────────────
export const renderDailyActivityPage = asyncHandler(async (req, res) => {
  const { employeeId } = req.session.user;
  const today = moment().format("YYYY-MM-DD");

  const employee = await Employee.findById(employeeId).populate("careerData");
  if (!employee || !employee.careerData) {
    return res.redirect("/dashboard?error=NO_CAREER_DATA");
  }

  const { unitId, positionId } = employee.careerData;

  const [kpiDetails, logs] = await Promise.all([
    getKpiDetails(unitId, positionId),
    findActivitiesByDate(employeeId, today),
  ]);

  return res.render("daily-activity/index", {
    ...buildRenderData(req, {
      title: "Aktivitas Harian",
      initialLogs: logs,
      initialKpis: kpiDetails,
    }),
  });
});

// ─── METHOD 2: AJAX GET LOGS BY DATE ─────────────────────────────────
export const getActivities = asyncHandler(async (req, res) => {
  const { tanggal } = req.query;
  const { employeeId } = req.session.user;

  if (!tanggal) {
    return res.status(400).json({ success: false, message: "Parameter tanggal wajib diisi." });
  }

  const logs = await findActivitiesByDate(employeeId, tanggal);
  return res.status(200).json({ success: true, data: logs });
});

// ─── METHOD 3: AJAX STORE DATA ───────────────────────────────────────
export const createDailyActivity = asyncHandler(async (req, res) => {
  const { employeeId } = req.session.user;
  const { activityDate, title, kpiTemplateId } = req.body;

  if (!activityDate || !title || !kpiTemplateId) {
    return res.status(400).json({ success: false, message: "Seluruh field data wajib diisi." });
  }

  try {
    const newLog = await createActivity({ employeeId, body: req.body });
    return res
      .status(201)
      .json({ success: true, message: "Aktivitas berhasil disimpan.", data: newLog });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ─── METHOD 4: AJAX UPDATE DATA ──────────────────────────────────────
export const updateDailyActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { employeeId } = req.session.user;

  try {
    const updatedLog = await updateActivity({
      id,
      employeeId,
      body: req.body,
      file: req.file,
    });
    return res
      .status(200)
      .json({ success: true, message: "Aktivitas berhasil diperbarui.", data: updatedLog });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
});

// ─── METHOD 5: AJAX CARRY OVER TASKS ─────────────────────────────────
export const carryOverTasks = asyncHandler(async (req, res) => {
  const { employeeId } = req.session.user;
  const { tanggalHariIni } = req.body;

  if (!tanggalHariIni) {
    return res
      .status(400)
      .json({ success: false, message: "Parameter tanggal hari ini wajib dikirim." });
  }

  const result = await carryOverPendingTasks(employeeId, tanggalHariIni);

  if (result.count === 0) {
    return res
      .status(200)
      .json({ success: true, message: "Tidak ada tugas pending lama yang perlu disalin." });
  }

  return res.status(201).json({
    success: true,
    message: `Berhasil mendeteksi data tanggal ${result.sourceDate} & menyalin ${result.count} tugas ke hari ini.`,
  });
});

// ─── METHOD 6: REVIEW PAGE VIEW ──────────────────────────────────────
export const renderReviewPage = asyncHandler(async (req, res) => {
  const { role, roleId } = req.session.user;

  const allowedRoles = [
    "WAKIL_DIREKTUR",
    "DIREKTUR_UTAMA",
    "MANAGER_ADMINISTRASI",
    "MANAGER_KEUANGAN",
    "MANAGER_HAJI_UMRAH",
  ];
  if (!allowedRoles.includes(role)) {
    return res.redirect("/dashboard?error=UNAUTHORIZED_ACCESS");
  }

  const bidangs = await getReviewerBidangFilter(role, roleId);

  return res.render("daily-activity/review", {
    ...buildRenderData(req, {
      title: "Review Log Aktivitas Pegawai",
      bidangs,
    }),
  });
});

// ─── METHOD 7: AJAX GET REVIEW DATA FOR ATASAN ───────────────────────
export const getReviewData = asyncHandler(async (req, res) => {
  const { role, roleId } = req.session.user;
  const { tanggal } = req.query;

  if (!tanggal) {
    return res
      .status(400)
      .json({ success: false, message: "Parameter tanggal peninjauan wajib disertakan." });
  }

  const reportData = await generateReviewReport({ role, roleId, query: req.query });
  return res.status(200).json({ success: true, data: reportData });
});
