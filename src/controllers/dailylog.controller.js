import DailyLog from "../models/DailyLog.js";
import moment from "moment";

/**
 * 1. RENDER: Menampilkan halaman utama log harian (EJS View)
 * GET /daily-log
 */
export const renderDailyLogPage = async (req, res) => {
  try {
    const tanggalHariIni = moment().format("YYYY-MM-DD");
    const userId = req.session.user?._id;

    if (!userId) {
      return res.redirect("/?error=SESSION_EXPIRED");
    }

    const logs = await DailyLog.find({ userId, tanggal: tanggalHariIni }).sort({ createdAt: 1 });

    return res.render("dailylog/daily-log", {
      user: req.session.user,
      initialLogs: logs,
      title: "Daily Log",
      error: null,
      tanggalHariIni: tanggalHariIni,
    });
  } catch (error) {
    console.error("Error Render Daily Log Page:", error);
    return res.redirect("/dashboard?error=SERVER_ERROR");
  }
};

/**
 * 2. API JSON: Mengambil data log via AJAX Fetch (ketika user mengubah tanggal)
 * GET /daily-log/api/data
 */
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

    const logs = await DailyLog.find({ userId, tanggal }).sort({ createdAt: 1 });

    return res.status(200).json({ success: true, data: logs });
  } catch (error) {
    console.error("Error Get Daily Log API:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};

/**
 * NEW!!
 * 3. POST API: Membuat aktivitas harian baru
 * POST /daily-log/api/data
 */
export const createActivity = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Sesi habis, silakan login kembali." });
    }

    const { tanggal, judul, kategori } = req.body;

    if (!tanggal || !judul) {
      return res.status(400).json({ success: false, message: "Tanggal dan judul wajib diisi." });
    }

    const newLog = await DailyLog.create({
      userId,
      tanggal,
      judul,
      kategori: kategori || "Core Task",
      status: "Pending", // Default awal pengerjaan
      penjelasanHasil: "",
      fileLampiran: "",
    });

    return res.status(201).json({
      success: true,
      message: "Aktivitas baru berhasil disimpan.",
      data: newLog,
    });
  } catch (error) {
    console.error("Error Create Activity:", error);
    return res
      .status(500)
      .json({ success: false, message: "Gagal menyimpan aktivitas ke server." });
  }
};

/**
 * 4. PUT: Memperbarui data/status aktivitas (Mendukung file upload & form expand)
 * PUT /daily-log/api/:id
 */
export const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Sesi habis, silakan login kembali." });
    }

    const { judul, kategori, status, penjelasanHasil } = req.body;

    let fileLampiran = req.body.fileLampiran;
    if (req.file) {
      fileLampiran = req.file.filename;
    }

    const updatedLog = await DailyLog.findOneAndUpdate(
      { _id: id, userId },
      {
        judul,
        kategori,
        status,
        penjelasanHasil: penjelasanHasil || "",
        ...(req.file && { fileLampiran }),
      },
      { new: true, runValidators: true }
    );

    if (!updatedLog) {
      return res.status(404).json({ success: false, message: "Data aktivitas tidak ditemukan." });
    }

    return res.status(200).json({
      success: true,
      message: "Aktivitas berhasil diperbarui.",
      data: updatedLog,
    });
  } catch (error) {
    console.error("Error Update Activity:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};

/**
 * 5. POST: Menyalin Tugas Pending/In Progress dari Hari Kemarin (Carry Over)
 * POST /daily-log/api/carry-over
 */
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
      return res.status(200).json({
        success: true,
        message: "Tidak ada tugas tertunda dari hari kemarin.",
      });
    }

    const tugasHariIni = await DailyLog.find({ userId, tanggal: tanggalHariIni });
    const judulHariIniSet = new Set(tugasHariIni.map((t) => t.judul.toLowerCase().trim()));

    const dataDisalin = [];
    tugasTertunda.forEach((task) => {
      const normalTitle = task.judul.toLowerCase().trim();

      if (!judulHariIniSet.has(normalTitle)) {
        dataDisalin.push({
          userId: userId,
          tanggal: tanggalHariIni,
          kategori: task.kategori,
          judul: task.judul,
          status: "Pending",
          penjelasanHasil: "",
          fileLampiran: "",
        });
      }
    });

    if (dataDisalin.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Semua tugas pending kemarin sudah disalin sebelumnya ke hari ini.",
      });
    }

    await DailyLog.insertMany(dataDisalin);

    return res.status(201).json({
      success: true,
      message: `Berhasil menyalin ${dataDisalin.length} tugas tertunda ke hari ini.`,
    });
  } catch (error) {
    console.error("Error Carry Over Tasks:", error);
    return res.status(500).json({ success: false, message: "Terjadi kesalahan server." });
  }
};
