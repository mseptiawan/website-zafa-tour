import Termination from "../models/Termination.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

/**
 * Menampilkan halaman daftar pengajuan PHK yang berstatus 'Waiting'
 */
export const listPendingApprovals = async (req, res) => {
  try {
    // Ambil data termination yang butuh approval, sekalian relasikan ke Employee dan User
    const pendingList = await Termination.find({ status: "Waiting" })
      .populate({
        path: "employeeId",
        populate: [{ path: "userId" }, { path: "positionId" }, { path: "bidangId" }],
      })
      .sort({ createdAt: -1 }); // Tampilkan dari yang paling baru diajukan

    // Render ke halaman view EJS pimpinan
    res.render("admin/approvals", {
      title: "Persetujuan PHK",
      pendingList,
    });
  } catch (error) {
    console.error("Error listPendingApprovals:", error);
    res.status(500).send("Terjadi kesalahan pada server saat memuat data.");
  }
};

/**
 * Memproses eksekusi persetujuan PHK oleh Pimpinan
 */
export const approvePHK = async (req, res) => {
  try {
    const { terminationId } = req.params;

    // 1. Cari data pengajuan PHK beserta data Employee terkait
    const termination = await Termination.findById(terminationId).populate("employeeId");
    if (!termination) {
      return res.status(404).send("Data pengajuan PHK tidak ditemukan.");
    }

    if (termination.status !== "Waiting") {
      return res.status(400).send("Pengajuan ini sudah diproses sebelumnya.");
    }

    // 2. Update status pengajuan di tabel Termination
    termination.status = "Approved";
    termination.approvedBy = req.user._id; // Menyimpan ID Pimpinan yang sedang login
    await termination.save();

    // 3. Eksekusi penonaktifan akun di tabel User
    await User.findByIdAndUpdate(termination.employeeId.userId, {
      isActive: false,
    });

    // Set flash message sukses (jika pakai express-flash)
    // req.flash('success', 'PHK berhasil disetujui. Hak akses karyawan otomatis dicabut.');

    res.redirect("/approvals/pending");
  } catch (error) {
    console.error("Error approvePHK:", error);
    res.status(500).send("Gagal memproses persetujuan PHK.");
  }
};
