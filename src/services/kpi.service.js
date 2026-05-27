import Employee from "../models/employee/Employee.model.js";
import KpiTemplateDetail from "../models/kpi/KpiTemplateDetail.js";
import KpiTemplate from "../models/kpi/KpiTemplate.js";
import Kpi from "../models/kpi/Kpi.js";
import unitKpiMapping from "../models/kpi/UnitKpiMapping.js";
import AppError from "../utils/AppError.js";

export const getEmployeesToAppraise = async () => {
  const atasan = [
    "Rafika Fitrianti",
    "Duwi Hartati",
    "Ronald Rizky",
    "Gusti Diansyah",
    "Willy Cauza",
  ];

  const employees = await Employee.find({ fullName: { $nin: atasan } })
    .populate("userId")
    .populate({
      path: "careerData",
      populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
    });

  const testMonth = 6;
  const currentPeriode = `2026-${String(testMonth).padStart(2, "0")}`;

  const existingKpis = await Kpi.find({ periode: currentPeriode });
  const evaluatedIds = existingKpis.map((k) => k.employeeId.toString());

  return { employees, evaluatedIds };
};

export const getKpiFormData = async (employeeId) => {
  const employee = await Employee.findById(employeeId)
    .populate("userId")
    .populate({
      path: "careerData",
      populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
    });

  if (!employee) {
    throw new AppError("Employee tidak ditemukan", 404);
  }

  if (!employee.careerData || !employee.careerData.unitId || !employee.careerData.positionId) {
    throw new AppError("Data karier, unit, atau posisi pegawai belum diatur.", 404);
  }

  const mapping = await unitKpiMapping.findOne({
    unitId: employee.careerData.unitId._id,
    positionId: employee.careerData.positionId._id,
  });

  if (!mapping) {
    throw new AppError("Mapping KPI tidak ditemukan", 404);
  }

  const kpiTemplate = await KpiTemplate.findById(mapping.kpiTemplateId);

  if (!kpiTemplate) {
    throw new AppError("KPI Template tidak ditemukan", 404);
  }

  const kpiDetails = await KpiTemplateDetail.find({
    kpiTemplateId: kpiTemplate._id,
  });

  return { employee, kpiDetails };
};

export const processKpiSubmission = async (employeeId, payload, userId) => {
  const { periode, kpiTemplateId, scores } = payload;

  const bulan = periode.split("-")[1];
  const isTesting = true;
  if (!["03", "06", "09", "12"].includes(bulan) && !isTesting) {
    throw new AppError("Penilaian hanya bisa dilakukan pada bulan 03, 06, 09, atau 12.", 400);
  }

  const existingKpi = await Kpi.findOne({ employeeId, periode });
  if (existingKpi) {
    throw new AppError("KPI periode ini sudah ada.", 400);
  }

  const templateDetails = await KpiTemplateDetail.find({ kpiTemplateId });
  const totalBobot = templateDetails.reduce((sum, item) => sum + item.bobot, 0);

  let totalKpiScore = 0;
  const results = templateDetails.map((detail) => {
    const scoreInput = Number(scores[detail._id]?.score) || 0;
    const finalScore = scoreInput * (detail.bobot / totalBobot);
    totalKpiScore += finalScore;

    return {
      kpiTemplateDetailId: detail._id,
      areaKinerja: detail.areaKinerja,
      indikator: detail.indikator,
      bobot: detail.bobot,
      target: detail.target,
      realisasi: "Manual Input",
      score: scoreInput,
      finalScore: Number(finalScore.toFixed(2)),
    };
  });

  await Kpi.create({
    employeeId,
    periode,
    kpiTemplateId,
    results,
    totalKpiScore: Number(totalKpiScore.toFixed(2)),
    evaluatedBy: userId,
    status: "Approved",
  });
};

export const getAllKpiHistory = async () => {
  return await Kpi.find({}).populate("employeeId", "fullName careerData").sort({ createdAt: -1 });
};

export const getKpiHistoryDetail = async (employeeId, periode) => {
  const kpi = await Kpi.findOne({ employeeId, periode })
    .populate("employeeId", "fullName")
    .populate("evaluatedBy", "name");

  if (!kpi) {
    throw new AppError("Data tidak ditemukan", 404);
  }

  return kpi;
};
