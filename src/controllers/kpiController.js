import Employee from "../models/Employee.js";
import KpiTemplateDetail from "../models/KpiTemplateDetail.js";
import KpiTemplate from "../models/KpiTemplate.js";
import Kpi from "../models/Kpi.js"; // hasil penilaian (kalau belum ada, nanti aku bantu bikin)
import unitKpiMapping from "../models/UnitKpiMapping.js"; // mapping unit + posisi ke template  (nanti aku bantu bikin juga)
// =============================
// LIST EMPLOYEE (INPUT KPI)
// =============================

export const kpiEmployeeList = async (req, res) => {
  const employees = await Employee.find()
    .populate("userId")
    .populate("unitId")
    .populate("bidangId");

  res.render("kpi/input-list", {
    employees,
    user: req.session.user,
    title: "Input KPI Karyawan",
  });
};

// =============================
// FORM INPUT KPI PER KARYAWAN
// =============================
export const kpiForm = async (req, res) => {
  const { employeeId } = req.params;

  const employee = await Employee.findById(employeeId)
    .populate("userId")
    .populate("unitId")
    .populate("positionId");

  if (!employee) {
    return res.status(404).send("Employee tidak ditemukan");
  }

  // 🔥 AMBIL MAPPING KPI
  const mapping = await unitKpiMapping.findOne({
    unitId: employee.unitId._id,
    positionId: employee.positionId._id,
  });

  if (!mapping) {
    return res.status(404).send("Mapping KPI tidak ditemukan");
  }

  // 🔥 AMBIL TEMPLATE
  const kpiTemplate = await KpiTemplate.findById(mapping.kpiTemplateId);

  if (!kpiTemplate) {
    return res.status(404).send("KPI Template tidak ditemukan");
  }

  // 🔥 DETAIL KPI
  const kpiDetails = await KpiTemplateDetail.find({
    kpiTemplateId: kpiTemplate._id,
  });

  res.render("kpi/input-form", {
    employee,
    kpiDetails,
    title: `Input KPI - ${employee.fullName}`,
    user: req.session.user, // lebih benar dari req.user
  });
};

// =============================
// SUBMIT KPI
// =============================
export const submitKpi = async (req, res) => {
  const { employeeId } = req.params;

  const data = req.body; // array nilai KPI

  // nanti disimpan ke collection KPI (history)
  // simple dulu
  console.log(employeeId, data);

  res.redirect("/kpi/input");
};

// =============================
// KELOLA KPI
// =============================
export const kpiManage = async (req, res) => {
  res.render("kpi/manage", {
    user: req.user,
  });
};

// =============================
// LAPORAN KPI
// =============================
export const kpiReport = async (req, res) => {
  res.render("kpi/report", {
    user: req.user,
  });
};
