import DailyLog from "../models/DailyLog.model.js";
import moment from "moment";
import KpiTemplate from "../models/kpi/KpiTemplate.model.js";
import KpiTemplateDetail from "../models/kpi/KpiTemplateDetail.model.js";
import UnitKpiMapping from "../models/kpi/UnitKpiMapping.model.js";
import Employee from "../models/employee/Employee.model.js";
import Bidang from "../models/basic/Bidang.model.js";
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
    if (!userId) return res.status(401).json({ success: false, message: "Sesi habis." });

    const { tanggal, judul, kpiTemplateId } = req.body;
    if (!tanggal || !judul || !kpiTemplateId) {
      return res.status(400).json({ success: false, message: "Data wajib diisi." });
    }

    let finalKpiId = kpiTemplateId;

    if (kpiTemplateId === "lainnya") {
      finalKpiId = null; // Set null jika memilih lainnya
    } else {
      const employee = await Employee.findOne({ userId }).populate("careerData");
      const mapping = await UnitKpiMapping.findOne({
        unitId: employee.careerData.unitId,
        positionId: employee.careerData.positionId,
      });

      const isAllowed = await KpiTemplateDetail.findOne({
        _id: kpiTemplateId,
        kpiTemplateId: mapping.kpiTemplateId,
      });

      if (!isAllowed) {
        return res.status(403).json({ success: false, message: "KPI tidak sesuai." });
      }
    }

    const newLog = await DailyLog.create({
      userId,
      tanggal,
      judul,
      kpiTemplateId: finalKpiId,
      status: "Pending",
      penjelasanHasil: "",
      fileLampiran: "",
    });

    return res
      .status(201)
      .json({ success: true, message: "Aktivitas berhasil disimpan.", data: newLog });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Gagal menyimpan aktivitas." });
  }
};

