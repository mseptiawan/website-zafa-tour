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
      documentPath = `/uploads/photos/${req.file.filename}`;
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
    res.redirect("/permit/my-history");
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal memproses pengajuan izin" });
  }
};
