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
  try {
    const { employeeId } = req.params;
    const { periode, kpiTemplateId, scores } = req.body;

    // 1. Validasi duplikasi input di periode yang sama
    const existingKpi = await Kpi.findOne({ employeeId, periode });
    if (existingKpi) {
      return res
        .status(400)
        .send("KPI untuk karyawan ini pada periode tersebut sudah pernah di-input!");
    }

    // 2. Ambil detail indikator asli dari DB
    const templateDetails = await KpiTemplateDetail.find({ kpiTemplateId });

    // Hitung total semua bobot yang ada di template ini untuk pembagi rumus proporsional
    const totalBobotTemplate = templateDetails.reduce((sum, item) => sum + item.bobot, 0);

    let totalKpiScore = 0;
    const results = [];

    // 3. Looping dan hitung skor tertimbang
    for (const detail of templateDetails) {
      // Ambil data berdasarkan ID detail
      const detailId = detail._id.toString();
      const inputData = scores[detailId];

      // PENTING: Karena input form name kita adalah scores[id][score],
      // maka inputData akan berbentuk { score: "80" }
      const scoreInput = inputData && inputData.score ? Number(inputData.score) : 0;

      // Rumus proporsional tertimbang
      const finalScore = scoreInput * (detail.bobot / totalBobotTemplate);
      totalKpiScore += finalScore;

      results.push({
        kpiTemplateDetailId: detail._id,
        areaKinerja: detail.areaKinerja,
        indikator: detail.indikator,
        bobot: detail.bobot,
        target: detail.target,
        realisasi: "Manual Input",
        score: scoreInput,
        finalScore: Number(finalScore.toFixed(2)),
      });
    }

    // 4. Simpan hasil final ke database
    await Kpi.create({
      employeeId,
      periode,
      kpiTemplateId,
      results,
      totalKpiScore: Number(totalKpiScore.toFixed(2)), // Hasil akhir di skala 0-100
      evaluatedBy: req.session.user?._id,
      status: "Approved",
    });

    // 5. Kembalikan ke halaman list utama
    res.redirect("/kpi/input");
  } catch (error) {
    console.error("Error submitKpi:", error);
    res.status(500).send("Gagal menyimpan penilaian KPI");
  }
};

export const getKpiList = async (req, res) => {
  try {
    // Mencari semua data KPI dan meng-populate data karyawan
    const kpiList = await Kpi.find({})
      .populate("employeeId", "fullName unitId") // Ambil nama & unit
      .sort({ createdAt: -1 });

    res.render("kpi/list", { kpiList });
  } catch (error) {
    res.status(500).send("Error memuat daftar KPI");
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