export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Sesi habis." });

    const { judul, status, penjelasanHasil, kpiTemplateId } = req.body;
    let finalKpiId = kpiTemplateId;

    if (kpiTemplateId === "lainnya") {
      finalKpiId = null;
    } else if (kpiTemplateId) {
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
        kpiTemplateId: finalKpiId,
        ...(req.file && { fileLampiran: req.file.filename }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedLog)
      return res.status(404).json({ success: false, message: "Data tidak ditemukan." });

    return res
      .status(200)
      .json({ success: true, message: "Aktivitas berhasil diperbarui.", data: updatedLog });
  } catch (error) {
    console.error(error);
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

    // [LOGIKA CERDAS BARU]
    // Cari 1 data tugas terakhir sebelum tanggal hari ini yang statusnya masih 'Pending' atau 'In Progress'
    const latestPendingTask = await DailyLog.findOne({
      userId,
      tanggal: { $lt: tanggalHariIni }, // $lt artinya Less Than (Kurang dari tanggal hari ini)
      status: { $in: ["Pending", "In Progress"] },
    }).sort({ tanggal: -1 }); // Urutkan dari yang paling baru mendekati hari ini

    // Jika setelah dicari ke hari-hari ke belakang ternyata tidak ada tugas pending sama sekali
    if (!latestPendingTask) {
      return res
        .status(200)
        .json({ success: true, message: "Tidak ada tugas tertunda dari hari-hari sebelumnya." });
    }

    // Ambil tanggal target dari data yang ditemukan (bisa kemarin, kemarin lusa, atau hari kerja terakhir)
    const tanggalSumber = latestPendingTask.tanggal;

    // Ambil semua tugas tertunda yang ada di tanggal sumber tersebut
    const tugasTertunda = await DailyLog.find({
      userId,
      tanggal: tanggalSumber,
      status: { $in: ["Pending", "In Progress"] },
    });

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
      return res.status(200).json({
        success: true,
        message: "Semua tugas pending dari hari sebelumnya sudah disalin.",
      });
    }

    await DailyLog.insertMany(dataDisalin);
    return res.status(201).json({
      success: true,
      message: `Berhasil mendeteksi data tanggal ${tanggalSumber} & menyalin ${dataDisalin.length} tugas.`,
    });
  } catch (error) {
    console.error("Error Carry Over Tasks:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};

export const renderReviewPage = async (req, res) => {
  try {
    const role = req.session.user.role;

    // Daftar role yang diizinkan buka halaman ini
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

    // Ambil daftar bidang untuk filter dropdown di frontend
    let filterBidang = [];
    if (["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(role)) {
      filterBidang = await Bidang.find().lean();
    } else {
      // Jika dia Manager, hanya tampilkan Bidang yang managerRoleId-nya cocok dengan roleId dia
      filterBidang = await Bidang.find({ managerRoleId: req.session.user.roleId }).lean();
    }

    res.render("dailylog/review", {
      title: "Review Log Aktivitas Pegawai",
      user: req.session.user,
      bidangs: filterBidang,
    });
  } catch (error) {
    console.error("Render Review Page Error:", error);
    return res.redirect("/dashboard?error=SERVER_ERROR");
  }
};

// API Fetch Data Laporan Harian
export const getReviewDataApi = async (req, res) => {
  try {
    const { tanggal, bidangId } = req.query;
    const userRole = req.session.user.role;
    const userRoleId = req.session.user.roleId;

    let targetBidangIds = [];

    // TENTUKAN HAK AKSES BIDANG
    if (["WAKIL_DIREKTUR", "DIREKTUR_UTAMA"].includes(userRole)) {
      if (bidangId) {
        targetBidangIds.push(bidangId);
      } else {
        const allBidang = await Bidang.find().select("_id");
        targetBidangIds = allBidang.map((b) => b._id);
      }
    } else {
      // Manager HANYA boleh melihat Bidang miliknya
      const managedBidangs = await Bidang.find({ managerRoleId: userRoleId }).select("_id");
      targetBidangIds = managedBidangs.map((b) => b._id);

      // Jika dia memfilter bidang, pastikan bidang yg difilter adalah miliknya
      if (bidangId && targetBidangIds.some((id) => id.toString() === bidangId)) {
        targetBidangIds = [bidangId];
      }
    }

    // CARI KARYAWAN BERDASARKAN BIDANG
    const employees = await Employee.find()
      .populate("userId")
      .populate({
        path: "careerData",
        match: { bidangId: { $in: targetBidangIds } },
        populate: { path: "bidangId", select: "name" },
      });

    // Buang karyawan yang tidak cocok dengan filter bidang (careerData akan null jika tidak match)
    const validEmployees = employees.filter((emp) => emp.careerData !== null);
    const userIds = validEmployees.map((emp) => emp.userId._id);

    // CARI LOG AKTIVITAS KARYAWAN TERSEBUT PADA TANGGAL TERPILIH
    const logs = await DailyLog.find({
      userId: { $in: userIds },
      tanggal: tanggal,
    }).populate({ path: "kpiTemplateId", model: "KpiTemplateDetail" });

    // SUSUN DATA UNTUK DITAMPILKAN DI TABEL
    // SUSUN DATA UNTUK DITAMPILKAN DI TABEL
    const reportData = validEmployees.map((emp) => {
      const empLogs = logs.filter((log) => log.userId.toString() === emp.userId._id.toString());

      // 1. Hitung Keseluruhan Tugas (Termasuk "Lainnya" agar tetap muncul di kolom Selesai/Pending)
      const validTasks = empLogs.filter((t) => t.status !== "Canceled");
      const completedTasks = validTasks.filter((t) => t.status === "Completed");
      const pendingTasks = empLogs.filter(
        (t) => t.status === "Pending" || t.status === "In Progress"
      );

      // 2. LOGIKA BARU: Filter Khusus untuk Hitungan KPI (Abaikan aktivitas "Lainnya" / null)
      const kpiTasksOnly = validTasks.filter((t) => t.kpiTemplateId !== null);
      const completedKpiTasks = kpiTasksOnly.filter((t) => t.status === "Completed");

      // 3. Hitung Persentase HANYA dari tugas yang memiliki KPI
      let kpiPercentage = 0;
      if (kpiTasksOnly.length > 0) {
        kpiPercentage = Math.round((completedKpiTasks.length / kpiTasksOnly.length) * 100);
      }

      return {
        _id: emp._id,
        fullName: emp.fullName,
        bidang: emp.careerData.bidangId.name,
        totalTasks: empLogs.length,
        completedTasks: completedTasks.length, // Teks Selesai tetap menghitung semua kerjanya
        pendingTasks: pendingTasks.length, // Teks Pending tetap menghitung semua kerjanya
        kpiPercentage: kpiPercentage, // Bar Persentase sekarang murni KPI saja
        logs: empLogs, // Rincian tugas untuk dropdown row
      };
    });

    return res.status(200).json({ success: true, data: reportData });
  } catch (error) {
    console.error("Get Review Data API Error:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan saat memuat data." });
  }
};
