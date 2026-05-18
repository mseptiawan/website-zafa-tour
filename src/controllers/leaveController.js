import Leave from "../models/leave/Leave.model.js";
import LeaveType from "../models/leave/LeaveType.model.js";
import LeaveBalance from "../models/leave/LeaveBalance.model.js";
import User from "../models/User.js";
import Holiday from "../models/calender/Holiday.model.js";

export const showApplyLeave = async (req, res) => {
  try {
    const userId = req.user._id; // Diambil dari authMiddleware
    const currentYear = new Date().getFullYear();

    const leaveTypes = await LeaveType.find({ isActive: true });

    const employees = await User.find({ _id: { $ne: userId } }).select("name username");

    const leaveBalance = await LeaveBalance.findOne({ userId, year: currentYear });

    res.render("leave/create", {
      title: "Pengajuan Cuti Baru",
      leaveTypes,
      employees,
      leaveBalance: leaveBalance || { totalQuota: 12, used: 0, remaining: 12 },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const applyLeave = async (req, res) => {
  try {
    const userId = req.user._id;
    const { leaveTypeId, startDate, endDate, reason, handoverUserId } = req.body;
    const currentYear = new Date(startDate).getFullYear();

    const leaveType = await LeaveType.findById(leaveTypeId);
    if (!leaveType || !leaveType.isActive) {
      return res
        .status(404)
        .json({ success: false, message: "Jenis cuti tidak valid atau dinonaktifkan." });
    }

    if (leaveType.requiresAttachment && !req.file) {
      return res.status(400).json({
        success: false,
        message: `Jenis cuti ${leaveType.name} wajib mengunggah dokumen pendukung!`,
      });
    }

    const documentPath = req.file ? `/uploads/documents/${req.file.filename}` : null;

    let start = new Date(startDate);
    let end = new Date(endDate);

    if (start > end) {
      return res
        .status(400)
        .json({ success: false, message: "Tanggal mulai tidak boleh melebihi tanggal selesai." });
    }

    const holidays = await Holiday.find({
      holidayDate: { $gte: start, $lte: end },
      isActive: true,
    });
    const holidayStrings = holidays.map((h) => h.holidayDate.toISOString().split("T")[0]);

    let totalDays = 0;
    let currentLoopDate = new Date(start);

    while (currentLoopDate <= end) {
      const isSunday = currentLoopDate.getDay() === 0; // Cek hari minggu
      const dateString = currentLoopDate.toISOString().split("T")[0];
      const isHoliday = holidayStrings.includes(dateString); // Cek hari libur nasional

      if (!isSunday && !isHoliday) {
        totalDays++;
      }
      currentLoopDate.setDate(currentLoopDate.getDate() + 1);
    }

    if (totalDays === 0) {
      return res.status(400).json({
        success: false,
        message: "Durasi cuti 0 hari. Tanggal yang Anda pilih adalah hari libur/Minggu.",
      });
    }

    if (leaveType.maxDays > 0 && totalDays > leaveType.maxDays) {
      return res.status(400).json({
        success: false,
        message: `Maksimal pengambilan cuti ${leaveType.name} adalah ${leaveType.maxDays} hari.`,
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = start.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < leaveType.minAdvanceDays) {
      return res.status(400).json({
        success: false,
        message: `Pengajuan cuti ${leaveType.name} minimal dilakukan H-${leaveType.minAdvanceDays} sebelum hari pelaksanaan.`,
      });
    }

    if (leaveType.isDeductBalance) {
      const balance = await LeaveBalance.findOne({ userId, year: currentYear });
      if (!balance || totalDays > balance.remaining) {
        return res.status(400).json({
          success: false,
          message: "Sisa jatah saldo cuti tahunan Anda tidak mencukupi untuk durasi ini.",
        });
      }
    }

    const newLeave = await Leave.create({
      userId,
      leaveTypeId,
      startDate: start,
      endDate: end,
      totalDays,
      reason,
      documentPath,
      handoverUserId,
      status: "PENDING",
    });

    res.status(201).json({
      success: true,
      message: "Pengajuan cuti berhasil dikirim, menunggu verifikasi atasan.",
      data: newLeave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const myLeave = async (req, res) => {
  try {
    const userId = req.user._id;

    const myHistory = await Leave.find({ userId })
      .populate("leaveTypeId", "name code")
      .populate("handoverUserId", "name")
      .sort({ createdAt: -1 });

    res.render("leave/my-history", {
      title: "Riwayat Cuti Saya",
      leaves: myHistory,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
