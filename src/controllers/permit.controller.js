import Permit from "../models/Permit.model.js";

export const newForm = async (req, res) => {
  try {
    res.render("permit/create", {
      title: "Pengajuan Izin",
      mode: "CREATE",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createPermit = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: "Semua field wajib diisi" });
    }

    const allowedTypes = ["SAKIT", "PENDAMPINGAN_MELAHIRKAN", "MUSIBAH", "PENTING"];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Jenis izin tidak valid" });
    }

    let documentPath = null;
    if (req.file) {
      documentPath = `/uploads/files/${req.file.filename}`;
    }

    const newPermit = new Permit({
      user: req.user._id,
      type,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      document: documentPath,
    });

    await newPermit.save();
    res.redirect("/permit/my");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memproses pengajuan izin" });
  }
};
export const getIncomingPermits = async (req, res) => {
  try {
    const permits = await Permit.find().populate("user", "name role").sort({ createdAt: -1 });

    const totalPermits = await Permit.countDocuments();
    const approved = await Permit.countDocuments({ status: "APPROVED" });
    const pending = await Permit.countDocuments({ status: "PENDING" });
    const rejected = await Permit.countDocuments({ status: "REJECTED" });

    res.render("permit/approvals", {
      title: "Otorisasi Perizinan",
      permits,
      summary: {
        totalPermits,
        approved,
        pending,
        rejected,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const actionApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notesByApprover } = req.body;

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return res.status(400).json({ success: false, message: "Status tidak valid" });
    }

    const permit = await Permit.findById(id);
    if (!permit) {
      return res.status(404).json({ success: false, message: "Data pengajuan tidak ditemukan" });
    }

    permit.status = status;
    permit.approvedBy = req.user._id;
    permit.approvalDate = new Date();
    permit.notesByApprover = notesByApprover || null;

    await permit.save();
    res.redirect("/permit/incoming");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memproses keputusan perizinan" });
  }
};
