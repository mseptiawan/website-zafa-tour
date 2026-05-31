import DailyLog from "../models/DailyLog.model.js";
import moment from "moment";
import KpiTemplate from "../models/kpi/KpiTemplate.model.js";
import KpiTemplateDetail from "../models/kpi/KpiTemplateDetail.model.js";
import UnitKpiMapping from "../models/kpi/UnitKpiMapping.model.js";
import Employee from "../models/employee/Employee.model.js";
export const renderDailyLogPage = async (req, res) => {
  try {
    const userId = req.session.user?._id;

    const employee = await Employee.findOne({ userId: userId }).populate("careerData"); // Menggunakan virtual yang sudah Anda buat

    if (!employee || !employee.careerData) {
      return res.redirect("/dashboard?error=NO_CAREER_DATA");
    }

    const { unitId, positionId } = employee.careerData;

    const mapping = await UnitKpiMapping.findOne({ unitId, positionId });

    let kpiDetails = [];
    if (mapping) {
      kpiDetails = await KpiTemplateDetail.find({
        kpiTemplateId: mapping.kpiTemplateId,
      });
    }

    const logs = await DailyLog.find({ userId, tanggal: moment().format("YYYY-MM-DD") }).populate({
      path: "kpiTemplateId",
      model: "KpiTemplateDetail",
    });

    return res.render("dailylog/daily-log", {
      user: req.session.user,
      initialLogs: logs,
      initialKpis: kpiDetails,
      title: "Lembar Kerja",
    });
  } catch (error) {
    console.error("DEBUG ERROR:", error);
    return res.redirect("/dashboard?error=SERVER_ERROR");
  }
};
export const getDailyLogApi = async (req, res) => {
  try {
    const { tanggal } = req.query;
    if (!tanggal) {
      return res.status(400).json({ success: false, message: "Parameter tanggal wajib diisi." });
    }

    const userId = req.session.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Sesi habis, silakan login kembali." });
    }

    const logs = await DailyLog.find({ userId, tanggal })
      .sort({ createdAt: 1 })
      .populate({ path: "kpiTemplateId", model: "KpiTemplateDetail" });

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error Get Daily Log API:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};

export const createActivity = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Sesi habis, silakan login kembali." });
    }

    const { tanggal, judul, kpiTemplateId } = req.body;
    if (!tanggal || !judul || !kpiTemplateId) {
      return res
        .status(400)
        .json({ success: false, message: "Tanggal, judul, dan KPI wajib diisi." });
    }

    const employee = await Employee.findOne({ userId }).populate("careerData");
    if (!employee || !employee.careerData) {
      return res.status(403).json({ success: false, message: "Data karier tidak ditemukan." });
    }

    const mapping = await UnitKpiMapping.findOne({
      unitId: employee.careerData.unitId,
      positionId: employee.careerData.positionId,
    });

    const isAllowed = await KpiTemplateDetail.findOne({
      _id: kpiTemplateId,
      kpiTemplateId: mapping.kpiTemplateId,
    });

    if (!isAllowed) {
      return res
        .status(403)
        .json({ success: false, message: "KPI tidak sesuai dengan unit kerja Anda." });
    }

    const newLog = await DailyLog.create({
      userId,
      tanggal,
      judul,
      kpiTemplateId,
      status: "Pending",
      penjelasanHasil: "",
      fileLampiran: "",
    });

    return res
      .status(201)
      .json({ success: true, message: "Aktivitas berhasil disimpan.", data: newLog });
  } catch (error) {
    console.error("Error Create Activity:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan aktivitas ke server." });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Sesi habis, silakan login kembali." });
    }

    const { judul, status, penjelasanHasil, kpiTemplateId } = req.body;

    if (kpiTemplateId) {
      const employee = await Employee.findOne({ userId }).populate("careerData");
      const mapping = await UnitKpiMapping.findOne({
        unitId: employee.careerData.unitId,
        positionId: employee.careerData.positionId,
      });
      const isAllowed = await KpiTemplateDetail.findOne({
        _id: kpiTemplateId,
        kpiTemplateId: mapping.kpiTemplateId,
      });
      if (!isAllowed)
        return res.status(403).json({ success: false, message: "Akses KPI ditolak." });
    }

    const updatedLog = await DailyLog.findOneAndUpdate(
      { _id: id, userId },
      {
        judul,
        status,
        penjelasanHasil: penjelasanHasil || "",
        ...(kpiTemplateId && { kpiTemplateId }),
        ...(req.file && { fileLampiran: req.file.filename }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ success: false, message: "Data aktivitas tidak ditemukan." });
    }

    return res
      .status(200)
      .json({ success: true, message: "Aktivitas berhasil diperbarui.", data: updatedLog });
  } catch (error) {
    console.error("Error Update Activity:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};

export const carryOverTasks = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Sesi habis, silakan login kembali." });
    }

    const { tanggalHariIni } = req.body;
    if (!tanggalHariIni) {
      return res.status(400).json({ success: false, message: "Tanggal hari ini wajib dikirim." });
    }

    const tanggalKemarin = moment(tanggalHariIni).subtract(1, "days").format("YYYY-MM-DD");

    const tugasTertunda = await DailyLog.find({
      userId,
      tanggal: tanggalKemarin,
      status: { $in: ["Pending", "In Progress"] },
    });

    if (tugasTertunda.length === 0) {
      return res.status(200).json({ success: true, message: "Tidak ada tugas tertunda." });
    }

    const tugasHariIni = await DailyLog.find({ userId, tanggal: tanggalHariIni });
    const judulHariIniSet = new Set(tugasHariIni.map((t) => t.judul.toLowerCase().trim()));

    const dataDisalin = tugasTertunda
      .filter((task) => !judulHariIniSet.has(task.judul.toLowerCase().trim()))
      .map((task) => ({
        userId,
        tanggal: tanggalHariIni,
        kpiTemplateId: task.kpiTemplateId,
        judul: task.judul,
        status: "Pending",
        penjelasanHasil: "",
        fileLampiran: "",
      }));

    if (dataDisalin.length === 0) {
      return res.status(200).json({ success: true, message: "Semua tugas pending sudah disalin." });
    }

    await DailyLog.insertMany(dataDisalin);
    return res
      .status(201)
      .json({ success: true, message: `Berhasil menyalin ${dataDisalin.length} tugas.` });
  } catch (error) {
    console.error("Error Carry Over Tasks:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};
