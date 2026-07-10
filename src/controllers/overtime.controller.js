import { asyncHandler } from "../utils/asyncHandler.js";
import { buildRenderData } from "../utils/renderHelper.js";
import { getPayrollPeriod } from "../utils/payrollPeriod.js";
import { Overtime } from "../models/Overtime.model.js";
import Employee from "../models/employee/Employee.model.js";
import {
  createOvertime,
  findMineOvertime,
  findManagerApprovalList,
} from "../services/overtime.service.js";

export const renderCreateOvertimeForm = asyncHandler(async (req, res) => {
  const today = new Date();
  const backLimit = new Date();
  backLimit.setDate(today.getDate() - 7);
  const period = getPayrollPeriod(today);
  const minAllowed = new Date(Math.max(backLimit.getTime(), period.start.getTime()));

  const formatDate = (d) => d.toISOString().split("T")[0];

  res.render("overtime/create", {
    ...buildRenderData(req, {
      title: "Catat Lembur",
      dateLimit: { min: formatDate(minAllowed), max: formatDate(today) },
    }),
  });
});

export const storeOvertime = asyncHandler(async (req, res) => {
  if (req.validationErrors) {
    const today = new Date();
    const backLimit = new Date();
    backLimit.setDate(today.getDate() - 7);
    const period = getPayrollPeriod(today);
    const minAllowed = new Date(Math.max(backLimit.getTime(), period.start.getTime()));
    const formatDate = (d) => d.toISOString().split("T")[0];

    return res.status(400).render("overtime/new", {
      ...buildRenderData(req, {
        title: "Catat Lembur",
        errors: req.validationErrors,
        old: req.body,
        dateLimit: { min: formatDate(minAllowed), max: formatDate(today) },
      }),
    });
  }

  await createOvertime({ user: req.session.user, body: req.body, file: req.file });
  req.flash("success", "Pengajuan lembur berhasil dikirim!");
  return res.redirect("/overtime/my");
});

export const getMyOvertime = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const { data: overtimes, meta } = await findMineOvertime({
    userId: req.session.user._id,
    page,
    limit,
  });

  res.render("overtime/history", {
    ...buildRenderData(req, {
      title: "Riwayat Lembur",
      overtimes,
      pagination: meta,
      query: req.query,
    }),
  });
});

export const approvalOvertimePage = asyncHandler(async (req, res) => {
  const tab = req.query.tab || "active";
  const { active, history } = await findManagerApprovalList({
    user: req.session.user,
    query: req.query,
  });

  res.render("overtime/approvals", {
    ...buildRenderData(req, {
      title: "Pusat Approval Lembur",
      activeOvertimes: active.data,
      historyOvertimes: history.data,
      activePagination: active.meta,
      historyPagination: history.meta,
      tab,
      query: req.query,
    }),
  });
});

export const approveManagerOvertime = asyncHandler(async (req, res) => {
  const overtime = await Overtime.findById(req.params.id);
  if (!overtime) return res.status(404).send("Data tidak ditemukan");

  const userRole = req.session.user.role;
  if (userRole !== overtime.requiredManagerRole) {
    return res.status(403).send("Anda tidak berhak approve lembur ini");
  }

  const employeeData = await Employee.findById(overtime.employeeId).lean();
  if (!employeeData) return res.status(404).send("Data karyawan tidak ditemukan");

  overtime.overtimeRateSnapshot = employeeData.financialData?.overtimeRate || 0;
  overtime.multiplierSnapshot = 1.5;
  overtime.status = "APPROVED";
  overtime.payrollStatus = "PENDING";
  overtime.approvedBy = req.session.user._id;
  overtime.approvedAt = new Date();

  overtime.approvalHistory.push({
    action: "APPROVED",
    by: req.session.user._id,
    role: userRole,
    note: req.body.note?.trim() || null,
    at: new Date(),
  });

  await overtime.save();
  req.flash("success", "Pengajuan lembur berhasil disetujui!");
  return res.redirect("/overtime/approval");
});

export const rejectOvertime = asyncHandler(async (req, res) => {
  const overtime = await Overtime.findById(req.params.id);
  if (!overtime) return res.status(404).send("Data tidak ditemukan");

  const userRole = req.session.user.role;
  if (userRole !== overtime.requiredManagerRole) {
    return res.status(403).send("Anda tidak berhak reject lembur ini");
  }

  overtime.status = "REJECTED";
  overtime.payrollStatus = "LOCKED";
  overtime.approvedBy = req.session.user._id;
  overtime.approvedAt = new Date();

  overtime.approvalHistory.push({
    action: "REJECTED",
    by: req.session.user._id,
    role: userRole,
    note: req.body.note?.trim() || null,
    at: new Date(),
  });

  await overtime.save();
  req.flash("error", "Pengajuan lembur telah ditolak.");
  return res.redirect("/overtime/approval");
});

export const getOvertimeDetail = asyncHandler(async (req, res) => {
  const overtime = await Overtime.findById(req.params.id).populate("approvalHistory.by");
  if (!overtime) return res.status(404).send("Data tidak ditemukan");

  const employee = await Employee.findOne({ userId: overtime.userId }).populate({
    path: "careerData",
    populate: [{ path: "bidangId" }, { path: "unitId" }],
  });

  res.render("overtime/detail", {
    ...buildRenderData(req, {
      title: "Detail Aktivitas Lembur",
      overtime,
      employee,
    }),
  });
});
