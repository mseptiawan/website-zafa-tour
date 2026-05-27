import Termination from "../models/Termination.js";
import User from "../models/basic/User.js";
import Employee from "../models/employee/Employee.model.js";

export const listPendingApprovals = async (req, res) => {
  try {
    const pendingList = await Termination.find({ status: "Waiting" })
      .populate({
        path: "employeeId",
        populate: [{ path: "userId" }, { path: "positionId" }, { path: "bidangId" }],
      })
      .sort({ createdAt: -1 });

    const historyList = await Termination.find({ status: "Approved" })
      .populate({
        path: "employeeId",
        populate: [{ path: "userId" }, { path: "positionId" }, { path: "bidangId" }],
      })
      .populate("approvedBy", "username email")
      .sort({ updatedAt: -1 });

    res.render("admin/manage-center", {
      title: "Persetujuan PHK",
      pendingList,
      historyList,
    });
  } catch (error) {
    console.error("Error pada fungsi listPendingApprovals:", error);
    res.status(500).send("Terjadi kesalahan sistem saat memuat pusat otorisasi PHK.");
  }
};

export const approvePHK = async (req, res) => {
  try {
    const { terminationId } = req.params;

    const termination = await Termination.findById(terminationId).populate("employeeId");
    if (!termination) {
      return res.status(404).send("Data pengajuan PHK tidak ditemukan.");
    }

    if (termination.status !== "Waiting") {
      return res.status(400).send("Pengajuan ini sudah diproses sebelumnya.");
    }

    termination.status = "Approved";
    termination.approvedBy = req.user._id;
    await termination.save();

    await User.findByIdAndUpdate(termination.employeeId.userId, {
      isActive: false,
    });

    res.redirect("/approvals/pending");
  } catch (error) {
    console.error("Error approvePHK:", error);
    res.status(500).send("Gagal memproses persetujuan PHK.");
  }
};

export const listHistoryPHK = async (req, res) => {
  try {
    const historyList = await Termination.find({ status: "Approved" })
      .populate({
        path: "employeeId",
        populate: [{ path: "userId" }, { path: "positionId" }, { path: "bidangId" }],
      })
      .populate("approvedBy", "username email")
      .sort({ updatedAt: -1 });

    res.render("admin/approval_history", {
      title: "Riwayat PHK",
      historyList,
    });
  } catch (error) {
    console.error("Error listHistoryPHK:", error);
    res.status(500).send("Terjadi kesalahan saat memuat data riwayat.");
  }
};
