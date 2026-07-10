import * as kpiService from "../services/kpi.service.js";

// GET /api/kpi/appraisals
export const indexAppraisal = async (req, res, next) => {
  try {
    const { employees, evaluatedIds } = await kpiService.getEmployeesToAppraise();

    res.render("kpi/appraisal-list", {
      employees,
      evaluatedIds,
      user: req.session.user,
      title: "Input KPI Pegawai",
    });
  } catch (error) {
    next(error); // Disarankan melempar ke global error handler middleware jika ada
  }
};

// GET /api/kpi/appraisals/form/:employeeId
export const createAppraisal = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { employee, kpiDetails } = await kpiService.getKpiFormData(employeeId);

    res.render("kpi/appraisal-form", {
      employee,
      kpiDetails,
      title: `Input KPI - ${employee.fullName}`,
      user: req.session.user,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/kpi/appraisals/:employeeId
// Catatan: Jika mengikuti saran rute sebelumnya tanpa parameter di URL, sesuaikan req.body-nya
export const storeAppraisal = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const userId = req.session.user?._id;

    await kpiService.processKpiSubmission(employeeId, req.body, userId);

    res.redirect("/kpi/histories"); // Sesuaikan dengan nama rute baru Anda
  } catch (error) {
    next(error);
  }
};

// GET /api/kpi/histories
export const indexHistory = async (req, res, next) => {
  try {
    const kpiList = await kpiService.getAllKpiHistory();
    res.render("kpi/history-list", { title: "Daftar KPI Pegawai", kpiList });
  } catch (error) {
    next(error);
  }
};

// GET /api/kpi/histories/:employeeId/:periode
export const showHistory = async (req, res, next) => {
  try {
    const { employeeId, periode } = req.params;
    const kpi = await kpiService.getKpiHistoryDetail(employeeId, periode);

    res.render("kpi/history-detail", { title: "Daftar Detail KPI", kpi });
  } catch (error) {
    next(error);
  }
};

// GET /api/kpi/my-histories
export const showMyHistory = async (req, res, next) => {
  try {
    const employeeId = req.session.user?.employeeId;

    if (!employeeId) {
      return res.status(403).send("Akses ditolak: Data pegawai tidak ditemukan pada session Anda.");
    }

    const kpiList = await kpiService.getKpiHistoryByEmployee(employeeId);

    res.render("kpi/my-history", {
      title: "Riwayat KPI Saya",
      kpiList,
    });
  } catch (error) {
    next(error);
  }
};
