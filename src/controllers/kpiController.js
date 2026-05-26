import Employee from "../models/employee/Employee.model.js";
import KpiTemplateDetail from "../models/kpi/KpiTemplateDetail.js";
import KpiTemplate from "../models/kpi/KpiTemplate.js";
import Kpi from "../models/kpi/Kpi.js"; // hasil penilaian (kalau belum ada, nanti aku bantu bikin)
import unitKpiMapping from "../models/kpi/UnitKpiMapping.js"; // mapping unit + posisi ke template  (nanti aku bantu bikin juga)
// =============================
// LIST EMPLOYEE (INPUT KPI)
// =============================

export const kpiEmployeeList = async (req, res) => {
  try {
    // 1. Daftar nama atasan yang tidak perlu dinilai
    const atasan = [
      "Rafika Fitrianti",
      "Duwi Hartati",
      "Ronald Rizky",
      "Gusti Diansyah",
      "Willy Cauza",
    ];

    // 2. Ambil data Pegawai selain yang ada di daftar atasan
    const employees = await Employee.find({ fullName: { $nin: atasan } })
      .populate("userId")
      .populate("unitId")
      .populate("bidangId");

    // 3. Periode penilaian (Simulasi testMonth = 6)
    const testMonth = 6;
    const currentPeriode = `2026-${String(testMonth).padStart(2, "0")}`;

    const existingKpis = await Kpi.find({ periode: currentPeriode });
    const evaluatedIds = existingKpis.map((k) => k.employeeId.toString());

    // 4. Render ke view
    res.render("kpi/input-list", {
      employees,
      evaluatedIds,
      user: req.session.user,
      title: "Input KPI Pegawai",
    });
  } catch (error) {
    console.error("Error kpiEmployeeList:", error);
    res.status(500).send("Gagal memuat daftar Pegawai.");
  }
};

// =============================
// FORM INPUT KPI PER Pegawai
// =============================
export const kpiForm = async (req, res) => {
  const { employeeId } = req.params;

  const employee = await Employee.findById(employeeId)
    .populate("userId")
    .populate({
      path: "careerData",
      populate: [{ path: "bidangId" }, { path: "unitId" }, { path: "positionId" }],
    });

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
  try {
    const { employeeId } = req.params;
    const { periode, kpiTemplateId, scores } = req.body;

    // 1. Validasi periode (Maret, Juni, Sept, Des)
    const bulan = periode.split("-")[1];
    const isTesting = true;
    if (!["03", "06", "09", "12"].includes(bulan) && !isTesting) {
      return res.status(400).send("Penilaian hanya bisa dilakukan pada bulan 03, 06, 09, atau 12.");
    }

    // 2. Validasi duplikasi
    const existingKpi = await Kpi.findOne({ employeeId, periode });
    if (existingKpi) return res.status(400).send("KPI periode ini sudah ada.");

    // 3. Proses perhitungan
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

    // 4. Simpan ke database
    await Kpi.create({
      employeeId,
      periode,
      kpiTemplateId,
      results,
      totalKpiScore: Number(totalKpiScore.toFixed(2)),
      evaluatedBy: req.session.user?._id,
      status: "Approved",
    });

    res.redirect("/kpi/input");
  } catch (error) {
    console.error(error);
    res.status(500).send("Gagal menyimpan data.");
  }
};

export const getKpiList = async (req, res) => {
  try {
    const kpiList = await Kpi.find({})
      .populate("employeeId", "fullName unitId") // Ambil nama & unit
      .sort({ createdAt: -1 });

    res.render("kpi/list", { title: "daftar kpi Pegawai", kpiList });
  } catch (error) {
    res.status(500).send("Error memuat daftar KPI");
  }
};

export const getKpiDetail = async (req, res) => {
  try {
    const { employeeId, periode } = req.params;
    const kpi = await Kpi.findOne({ employeeId, periode })
      .populate("employeeId", "fullName")
      .populate("evaluatedBy", "name"); // Asumsi ada model User untuk HR

    if (!kpi) return res.status(404).send("Data tidak ditemukan");

    res.render("kpi/detail", { title: "Daftar detail kpi", kpi });
  } catch (error) {
    res.status(500).send("Error memuat detail KPI");
  }
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
