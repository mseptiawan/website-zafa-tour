import * as kpiService from "../services/kpi.service.js";

export const getAppraisalList = async (req, res, next) => {
  try {
    const { employees, evaluatedIds } = await kpiService.getEmployeesToAppraise();

    res.render("kpi/appraisal-list", {
      employees,
      evaluatedIds,
      user: req.session.user,
      title: "Input KPI Pegawai",
    });
  } catch (error) {
    res.status(error.statusCode || 500).render("error", {
      title: "Terjadi Kesalahan",
      message:
        error.statusCode === 500
          ? "Maaf, sistem sedang mengalami gangguan. Mohon coba beberapa saat lagi."
          : error.message,
      statusCode: error.statusCode || 500,
    });
  }
};

export const getAppraisalForm = async (req, res, next) => {
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
    res.status(error.statusCode || 500).render("error", {
      title: "Terjadi Kesalahan",
      message:
        error.statusCode === 500
          ? "Maaf, sistem sedang mengalami gangguan. Mohon coba beberapa saat lagi."
          : error.message,
      statusCode: error.statusCode || 500,
    });
  }
};

export const submitAppraisal = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const userId = req.session.user?._id;

    await kpiService.processKpiSubmission(employeeId, req.body, userId);

    res.redirect("/kpi/history-list");
  } catch (error) {
    res.status(error.statusCode || 500).render("error", {
      title: "Terjadi Kesalahan",
      message:
        error.statusCode === 500
          ? "Maaf, sistem sedang mengalami gangguan. Mohon coba beberapa saat lagi."
          : error.message,
      statusCode: error.statusCode || 500,
    });
  }
};

export const getHistoryList = async (req, res, next) => {
  try {
    const kpiList = await kpiService.getAllKpiHistory();

    res.render("kpi/history-list", { title: "daftar kpi Pegawai", kpiList });
  } catch (error) {
    res.status(error.statusCode || 500).render("error", {
      title: "Terjadi Kesalahan",
      message:
        error.statusCode === 500
          ? "Maaf, sistem sedang mengalami gangguan. Mohon coba beberapa saat lagi."
          : error.message,
      statusCode: error.statusCode || 500,
    });
  }
};

export const getHistoryDetail = async (req, res, next) => {
  try {
    const { employeeId, periode } = req.params;
    const kpi = await kpiService.getKpiHistoryDetail(employeeId, periode);

    res.render("kpi/history-detail", { title: "Daftar detail kpi", kpi });
  } catch (error) {
    res.status(error.statusCode || 500).render("error", {
      title: "Terjadi Kesalahan",
      message:
        error.statusCode === 500
          ? "Maaf, sistem sedang mengalami gangguan. Mohon coba beberapa saat lagi."
          : error.message,
      statusCode: error.statusCode || 500,
    });
  }
};
export const getMyKpiHistory = async (req, res, next) => {
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
    res.status(error.statusCode || 500).render("error", {
      title: "Terjadi Kesalahan",
      message: error.message,
      statusCode: error.statusCode || 500,
    });
  }
};
